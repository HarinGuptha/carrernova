import { collection, limit, onSnapshot, query } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import type { Job } from '../types/job';

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function asStringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function normalizeRecommendation(id: string, data: Record<string, unknown>): Job {
  const companyName = asString(data.companyName, 'Company');
  const title = asString(data.title, 'Opportunity');
  const location = asString(data.location, 'Location not specified');
  const requiredSkills = asStringList(data.requiredSkills);
  return {
    id,
    source: data.source === 'greenhouse' || data.source === 'lever' || data.source === 'ashby'
      || data.source === 'himalayas' || data.source === 'remoteok' || data.source === 'jobicy' || data.source === 'remotive' || data.source === 'jobsforceindia' || data.source === 'activevacancies' || data.source === '101careers' || data.source === 'egig' || data.source === 'remoshift' || data.source === 'company'
      ? data.source
      : 'company',
    sourceJobId: asString(data.sourceJobId, id),
    companyId: asString(data.companyId, 'unknown'),
    companyName,
    title,
    location,
    country: asString(data.country) || undefined,
    countryCode: asString(data.countryCode) || undefined,
    secondaryLocations: asStringList(data.secondaryLocations),
    description: asString(data.description),
    department: asString(data.department) || undefined,
    team: asString(data.team) || undefined,
    remoteEligibility: asString(data.remoteEligibility) || undefined,
    seniority: asString(data.seniority) || undefined,
    requiredExperience: asString(data.requiredExperience) || undefined,
    preferredSkills: asStringList(data.preferredSkills),
    qualifications: asStringList(data.qualifications),
    compensation: asString(data.compensation) || undefined,
    currency: asString(data.currency) || undefined,
    workMode: data.workMode === 'remote' || data.workMode === 'hybrid' || data.workMode === 'onsite'
      ? data.workMode
      : 'unknown',
    employmentType: data.employmentType === 'full-time' || data.employmentType === 'part-time'
      || data.employmentType === 'internship' || data.employmentType === 'contract'
      ? data.employmentType
      : 'unknown',
    requiredSkills,
    applicationUrl: asString(data.applicationUrl),
    publishedAt: asString(data.publishedAt) || undefined,
    updatedAt: asString(data.updatedAt) || undefined,
    fetchedAt: asString(data.fetchedAt),
    isActive: data.isActive !== false,
    searchText: asString(data.searchText, `${title} ${companyName} ${location}`),
    matchScore: typeof data.matchScore === 'number' ? data.matchScore : undefined,
    matchedSkills: asStringList(data.matchedSkills),
    missingSkills: asStringList(data.missingSkills),
    matchReasons: asStringList(data.matchReasons),
  };
}

export function subscribeToPersonalizedJobs(
  uid: string,
  onChange: (jobs: Job[]) => void,
  onError: (error: Error) => void,
) {
  if (__DEV__) {
    console.log('[Jobs] recommendation query:', `users/${uid}/jobRecommendations`, {
      uid,
      filters: 'none',
      limit: 100,
    });
  }
  const recommendationsQuery = query(
    collection(firestore, 'users', uid, 'jobRecommendations'),
    limit(100),
  );

  return onSnapshot(
    recommendationsQuery,
    (snapshot) => {
      if (__DEV__) console.log('[Jobs] recommendation documents received:', snapshot.size);
      if (__DEV__) {
        snapshot.docs.forEach((recommendation) => {
          const data = recommendation.data();
          console.log('[Jobs] recommendation:', {
            documentId: recommendation.id,
            jobId: typeof data.jobId === 'string' ? data.jobId : recommendation.id,
            matchScore: typeof data.matchScore === 'number' ? data.matchScore : null,
          });
        });
      }
      const jobs = snapshot.docs.map((recommendation) => {
        const data = recommendation.data();
        if (__DEV__) {
          console.log('[Jobs] resolved recommendation job:', {
            jobId: recommendation.id,
            company: data.companyName ?? '',
            title: data.title ?? '',
            location: data.location ?? '',
            source: data.source ?? '',
          });
        }
        const job = normalizeRecommendation(recommendation.id, data);
        if (__DEV__) console.log('[Jobs] normalized recommendation object:', job);
        return job;
      });
      if (__DEV__) {
        console.log('[Jobs] personalized jobs resolved:', jobs.length);
        const companyCounts = new Map<string, number>();
        jobs.forEach((job) => companyCounts.set(job.companyName, (companyCounts.get(job.companyName) ?? 0) + 1));
        console.log('[Jobs] recommendation companies:');
        [...companyCounts.entries()].sort(([left], [right]) => left.localeCompare(right))
          .forEach(([company, count]) => console.log(`${company}: ${count}`));
      }
      onChange(jobs);
    },
    onError,
  );
}
