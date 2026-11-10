import { fetchJson } from './http';
import type { RawJob } from './types';

type ExternalSource = 'himalayas' | 'remoteok' | 'jobicy' | 'remotive';

function string(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

function stringOrNumber(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : undefined;
}

function dateFromUnixSeconds(value: unknown) {
  return typeof value === 'number' ? new Date(value * 1000).toISOString() : string(value);
}

function list(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function toRawJob(item: Record<string, unknown>, source: ExternalSource): RawJob | null {
  const title = source === 'jobicy'
    ? string(item.jobTitle)
    : string(item.title) ?? string(item.position);
  const applicationUrl = source === 'himalayas'
    ? string(item.applicationLink)
    : string(item.applicationUrl) ?? string(item.url) ?? string(item.job_url) ?? string(item.apply_url);
  if (!title || !applicationUrl) return null;
  const companyName = string(item.companyName) ?? string(item.company_name) ?? string(item.company) ?? 'Unknown company';
  const locationRestrictions = list(item.locationRestrictions);
  const locationValue = source === 'jobicy'
    ? string(item.jobGeo) ?? 'Remote'
    : string(item.location) ?? string(item.candidate_required_location) ?? locationRestrictions.join(', ');
  const location = locationValue || 'Remote';
  const description = source === 'jobicy'
    ? string(item.jobDescription) ?? string(item.jobExcerpt) ?? ''
    : string(item.description) ?? string(item.excerpt) ?? string(item.descriptionPlain) ?? string(item.job_description) ?? '';
  const categories = source === 'jobicy' ? list(item.jobIndustry) : list(item.categories);
  const employmentTypes = source === 'jobicy' ? list(item.jobType) : [];
  const salaryMin = stringOrNumber(source === 'jobicy' ? item.salaryMin : item.minSalary);
  const salaryMax = stringOrNumber(source === 'jobicy' ? item.salaryMax : item.maxSalary);
  const salaryPeriod = string(item.salaryPeriod);
  const currency = string(item.salaryCurrency) ?? string(item.currency);
  const remoteEligibility = source === 'jobicy'
    ? string(item.jobGeo)
    : locationRestrictions.join(', ') || string(item.location) || string(item.candidate_required_location);
  return {
    sourceJobId: string(item.guid) ?? string(item.id) ?? applicationUrl,
    title,
    companyName,
    location,
    country: source === 'himalayas' ? locationRestrictions.join(', ') : string(item.country),
    countryCode: string(item.countryCode) ?? string(item.country_code),
    description,
    department: categories.join(', ') || (string(item.category) ?? string(item.job_category)),
    workMode: 'remote',
    remoteEligibility,
    employmentType: employmentTypes.join(', ') || (string(item.employmentType) ?? string(item.job_type)),
    seniority: string(item.jobLevel) ?? string(item.seniority),
    applicationUrl,
    publishedAt: dateFromUnixSeconds(item.pubDate) ?? string(item.publication_date) ?? string(item.date),
    updatedAt: string(item.updatedAt),
    compensation: salaryMin || salaryMax ? `${salaryMin ?? ''}${salaryMin && salaryMax ? ' - ' : ''}${salaryMax ?? ''}${salaryPeriod ? ` / ${salaryPeriod}` : ''}` : string(item.salary) ?? string(item.salary_range),
    currency,
  };
}

function itemsFromPayload(payload: unknown, source: ExternalSource): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object');
  if (!payload || typeof payload !== 'object') {
    throw new Error(`${source} response is not an object or array`);
  }
  const record = payload as Record<string, unknown>;
  for (const key of ['jobs', 'results', 'data']) {
    if (Array.isArray(record[key])) return record[key].filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object');
  }
  throw new Error(`${source} response is missing a jobs collection`);
}

export async function fetchExternalJobs(source: ExternalSource): Promise<RawJob[]> {
  const urls: Record<ExternalSource, string> = {
    himalayas: 'https://himalayas.app/jobs/api?limit=20',
    remoteok: 'https://remoteok.com/api',
    jobicy: 'https://jobicy.com/api/jobs?count=100',
    remotive: 'https://remotive.com/api/remote-jobs?limit=100',
  };
  const payload = await fetchJson(urls[source], { headers: { Accept: 'application/json', 'User-Agent': 'CareerNova job discovery' } }, undefined, source);
  const items = itemsFromPayload(payload, source);
  const jobs = items.map((item) => toRawJob(item, source)).filter((job): job is RawJob => job !== null);
  console.log(`[Jobs] ${source} parsed job count=${jobs.length} rejected=${items.length - jobs.length}`);
  return jobs;
}
