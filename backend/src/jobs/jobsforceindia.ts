import { fetchJson } from './http';
import type { RawJob } from './types';

const endpoint = 'https://jobsforceindia.com/api/public/v1/jobs';

export type IndiaSearchCriteria = {
  countryCode?: string;
  country?: string;
  city?: string;
  state?: string;
  targetRole?: string;
  domain?: string;
  workMode?: string;
  employmentType?: string;
  experienceLevel?: string;
  skills?: string[];
};

type JobsForceResult = {
  id?: string;
  title?: string;
  hiring?: { type?: string; name?: string; employer?: string; display?: string };
  location?: { city?: string; state?: string; country?: string; remote?: boolean };
  work_mode?: string;
  job_type?: string;
  category?: string;
  salary?: { min?: number; max?: number; currency?: string; label?: string };
  experience?: { min_years?: number; max_years?: number; label?: string };
  summary?: string;
  url?: string;
  apply_url?: string;
  posted_date?: string;
  valid_through?: string;
  description?: string;
  qualifications?: string[];
  skills?: string[];
  skills_preferred?: string[];
};

function isIndia(criteria: IndiaSearchCriteria) {
  return criteria.countryCode?.toUpperCase() === 'IN'
    || criteria.country?.trim().toLowerCase() === 'india'
    || Boolean(criteria.city || criteria.state);
}

function normalizeWorkMode(value?: string) {
  const mode = value?.toLowerCase().replace(/[-_]/g, ' ').trim() ?? '';
  if (mode.includes('remote') || mode.includes('work from home') || mode === 'wfh') return 'remote';
  if (mode.includes('hybrid')) return 'hybrid';
  if (mode.includes('onsite') || mode.includes('on site') || mode.includes('office')) return 'onsite';
  return value;
}

function normalizeJobType(value?: string) {
  const type = value?.toLowerCase().replace(/[-_]/g, ' ').trim() ?? '';
  if (type.includes('intern')) return 'internship';
  if (type.includes('part time')) return 'part-time';
  if (type.includes('contract')) return 'contract';
  if (type.includes('full time')) return 'full-time';
  return value;
}

function locationQuery(criteria: IndiaSearchCriteria) {
  return criteria.city?.trim() || criteria.state?.trim();
}

function experienceYears(value?: string) {
  if (value?.toLowerCase().includes('fresh') || value?.includes('0–2') || value?.includes('0-2')) return '0';
  const match = value?.match(/\d+/);
  return match?.[0];
}

function toRawJob(item: JobsForceResult): RawJob | null {
  if (!item.id || !item.title || !item.url) return null;
  const hiringName = item.hiring?.type === 'agency'
    ? item.hiring.display ?? 'JobsForce India (confidential client)'
    : item.hiring?.employer ?? item.hiring?.name ?? 'JobsForce India';
  const location = [item.location?.city, item.location?.state, item.location?.country].filter(Boolean).join(', ') || 'India';
  const salary = item.salary?.label
    ?? (item.salary?.min || item.salary?.max ? `${item.salary.min ?? ''} - ${item.salary.max ?? ''}` : undefined);
  return {
    sourceJobId: item.id,
    title: item.title,
    companyName: hiringName,
    location,
    country: item.location?.country ?? 'India',
    countryCode: 'IN',
    description: item.description ?? item.summary,
    department: item.category,
    workMode: normalizeWorkMode(item.work_mode),
    employmentType: normalizeJobType(item.job_type),
    seniority: item.experience?.label,
    requiredExperience: item.experience?.label,
    requiredSkills: item.skills,
    preferredSkills: item.skills_preferred,
    qualifications: item.qualifications,
    compensation: salary,
    currency: item.salary?.currency,
    applicationUrl: item.apply_url ?? item.url,
    publishedAt: item.posted_date,
    updatedAt: item.valid_through,
  };
}

async function search(params: URLSearchParams) {
  const payload = await fetchJson(`${endpoint}?${params.toString()}`, {
    headers: { Accept: 'application/json', 'User-Agent': 'CareerNova job discovery' },
  }, 15_000, 'jobsforceindia');
  if (!payload || typeof payload !== 'object' || !Array.isArray((payload as { results?: unknown }).results)) {
    throw new Error('jobsforceindia response is missing a results collection');
  }
  return (payload as { results: JobsForceResult[] }).results;
}

async function fetchDetails(id: string) {
  const payload = await fetchJson(`https://jobsforceindia.com/api/public/v1/jobs/${encodeURIComponent(id)}`, {
    headers: { Accept: 'application/json', 'User-Agent': 'CareerNova job discovery' },
  }, 15_000, 'jobsforceindia');
  return payload && typeof payload === 'object' ? payload as JobsForceResult : undefined;
}

export async function fetchJobsForceIndiaJobs(criteria: IndiaSearchCriteria): Promise<RawJob[]> {
  if (!isIndia(criteria)) return [];
  const role = criteria.targetRole?.trim() || 'software developer';
  const city = locationQuery(criteria);
  const skills = (criteria.skills ?? []).slice(0, 2).join(' ');
  const workMode = normalizeWorkMode(criteria.workMode);
  const jobType = normalizeJobType(criteria.employmentType);
  const experience = experienceYears(criteria.experienceLevel);
  const searches = [
    { q: role, city },
    ...(skills ? [{ q: `${role} ${skills}`, city }] : []),
    ...(city ? [{ q: role, city: undefined }] : []),
  ].slice(0, 3);
  const results = new Map<string, JobsForceResult>();
  for (const searchCriteria of searches) {
    const params = new URLSearchParams({ per_page: '20', page: '1', q: searchCriteria.q });
    if (searchCriteria.city) params.set('city', searchCriteria.city);
    if (workMode) params.set('work_mode', workMode);
    if (jobType) params.set('job_type', jobType);
    if (experience) params.set('experience_years', experience);
    (await search(params)).forEach((job) => {
      if (job.id) results.set(job.id, job);
    });
  }
  const jobs: RawJob[] = [];
  for (const summary of results.values()) {
    const details = await fetchDetails(summary.id ?? '');
    const job = toRawJob({ ...summary, ...details });
    if (job) jobs.push(job);
  }
  console.log(`[Jobs] jobsforceindia fetched: ${jobs.length}`);
  return jobs;
}
