import type { CompanySourceConfig, RawJob } from './types';
import { fetchJson } from './http';

export async function fetchLeverJobs(config: CompanySourceConfig): Promise<RawJob[]> {
  const payload = await fetchJson(`https://api.lever.co/v0/postings/${encodeURIComponent(config.boardIdentifier)}?mode=json`);
  if (!Array.isArray(payload)) return [];

  return payload.map((job) => {
    const item = job as Record<string, unknown>;
    const categories = (item.categories ?? {}) as Record<string, unknown>;
    return {
      sourceJobId: typeof item.id === 'string' ? item.id : undefined,
      title: typeof item.text === 'string' ? item.text : undefined,
      companyName: config.companyName,
      location: typeof categories.location === 'string' ? categories.location : undefined,
      description: typeof item.descriptionPlain === 'string' ? item.descriptionPlain : undefined,
      department: typeof categories.team === 'string' ? categories.team : undefined,
      workMode: typeof categories.commitment === 'string' ? categories.commitment : undefined,
      employmentType: typeof categories.commitment === 'string' ? categories.commitment : undefined,
      applicationUrl: typeof item.hostedUrl === 'string' ? item.hostedUrl : undefined,
      publishedAt: typeof item.createdAt === 'number' ? new Date(item.createdAt).toISOString() : undefined,
    };
  });
}
