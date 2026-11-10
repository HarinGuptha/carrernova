import type { CompanySourceConfig, RawJob } from './types';
import { fetchJson } from './http';

export async function fetchAshbyJobs(config: CompanySourceConfig): Promise<RawJob[]> {
  const payload = await fetchJson(`https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(config.boardIdentifier)}`);
  if (!payload || typeof payload !== 'object' || !Array.isArray((payload as { jobs?: unknown }).jobs)) return [];

  return (payload as { jobs: Array<Record<string, unknown>> }).jobs.map((job) => ({
    sourceJobId: typeof job.jobUrl === 'string' ? job.jobUrl : undefined,
    title: typeof job.title === 'string' ? job.title : undefined,
    companyName: config.companyName,
    location: typeof job.location === 'string' ? job.location : undefined,
    description: typeof job.descriptionPlain === 'string' ? job.descriptionPlain : undefined,
    department: typeof job.department === 'string' ? job.department : undefined,
    workMode: typeof job.workplaceType === 'string' ? job.workplaceType : undefined,
    employmentType: typeof job.employmentType === 'string' ? job.employmentType : undefined,
    applicationUrl: typeof job.applyUrl === 'string' ? job.applyUrl : undefined,
    publishedAt: typeof job.publishedAt === 'string' ? job.publishedAt : undefined,
  }));
}
