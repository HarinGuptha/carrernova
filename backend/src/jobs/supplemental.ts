import { fetchJson } from './http';
import type { RawJob } from './types';
import type { IndiaSearchCriteria } from './jobsforceindia';

type Source = 'activevacancies' | '101careers' | 'egig' | 'remoshift';

function isIndia(criteria: IndiaSearchCriteria) {
  return criteria.countryCode?.toUpperCase() === 'IN' || criteria.country?.toLowerCase() === 'india'
    || Boolean(criteria.city || criteria.state);
}

function text(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function mode(value: unknown) {
  const normalized = text(value)?.toLowerCase().replace(/[-_]/g, ' ');
  if (!normalized) return undefined;
  if (normalized.includes('remote') || normalized.includes('wfh')) return 'remote';
  if (normalized.includes('hybrid')) return 'hybrid';
  if (normalized.includes('onsite') || normalized.includes('on site') || normalized.includes('office')) return 'onsite';
  return undefined;
}

function jobType(value: unknown) {
  const normalized = text(value)?.toLowerCase().replace(/[-_]/g, ' ');
  if (!normalized) return undefined;
  if (normalized.includes('intern')) return 'internship';
  if (normalized.includes('part time')) return 'part-time';
  if (normalized.includes('contract')) return 'contract';
  if (normalized.includes('full time')) return 'full-time';
  return undefined;
}

function toRaw(item: Record<string, unknown>, source: Source): RawJob | null {
  const title = text(item.title);
  const applicationUrl = text(item.apply_url) ?? text(item.url) ?? text(item.detail_url);
  if (!title || !applicationUrl) return null;
  const location = typeof item.location === 'object' && item.location
    ? [text((item.location as Record<string, unknown>).city), text((item.location as Record<string, unknown>).state), text((item.location as Record<string, unknown>).country)].filter(Boolean).join(', ')
    : text(item.location);
  const company = text(item.company) ?? text(item.company_name) ?? (source === 'egig' ? 'eGig listing' : source);
  const skills = Array.isArray(item.skills) ? item.skills.filter((value): value is string => typeof value === 'string') : undefined;
  return {
    sourceJobId: text(item.id) ?? applicationUrl,
    title,
    companyName: company,
    location: location || 'India',
    country: text(item.country) ?? (source === '101careers' || source === 'egig' ? 'India' : undefined),
    countryCode: text(item.countryCode) ?? (source === '101careers' || source === 'egig' ? 'IN' : undefined),
    description: text(item.description) ?? text(item.summary),
    department: text(item.category),
    workMode: mode(item.work_mode ?? item.workModel ?? item.remote),
    employmentType: jobType(item.employment_type ?? item.job_type),
    seniority: text(item.seniority),
    requiredExperience: text(item.experience),
    requiredSkills: skills,
    qualifications: Array.isArray(item.qualifications) ? item.qualifications.filter((value): value is string => typeof value === 'string') : undefined,
    compensation: text(item.salary) ?? text(item.salary_label),
    currency: text(item.salary_currency),
    applicationUrl,
    publishedAt: text(item.posted_at) ?? text(item.published_at),
    updatedAt: text(item.updated_at),
  };
}

async function get(url: string, source: Source) {
  return fetchJson(url, { headers: { Accept: 'application/json', 'User-Agent': 'CareerNova job discovery' } }, 15_000, source);
}

function query(criteria: IndiaSearchCriteria) {
  return [criteria.targetRole, criteria.domain, ...(criteria.skills ?? []).slice(0, 2)].filter(Boolean).join(' ');
}

export async function fetchSupplementalJobs(source: Source, criteria: IndiaSearchCriteria): Promise<RawJob[]> {
  const india = isIndia(criteria);
  if ((source === '101careers' || source === 'egig') && !india) return [];
  const q = encodeURIComponent(query(criteria) || 'software engineering');
  const city = encodeURIComponent(criteria.city ?? criteria.state ?? '');
  const urls: Record<Source, string> = {
    activevacancies: `https://activevacancies.com/api/v1/jobs?q=${q}&location=${india ? 'India' : ''}&limit=20`,
    '101careers': `https://101.careers/api/v1/jobs?country=India&per_page=100&page=1`,
    egig: `https://egig.in/api/open/jobs?q=${q}${city ? `&location=${city}` : ''}&limit=10`,
    remoshift: `https://remoshift.com/api/v1/jobs.open?q=${q}&country=${india ? 'IN' : ''}&per=25&page=1`,
  };
  const payload = await get(urls[source], source);
  const records = payload && typeof payload === 'object'
    ? (payload as Record<string, unknown>).jobs
      ?? (payload as Record<string, unknown>).results
      ?? (payload as Record<string, unknown>).data
    : undefined;
  if (!Array.isArray(records)) throw new Error(`${source} response is missing a jobs collection`);
  return records
    .filter((record): record is Record<string, unknown> => Boolean(record) && typeof record === 'object')
    .map((record) => toRaw(record, source))
    .filter((job): job is RawJob => job !== null);
}
