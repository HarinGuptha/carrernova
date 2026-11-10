import type { CompanySourceConfig, RawJob } from './types';
import { fetchJson } from './http';

export async function fetchGreenhouseJobs(config: CompanySourceConfig): Promise<RawJob[]> {
  const payload = await fetchJson(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(config.boardIdentifier)}/jobs?content=true`);
  if (!payload || typeof payload !== 'object' || !Array.isArray((payload as { jobs?: unknown }).jobs)) return [];

  return (payload as { jobs: Array<Record<string, unknown>> }).jobs.map((job) => ({
    sourceJobId: typeof job.id === 'number' ? String(job.id) : undefined,
    title: typeof job.title === 'string' ? job.title : undefined,
    companyName: config.companyName,
    location: typeof job.location === 'object' && job.location !== null && 'name' in job.location
      ? String(job.location.name)
      : undefined,
    description: typeof job.content === 'string' ? job.content : undefined,
    department: Array.isArray(job.departments) ? job.departments.map(String).join(', ') : undefined,
    applicationUrl: typeof job.absolute_url === 'string' ? job.absolute_url : undefined,
    updatedAt: typeof job.updated_at === 'string' ? job.updated_at : undefined,
  }));
}
