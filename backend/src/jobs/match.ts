import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { fetchConfiguredJobs } from './ingest';
import type { IndiaSearchCriteria } from './jobsforceindia';
import type { Job } from './types';

type CandidateData = {
  reviewedProfile?: {
    skills?: string[];
    education?: string[];
    experience?: string[];
    projects?: string[];
    certifications?: string[];
    headline?: string;
  };
  preferences?: {
    targetRole?: string;
    domain?: string;
    dreamCompany?: string;
    location?: string;
    country?: string;
    workMode?: string;
    employmentType?: string;
    experienceLevel?: string;
    locationDetails?: { country?: string; countryCode?: string; city?: string };
  };
};

type MatchDiagnostics = {
  locationEligible: number;
  workModeEligible: number;
  domainRelevant: number;
  roleRelevant: number;
  experienceCompatible: number;
  skillRelevant: number;
};

type ScoreBreakdown = {
  roleScore: number;
  domainScore: number;
  locationScore: number;
  workModeScore: number;
  experienceScore: number;
  skillScore: number;
  companyPreferenceScore: number;
  finalScore: number | null;
};

export type JobRecommendation = {
  jobId: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  matchReasons: string[];
  source: Job['source'];
  companyId: string;
  companyName: string;
  title: string;
  location: string;
  country?: string;
  countryCode?: string;
  secondaryLocations?: string[];
  workMode: Job['workMode'];
  remoteEligibility?: string;
  employmentType: Job['employmentType'];
  seniority?: string;
  requiredExperience?: string;
  description: string;
  requiredSkills: string[];
  preferredSkills?: string[];
  qualifications?: string[];
  compensation?: string;
  currency?: string;
  applicationUrl: string;
  searchText: string;
  sourceJobId: string;
  fetchedAt: string;
  isActive: boolean;
  publishedAt?: string;
  updatedAt?: string | FirebaseFirestore.FieldValue;
  createdAt?: FirebaseFirestore.FieldValue;
  generatedAt: FirebaseFirestore.FieldValue;
};

const activeGenerations = new Map<string, Promise<number>>();

function text(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase().replace(/\s+/g, ' ') : '';
}

function list(values: unknown) {
  return Array.isArray(values) ? values.filter((value): value is string => typeof value === 'string').map(text).filter(Boolean) : [];
}

function containsTerm(haystack: string, needle: string) {
  return needle.length > 1 && haystack.includes(needle);
}

function canonicalDomain(value: string) {
  const normalized = text(value);
  if (['software', 'software engineering', 'technology', 'tech', 'information technology', 'it'].includes(normalized)) return 'software';
  if (['data', 'data science', 'analytics'].includes(normalized)) return 'data';
  if (['finance', 'financial services', 'banking', 'accounting'].includes(normalized)) return 'finance';
  return normalized;
}

function canonicalRole(value: string) {
  const normalized = text(value);
  if (['sde', 'software engineer', 'software developer', 'backend developer', 'frontend developer', 'full stack developer', 'full-stack developer'].includes(normalized)) return 'software engineering';
  return normalized;
}

const domainTerms: Record<string, string[]> = {
  finance: ['finance', 'financial', 'banking', 'investment', 'accounting', 'risk', 'fintech', 'audit'],
  software: ['software', 'engineering', 'developer', 'programming', 'backend', 'frontend', 'mobile', 'web'],
  data: ['data', 'analytics', 'analyst', 'machine learning', 'artificial intelligence', 'ml', 'bi'],
  design: ['design', 'ux', 'ui', 'product design', 'visual'],
  marketing: ['marketing', 'growth', 'content', 'brand', 'seo', 'social media'],
  sales: ['sales', 'account executive', 'business development', 'partnerships'],
};

function normalizedLocation(value: string) {
  return text(value)
    .replace(/\bunited states of america\b|\bunited states\b|\busa\b|\bus\b|\bamerica\b/g, 'united states')
    .replace(/\b(remote|hybrid|on[- ]?site|office)\b/g, ' ')
    .replace(/[|/,-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countryMatches(candidateCountry: string, jobLocation: string, jobCountry: string, jobCountryCode: string) {
  if (!candidateCountry) return false;
  if (jobCountry.includes(candidateCountry) || jobLocation.includes(candidateCountry)) return true;
  if (candidateCountry === 'india') {
    return jobCountryCode === 'in' || jobLocation.includes('bengaluru') || jobLocation.includes('bangalore')
      || jobLocation.includes('hyderabad') || jobLocation.includes('mumbai') || jobLocation.includes('pune')
      || jobLocation.includes('delhi') || jobLocation.includes('gurugram') || jobLocation.includes('gurgaon')
      || jobLocation.includes('noida') || jobLocation.includes('chennai') || jobLocation.includes('kolkata')
      || jobLocation.includes('ahmedabad') || jobLocation.includes('visakhapatnam');
  }
  return false;
}

function locationMatches(candidateLocation: string, jobLocation: string, jobWorkMode: string) {
  const candidate = normalizedLocation(candidateLocation);
  const job = normalizedLocation(jobLocation);
  if (!candidate || !job) return false;
  if (jobWorkMode === 'remote' && (job.includes(candidate) || candidate.includes(job))) return true;
  const candidateParts = candidate.split(' ').filter((part) => part.length > 2);
  return candidateParts.some((part) => job.includes(part));
}

function preferredWorkModes(value: string) {
  if (!value || value.includes('any work mode') || value === 'any') return [];
  return value.split(/[,/&]| or /i).map((item) => {
    const mode = text(item);
    if (mode.includes('work from home') || mode.includes('wfh')) return 'remote';
    if (mode.includes('on-site') || mode.includes('onsite')) return 'onsite';
    return mode;
  }).filter(Boolean);
}

function experienceYears(candidate: CandidateData) {
  const preference = text(candidate.preferences?.experienceLevel);
  const numericPreference = Number(preference);
  if (Number.isFinite(numericPreference) && numericPreference >= 0) return numericPreference;
  const evidence = text([
    ...(candidate.reviewedProfile?.experience ?? []),
    ...(candidate.reviewedProfile?.projects ?? []),
    candidate.preferences?.experienceLevel,
  ].join(' '));
  const matches = [...evidence.matchAll(/(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)/g)];
  return matches.reduce((max, match) => Math.max(max, Number(match[1])), 0);
}

function requiredExperienceYears(job: Job) {
  const matches = [...text(`${job.title} ${job.description}`).matchAll(/(\d+)\s*(?:-|to)\s*(\d+)|(\d+)\s*\+?\s*(?:years?|yrs?)/g)];
  return matches.reduce((max, match) => Math.max(max, Number(match[2] ?? match[3] ?? match[1] ?? 0)), 0);
}

function domainMatch(domain: string, jobText: string) {
  const terms = domainTerms[canonicalDomain(domain)] ?? [canonicalDomain(domain)];
  return terms.some((term) => containsTerm(jobText, term));
}

function roleMatch(role: string, title: string) {
  const canonical = canonicalRole(role);
  const normalizedTitle = text(title);
  if (!canonical) return true;
  if (canonical === 'software engineering') {
    return ['software', 'developer', 'engineer', 'sde', 'backend', 'frontend', 'full stack', 'mobile'].some((term) => containsTerm(normalizedTitle, term));
  }
  return containsTerm(normalizedTitle, canonical)
    || canonical.split(/\s+/).some((term) => term.length > 2 && containsTerm(normalizedTitle, term));
}

function scoreJob(
  job: Job,
  candidate: CandidateData,
  diagnostics?: MatchDiagnostics,
  breakdown?: ScoreBreakdown,
): Omit<JobRecommendation, 'generatedAt'> | null {
  const profile = candidate.reviewedProfile ?? {};
  const preferences = candidate.preferences ?? {};
  const jobText = text([job.title, job.description, job.department, job.location, job.country, job.remoteEligibility].join(' '));
  const candidateSkills = list(profile.skills);
  const jobSkills = list(job.requiredSkills);
  const matchedSkills = candidateSkills.filter((skill) => jobSkills.some((required) => required === skill || containsTerm(jobText, skill)));
  const skillRelevant = jobSkills.length
    ? matchedSkills.length > 0
    : candidateSkills.some((skill) => containsTerm(jobText, skill));
  const missingSkills = jobSkills.filter((skill) => !matchedSkills.includes(skill));
  const reasons: string[] = [];
  let score = 0;
  const candidateLocation = text(preferences.locationDetails?.city || preferences.location);
  const candidateCountry = text(preferences.locationDetails?.country || '');
  const candidateCountryCode = text(preferences.locationDetails?.countryCode);
  const hasSpecificCity = Boolean(preferences.locationDetails?.city);
  const jobLocation = normalizedLocation(job.location);
  const modes = preferredWorkModes(text(preferences.workMode));
  const jobMode = text(job.workMode).replace('on-site', 'onsite');
  const hasLocationPreference = Boolean(candidateLocation);
  const hasModePreference = modes.length > 0;
  const jobCountry = normalizedLocation(job.country ?? '');
  const jobLocationText = normalizedLocation([job.location, job.country].filter(Boolean).join(' '));
  const locationMatch = locationMatches(candidateLocation, jobLocationText, jobMode)
    || (!hasSpecificCity && countryMatches(candidateCountry, jobLocationText, jobCountry, text(job.countryCode)))
    || (jobMode === 'remote' && countryMatches(candidateCountry, jobLocationText, jobCountry, text(job.countryCode)))
    || (!hasSpecificCity && Boolean(candidateCountryCode && text(job.countryCode) === candidateCountryCode))
    || (jobMode === 'remote' && Boolean(candidateCountryCode && text(job.countryCode) === candidateCountryCode));
  const modeMatch = modes.includes(jobMode) || (jobMode === 'remote' && modes.includes('remote'));
  const targetRole = canonicalRole(preferences.targetRole ?? '');
  const roleRelevant = roleMatch(targetRole, job.title);
  const domain = canonicalDomain(preferences.domain ?? '');
  const domainRelevant = !domain || domainMatch(domain, jobText);

  if (hasLocationPreference && !locationMatch && jobMode !== 'remote') {
    if (breakdown) breakdown.finalScore = null;
    return null;
  }
  if (diagnostics) diagnostics.locationEligible += 1;
  if (hasModePreference && !modeMatch && jobMode !== 'unknown') {
    if (breakdown) breakdown.finalScore = null;
    return null;
  }
  if (diagnostics) diagnostics.workModeEligible += 1;
  if ((targetRole && !roleRelevant || domain && !domainRelevant) && !skillRelevant) {
    if (breakdown) breakdown.finalScore = null;
    return null;
  }

  if (jobSkills.length) {
    const skillScore = Math.min(42, Math.round((matchedSkills.length / jobSkills.length) * 42));
    score += skillScore;
    if (breakdown) breakdown.skillScore = skillScore;
    if (matchedSkills.length) reasons.push(`${matchedSkills.length} skill match${matchedSkills.length === 1 ? '' : 'es'}`);
  } else if (candidateSkills.some((skill) => containsTerm(jobText, skill))) {
    score += 20;
    if (breakdown) breakdown.skillScore = 20;
    reasons.push('Resume skills appear in the role');
  } else if (breakdown) {
    breakdown.skillScore = 0;
  }
  if (diagnostics && skillRelevant) {
    diagnostics.skillRelevant += 1;
  }

  if (diagnostics && roleRelevant) diagnostics.roleRelevant += 1;
  if (targetRole && roleRelevant) {
    score += 24;
    if (breakdown) breakdown.roleScore = 24;
    reasons.push('Target role matches');
  } else if (breakdown) {
    breakdown.roleScore = 0;
  }

  if (diagnostics && domainRelevant) diagnostics.domainRelevant += 1;
  if (domain && domainRelevant) {
    score += 10;
    if (breakdown) breakdown.domainScore = 10;
    reasons.push(`${preferences.domain} domain match`);
  } else if (domain) {
    score -= 10;
    if (breakdown) breakdown.domainScore = -10;
  } else if (breakdown) {
    breakdown.domainScore = 0;
  }

  const dreamCompany = text(preferences.dreamCompany);
  if (dreamCompany && text(job.companyName).includes(dreamCompany)) {
    score += 8;
    if (breakdown) breakdown.companyPreferenceScore = 8;
    reasons.push('Dream company match');
  } else if (breakdown) {
    breakdown.companyPreferenceScore = 0;
  }

  if (hasLocationPreference && locationMatch) {
    score += 15;
    if (breakdown) breakdown.locationScore = 15;
    reasons.push(`${preferences.location} location match`);
  } else if (hasLocationPreference && jobMode === 'remote') {
    score += 5;
    if (breakdown) breakdown.locationScore = 5;
    reasons.push('Remote role can work from your preferred location');
  } else if (breakdown) {
    breakdown.locationScore = 0;
  }

  if (hasModePreference && modeMatch) {
    score += 10;
    if (breakdown) breakdown.workModeScore = 10;
    reasons.push('Preferred work mode matches');
  } else if (breakdown) {
    breakdown.workModeScore = 0;
  }

  const experienceLevel = text(preferences.experienceLevel);
  const candidateYears = experienceYears(candidate);
  const requiredYears = requiredExperienceYears(job);
  if (experienceLevel.includes('fresh') || experienceLevel.includes('entry')) {
    if (requiredYears <= 1) {
      if (diagnostics) diagnostics.experienceCompatible += 1;
      score += 3;
      if (breakdown) breakdown.experienceScore = 3;
      reasons.push('Suitable for early-career experience');
    } else {
      if (breakdown) breakdown.finalScore = null;
      return null;
    }
  } else if (requiredYears > 0 && candidateYears >= requiredYears) {
    if (diagnostics) diagnostics.experienceCompatible += 1;
    score += 5;
    if (breakdown) breakdown.experienceScore = 5;
    reasons.push('Experience level fits the role');
  } else if (requiredYears > candidateYears + 1) {
    if (diagnostics) diagnostics.experienceCompatible += 1;
    score -= 8;
    if (breakdown) breakdown.experienceScore = -8;
  } else if (diagnostics) {
    diagnostics.experienceCompatible += 1;
    if (breakdown) breakdown.experienceScore = 0;
  } else if (breakdown) {
    breakdown.experienceScore = 0;
  }

  if (profile.education?.length || profile.projects?.length || profile.certifications?.length || profile.experience?.length) {
    score += 5;
    reasons.push('Profile evidence is available');
  }

  const educationText = text((profile.education ?? []).join(' '));
  const educationRequirement = text(`${job.title} ${job.description}`);
  if (educationText && ['computer science', 'engineering', 'finance', 'accounting', 'mba'].some((term) => educationRequirement.includes(term) && educationText.includes(term))) {
    score += 3;
    reasons.push('Education aligns with the role');
  }

  const finalScore = Math.max(0, Math.min(100, score));
  if (breakdown) breakdown.finalScore = finalScore;
  return {
    jobId: job.id,
    matchScore: finalScore,
    matchedSkills: matchedSkills.map((skill) => jobSkills.find((item) => item === skill) ?? skill),
    missingSkills,
    matchReasons: reasons,
    source: job.source,
    companyId: job.companyId,
    companyName: job.companyName,
    title: job.title,
    location: job.location,
    ...(job.country ? { country: job.country } : {}),
    ...(job.countryCode ? { countryCode: job.countryCode } : {}),
    ...(job.secondaryLocations ? { secondaryLocations: job.secondaryLocations } : {}),
    workMode: job.workMode,
    ...(job.remoteEligibility ? { remoteEligibility: job.remoteEligibility } : {}),
    employmentType: job.employmentType,
    ...(job.seniority ? { seniority: job.seniority } : {}),
    ...(job.requiredExperience ? { requiredExperience: job.requiredExperience } : {}),
    description: job.description,
    requiredSkills: job.requiredSkills,
    ...(job.preferredSkills ? { preferredSkills: job.preferredSkills } : {}),
    ...(job.qualifications ? { qualifications: job.qualifications } : {}),
    ...(job.compensation ? { compensation: job.compensation } : {}),
    ...(job.currency ? { currency: job.currency } : {}),
    applicationUrl: job.applicationUrl,
    searchText: job.searchText,
    sourceJobId: job.sourceJobId,
    fetchedAt: job.fetchedAt,
    isActive: job.isActive,
    ...(job.publishedAt ? { publishedAt: job.publishedAt } : {}),
    ...(job.updatedAt ? { updatedAt: job.updatedAt } : {}),
  };
}

async function generateUserRecommendationsUnlocked(uid: string, candidate: CandidateData) {
  const firestore = getFirestore();
  const preferences = candidate.preferences ?? {};
  const profile = candidate.reviewedProfile ?? {};
  const indiaCriteria: IndiaSearchCriteria = {
    countryCode: preferences.locationDetails?.countryCode,
    country: preferences.locationDetails?.country,
    city: preferences.locationDetails?.city,
    targetRole: preferences.targetRole,
    domain: preferences.domain,
    skills: profile.skills,
  };
  const { jobs, failures } = await fetchConfiguredJobs(indiaCriteria);
  console.log(`[Jobs] candidate jobs after eligibility: ${jobs.length}`);
  if (failures.length) console.log(`[Jobs] source failures: ${failures.join(', ')}`);
  const diagnostics: MatchDiagnostics = {
    locationEligible: 0,
    workModeEligible: 0,
    domainRelevant: 0,
    roleRelevant: 0,
    experienceCompatible: 0,
    skillRelevant: 0,
  };
  const candidateLocation = text(preferences.location);
  const activeJobsWithLocation = jobs.filter((job) => Boolean(normalizedLocation(job.location))).length;
  const candidateLocationJobs = jobs.filter((job) => locationMatches(
    candidateLocation,
    normalizedLocation(job.location),
    text(job.workMode),
  )).length;
  const indiaJobs = jobs.filter((job) => /\bindia\b/i.test(job.location)).length;
  const hyderabadJobs = jobs.filter((job) => /\bhyderabad\b/i.test(job.location)).length;
  const jobsWithWorkMode = jobs.filter((job) => Boolean(text(job.workMode))).length;
  console.log('[Match] candidate preferences:', {
    location: preferences.location ?? '',
    domain: preferences.domain ?? '',
    targetRole: preferences.targetRole ?? '',
    workMode: preferences.workMode ?? '',
    experienceLevel: preferences.experienceLevel ?? '',
    skills: list(profile.skills),
    resumeEvidenceCounts: {
      experience: list(profile.experience).length,
      education: list(profile.education).length,
      projects: list(profile.projects).length,
      certifications: list(profile.certifications).length,
    },
  });
  console.log('[Match] normalized candidate criteria:', {
    targetRole: text(preferences.targetRole),
    domain: text(preferences.domain),
    dreamCompany: text(preferences.dreamCompany),
    location: normalizedLocation(candidateLocation),
    workMode: preferredWorkModes(text(preferences.workMode)),
    experienceLevel: text(preferences.experienceLevel),
    parsedExperienceYears: experienceYears(candidate),
    skills: list(profile.skills),
  });
  console.log(`[Match] targetRole=${preferences.targetRole ?? ''}`);
  console.log(`[Match] domain=${preferences.domain ?? ''}`);
  console.log(`[Match] dreamCompany=${preferences.dreamCompany ?? ''}`);
  console.log(`[Match] location=${preferences.location ?? ''}`);
  console.log(`[Match] workMode=${preferences.workMode ?? ''}`);
  console.log(`[Match] experienceLevel=${preferences.experienceLevel ?? ''}`);
  const diagnosticJobs = [...new Map(jobs.map((job) => [job.companyName, job])).values()].slice(0, 20);
  diagnosticJobs.forEach((job) => {
    const breakdown: ScoreBreakdown = {
      roleScore: 0,
      domainScore: 0,
      locationScore: 0,
      workModeScore: 0,
      experienceScore: 0,
      skillScore: 0,
      companyPreferenceScore: 0,
      finalScore: null,
    };
    scoreJob(job, candidate, undefined, breakdown);
    console.log('[Match] candidate job score:', {
      company: job.companyName,
      title: job.title,
      location: job.location,
      workMode: job.workMode,
      ...breakdown,
    });
  });
  const sourceEligible = new Map<string, number>();
  const sourceRelevant = new Map<string, number>();
  const scoredRecommendations = jobs
    .map((job) => {
      const recommendation = scoreJob(job, candidate, diagnostics);
      if (recommendation) {
        sourceEligible.set(job.source, (sourceEligible.get(job.source) ?? 0) + 1);
        if (recommendation.matchScore >= 20) {
          sourceRelevant.set(job.source, (sourceRelevant.get(job.source) ?? 0) + 1);
        }
      }
      return recommendation;
    })
    .filter((recommendation): recommendation is Omit<JobRecommendation, 'generatedAt'> => recommendation !== null && recommendation.matchScore >= 20)
    .sort((left, right) => right.matchScore - left.matchScore)
  sourceEligible.forEach((count, source) => console.log(`[Jobs] source eligible: ${source}: ${count}`));
  sourceRelevant.forEach((count, source) => console.log(`[Jobs] source relevant: ${source}: ${count}`));
  console.log(`[Jobs] scored jobs: ${scoredRecommendations.length}`);
  const companyCounts = new Map<string, number>();
  const jobsById = new Map(jobs.map((job) => [job.id, job]));
  const remainingRecommendations = [...scoredRecommendations];
  const recommendations: Omit<JobRecommendation, 'generatedAt'>[] = [];
  while (remainingRecommendations.length && recommendations.length < 100) {
    remainingRecommendations.sort((left, right) => {
      const leftCompany = jobsById.get(left.jobId)?.companyName ?? 'Unknown';
      const rightCompany = jobsById.get(right.jobId)?.companyName ?? 'Unknown';
      const leftScore = left.matchScore - Math.min((companyCounts.get(leftCompany) ?? 0) * 2, 8);
      const rightScore = right.matchScore - Math.min((companyCounts.get(rightCompany) ?? 0) * 2, 8);
      return rightScore - leftScore || right.matchScore - left.matchScore || left.jobId.localeCompare(right.jobId);
    });
    const recommendation = remainingRecommendations.shift();
    if (!recommendation) break;
    const company = jobsById.get(recommendation.jobId)?.companyName ?? 'Unknown';
    companyCounts.set(company, (companyCounts.get(company) ?? 0) + 1);
    recommendations.push(recommendation);
  }

  console.log('[Match] recommendations generated:', recommendations.length);
  console.log(`[Jobs] final recommendations: ${recommendations.length}`);
  console.log('[Jobs] recommendation companies:');
  [...companyCounts.entries()].sort(([left], [right]) => left.localeCompare(right))
    .forEach(([company, count]) => console.log(`${company}: ${count}`));
  const recommendationCollectionPath = `users/${uid}/jobRecommendations`;
  const existingSnapshot = await firestore.collection(recommendationCollectionPath).get();
  console.log('[Match] existing recommendations loaded:', {
    uid,
    path: recommendationCollectionPath,
    count: existingSnapshot.size,
  });
  const nextIds = new Set(recommendations.map((recommendation) => recommendation.jobId));
  const batch = firestore.batch();

  const firstRecommendation = recommendations[0];
  if (firstRecommendation) {
    console.log('[Jobs] recommendation payload before write:', {
      jobId: firstRecommendation.jobId,
      source: firstRecommendation.source,
      sourceJobId: firstRecommendation.sourceJobId,
      companyId: firstRecommendation.companyId,
      companyName: firstRecommendation.companyName,
      title: firstRecommendation.title,
      location: firstRecommendation.location,
      workMode: firstRecommendation.workMode,
      employmentType: firstRecommendation.employmentType,
      description: firstRecommendation.description,
      applicationUrl: firstRecommendation.applicationUrl,
      requiredSkills: firstRecommendation.requiredSkills,
      searchText: firstRecommendation.searchText,
      fetchedAt: firstRecommendation.fetchedAt,
      isActive: firstRecommendation.isActive,
      matchScore: firstRecommendation.matchScore,
      matchedSkills: firstRecommendation.matchedSkills,
      missingSkills: firstRecommendation.missingSkills,
      matchReasons: firstRecommendation.matchReasons,
    });
  }

  existingSnapshot.docs
    .filter((document) => !nextIds.has(document.id))
    .forEach((document) => batch.delete(document.ref));

  recommendations.forEach((recommendation) => {
    batch.set(firestore.doc(`users/${uid}/jobRecommendations/${recommendation.jobId}`), {
      jobId: recommendation.jobId,
      source: recommendation.source,
      sourceJobId: recommendation.sourceJobId,
      companyId: recommendation.companyId,
      companyName: recommendation.companyName,
      title: recommendation.title,
      location: recommendation.location,
      ...(recommendation.country ? { country: recommendation.country } : {}),
      ...(recommendation.countryCode ? { countryCode: recommendation.countryCode } : {}),
      ...(recommendation.secondaryLocations ? { secondaryLocations: recommendation.secondaryLocations } : {}),
      workMode: recommendation.workMode,
      ...(recommendation.remoteEligibility ? { remoteEligibility: recommendation.remoteEligibility } : {}),
      employmentType: recommendation.employmentType,
      ...(recommendation.seniority ? { seniority: recommendation.seniority } : {}),
      ...(recommendation.requiredExperience ? { requiredExperience: recommendation.requiredExperience } : {}),
      description: recommendation.description,
      applicationUrl: recommendation.applicationUrl,
      requiredSkills: recommendation.requiredSkills,
      ...(recommendation.preferredSkills ? { preferredSkills: recommendation.preferredSkills } : {}),
      ...(recommendation.qualifications ? { qualifications: recommendation.qualifications } : {}),
      ...(recommendation.compensation ? { compensation: recommendation.compensation } : {}),
      ...(recommendation.currency ? { currency: recommendation.currency } : {}),
      searchText: recommendation.searchText,
      fetchedAt: recommendation.fetchedAt,
      isActive: recommendation.isActive,
      ...(recommendation.publishedAt ? { publishedAt: recommendation.publishedAt } : {}),
      ...(recommendation.updatedAt ? { sourceUpdatedAt: recommendation.updatedAt } : {}),
      matchScore: recommendation.matchScore,
      matchedSkills: recommendation.matchedSkills,
      missingSkills: recommendation.missingSkills,
      matchReasons: recommendation.matchReasons,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      generatedAt: FieldValue.serverTimestamp(),
    });
  });

  if (!existingSnapshot.empty || recommendations.length) {
    console.log('[Match] recommendation write started:', {
      uid,
      path: recommendationCollectionPath,
      writeCount: recommendations.length,
      deleteCount: existingSnapshot.docs.filter((document) => !nextIds.has(document.id)).length,
    });
    await batch.commit();
    console.log('[Match] recommendations written:', {
      uid,
      path: recommendationCollectionPath,
      count: recommendations.length,
    });
  } else {
    console.log('[Match] recommendations written: 0', {
      uid,
      path: recommendationCollectionPath,
      reason: 'No recommendations generated and no stale documents to delete',
    });
  }

  console.log('[Match] pipeline counts:', {
    totalGlobalJobs: jobs.length,
    locationEligible: diagnostics.locationEligible,
    workModeEligible: diagnostics.workModeEligible,
    domainRelevant: diagnostics.domainRelevant,
    roleRelevant: diagnostics.roleRelevant,
    experienceCompatible: diagnostics.experienceCompatible,
    skillRelevant: diagnostics.skillRelevant,
    finalRecommendations: recommendations.length,
    recommendationDocumentsWritten: recommendations.length,
    recommendationDocumentsRemoved: existingSnapshot.docs.length - nextIds.size,
  });
  console.log(`[Match] candidate location: ${preferences.location ?? ''}`);
  console.log(`[Match] candidate country: ${preferences.country ?? ''}`);
  console.log(`[Match] candidate domain: ${preferences.domain ?? ''}`);
  console.log(`[Match] candidate role: ${preferences.targetRole ?? ''}`);
  console.log(`[Match] candidate work mode: ${preferences.workMode ?? ''}`);
  console.log(`[Match] candidate employment type: ${preferences.employmentType ?? ''}`);
  console.log(`[Match] candidate skills count: ${list(profile.skills).length}`);
  console.log(`[Match] candidate experience: ${preferences.experienceLevel ?? ''}`);
  console.log(`[Match] global jobs: ${jobs.length}`);
  console.log(`[Match] location eligible: ${diagnostics.locationEligible}`);
  console.log(`[Match] work-mode eligible: ${diagnostics.workModeEligible}`);
  console.log(`[Match] domain relevant: ${diagnostics.domainRelevant}`);
  console.log(`[Match] role relevant: ${diagnostics.roleRelevant}`);
  console.log(`[Match] experience compatible: ${diagnostics.experienceCompatible}`);
  console.log(`[Match] skill relevant: ${diagnostics.skillRelevant}`);
  console.log(`[Match] recommendations generated: ${recommendations.length}`);
  return recommendations.length;
}

export async function generateUserRecommendations(uid: string, candidate: CandidateData) {
  const previous = activeGenerations.get(uid) ?? Promise.resolve(0);
  let current: Promise<number>;
  current = previous
    .catch(() => 0)
    .then(() => generateUserRecommendationsUnlocked(uid, candidate))
    .finally(() => {
      if (activeGenerations.get(uid) === current) activeGenerations.delete(uid);
    });
  activeGenerations.set(uid, current);
  await current;
}
