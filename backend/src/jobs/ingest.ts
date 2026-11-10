import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { companySources } from './companies';
import { fetchAshbyJobs } from './ashby';
import { fetchGreenhouseJobs } from './greenhouse';
import { fetchLeverJobs } from './lever';
import { normalizeJob } from './normalize';
import { fetchExternalJobs } from './external';
import { fetchJobsForceIndiaJobs, type IndiaSearchCriteria } from './jobsforceindia';
import { fetchSupplementalJobs } from './supplemental';
import type { CompanySourceConfig, Job, RawJob } from './types';

async function fetchSource(config: CompanySourceConfig): Promise<RawJob[]> {
  if (config.source === 'greenhouse') return fetchGreenhouseJobs(config);
  if (config.source === 'lever') return fetchLeverJobs(config);
  return fetchAshbyJobs(config);
}

export async function fetchConfiguredJobs(indiaCriteria?: IndiaSearchCriteria) {
  const fetchedAt = new Date().toISOString();
  const jobs = new Map<string, Job>();
  const jobsByApplicationUrl = new Map<string, Job>();
  const failures: string[] = [];
  const addJob = (job: Job) => {
    const canonicalUrl = job.applicationUrl.toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/[?#].*$/, '').replace(/\/$/, '');
    const existing = jobsByApplicationUrl.get(canonicalUrl);
    if (existing && existing.description.length >= job.description.length) return;
    if (existing) jobs.delete(existing.id);
    jobsByApplicationUrl.set(canonicalUrl, job);
    jobs.set(job.id, job);
  };

  for (const config of companySources.filter((item) => item.enabled && item.boardIdentifier && item.verified !== false)) {
    const sourceLabel = `${config.source}:${config.companyId}`;
    console.log(`[Jobs] fetching source: ${sourceLabel}`);
    try {
      const sourceJobs = await fetchSource(config);
      console.log(`[Jobs] source fetched: ${sourceLabel}: ${sourceJobs.length}`);
      let normalizedCount = 0;
      for (const rawJob of sourceJobs) {
        const job = normalizeJob(rawJob, config, fetchedAt);
        if (job) {
          addJob(job);
          normalizedCount += 1;
        }

      }
      console.log(`[Jobs] source normalized: ${sourceLabel}: ${normalizedCount}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown source error';
      failures.push(`${config.source}:${config.companyId}`);
      console.error(`[Jobs] source failed: ${sourceLabel}: ${message}`);
    }
  }

  const externalSources = ['himalayas', 'remoteok', 'jobicy', 'remotive'] as const;
  for (const source of externalSources) {
    try {
      const sourceJobs = await fetchExternalJobs(source);
      console.log(`[Jobs] source fetched: ${source}: ${sourceJobs.length}`);
      let normalizedCount = 0;
      for (const rawJob of sourceJobs) {
        const job = normalizeJob(rawJob, {
          companyId: source,
          companyName: rawJob.companyName ?? source,
          source,
          boardIdentifier: source,
          enabled: true,
          verified: true,
        }, fetchedAt);
        if (job) {
          addJob(job);
          normalizedCount += 1;
        }
      }
      console.log(`[Jobs] source normalized: ${source}: ${normalizedCount}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown source error';
      failures.push(source);
      console.error(`[Jobs] source failed: ${source}: ${message}`);
    }
  }

  if (indiaCriteria) {
    try {
      const sourceJobs = await fetchJobsForceIndiaJobs(indiaCriteria);
      let normalizedCount = 0;
      for (const rawJob of sourceJobs) {
        const job = normalizeJob(rawJob, {
          companyId: 'jobsforceindia',
          companyName: rawJob.companyName ?? 'JobsForce India',
          source: 'jobsforceindia',
          boardIdentifier: 'jobsforceindia',
          enabled: true,
          verified: true,
        }, fetchedAt);
        if (job) {
          addJob(job);
          normalizedCount += 1;
        }

        const supplementalSources = ['activevacancies', '101careers', 'egig', 'remoshift'] as const;
        for (const source of supplementalSources) {
          try {
            const sourceJobs = await fetchSupplementalJobs(source, indiaCriteria ?? {});
            console.log(`[Jobs] source fetched: ${source}: ${sourceJobs.length}`);
            let normalizedCount = 0;
            for (const rawJob of sourceJobs) {
              const job = normalizeJob(rawJob, {
                companyId: source,
                companyName: rawJob.companyName ?? source,
                source,
                boardIdentifier: source,
                enabled: true,
                verified: true,
              }, fetchedAt);
              if (job) {
                addJob(job);
                normalizedCount += 1;
              }
            }
            console.log(`[Jobs] source normalized: ${source}: ${normalizedCount}`);
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown source error';
            failures.push(source);
            console.error(`[Jobs] source failed: ${source}: ${message}`);
          }
        }
      }
      console.log(`[Jobs] jobsforceindia normalized: ${normalizedCount}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown source error';
      failures.push('jobsforceindia');
      console.error(`[Jobs] source failed: jobsforceindia: ${message}`);
    }
  }

  const jobList = [...jobs.values()];
  console.log(`[Jobs] all sources fetched: total=${jobList.length}`);
  return { jobs: jobList, failures };
}

/**
 * Legacy developer ingestion path. Personalized recommendations use
 * fetchConfiguredJobs() and do not depend on the global jobs collection.
 */
export async function ingestJobs() {
  const firestore = getFirestore();
  const { jobs: jobList, failures } = await fetchConfiguredJobs();
  for (let index = 0; index < jobList.length; index += 400) {
    console.log(`[Jobs] Firestore write started: ${index + 1}-${Math.min(index + 400, jobList.length)}`);
    const batch = firestore.batch();
    for (const job of jobList.slice(index, index + 400)) {
      batch.set(firestore.doc(`jobs/${job.id}`), { ...job, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    }
    if (jobList.length) {
      await batch.commit();
      console.log(`[Jobs] Firestore write completed: ${index + 1}-${Math.min(index + 400, jobList.length)}`);
    }
  }

  return { fetched: jobList.length, failedSources: failures };
}
