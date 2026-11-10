import type { CompanySourceConfig, EmploymentType, Job, RawJob, WorkMode } from './types';

const skillVocabulary = [
  'JavaScript', 'TypeScript', 'React Native', 'React', 'Node.js', 'Python', 'Java',
  'SQL', 'MongoDB', 'Firebase', 'AWS', 'Docker', 'Kubernetes', 'Git', 'Machine Learning',
  'Deep Learning', 'NLP', 'TensorFlow', 'PyTorch', 'Spring Boot', 'C++', 'C#', 'HTML',
  'CSS', 'Angular', 'Vue', 'Flutter', 'Dart', 'REST API', 'GraphQL', 'Linux',
];

function clean(value: unknown) {
  return typeof value === 'string'
    ? value
      .replace(/&nbsp;|&#160;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    : '';
}

function normalizeWorkMode(value: string, text: string): WorkMode {
  const source = `${value} ${text}`.toLowerCase();
  if (source.includes('remote')) return 'remote';
  if (source.includes('hybrid')) return 'hybrid';
  if (source.includes('on-site') || source.includes('onsite') || source.includes('office')) return 'onsite';
  return 'unknown';
}

function normalizeEmploymentType(value: string, text: string): EmploymentType {
  const source = `${value} ${text}`.toLowerCase();
  if (source.includes('intern')) return 'internship';
  if (source.includes('part-time') || source.includes('part time')) return 'part-time';
  if (source.includes('contract')) return 'contract';
  if (source.includes('full-time') || source.includes('full time')) return 'full-time';
  return 'unknown';
}

function extractSkills(text: string) {
  const lowerText = text.toLowerCase();
  return skillVocabulary.filter((skill) => {
    const escaped = skill.replace(/[.+#]/g, '\\$&').replace(/\s+/g, '\\s+');
    return new RegExp(`(^|[^a-z0-9])${escaped.toLowerCase()}([^a-z0-9]|$)`, 'i').test(lowerText);
  });
}

export function normalizeJob(raw: RawJob, config: CompanySourceConfig, fetchedAt: string): Job | null {
  const title = clean(raw.title);
  const applicationUrl = clean(raw.applicationUrl);
  const description = clean(raw.description);
  const sourceJobId = clean(raw.sourceJobId) || `${config.companyId}-${title}-${applicationUrl}`;
  if (!title || !applicationUrl || !sourceJobId) return null;

  const location = clean(raw.location) || 'Location not specified';
  const canonicalUrl = applicationUrl.toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/[?#].*$/, '').replace(/\/$/, '');
  const stableId = `${config.companyId}-${title.toLowerCase()}-${location.toLowerCase()}-${canonicalUrl}`;
  const searchText = [title, config.companyName, location, raw.country, description, raw.department, raw.workMode, raw.remoteEligibility].filter(Boolean).join(' ');
  return {
    id: `${config.source}_${sourceJobId || stableId}`.replace(/[^a-zA-Z0-9_-]/g, '_'),
    source: config.source,
    sourceJobId,
    companyId: config.companyId,
    companyName: clean(config.companyName),
    title,
    location,
    ...(clean(raw.country) ? { country: clean(raw.country) } : config.country ? { country: config.country } : {}),
    ...(clean(raw.countryCode) ? { countryCode: clean(raw.countryCode).toUpperCase() } : config.countryCode ? { countryCode: config.countryCode } : {}),
    ...(raw.secondaryLocations?.length ? { secondaryLocations: raw.secondaryLocations.map(clean).filter(Boolean) } : {}),
    description,
    ...(clean(raw.department) ? { department: clean(raw.department) } : {}),
    ...(clean(raw.team) ? { team: clean(raw.team) } : {}),
    workMode: normalizeWorkMode(clean(raw.workMode), `${title} ${location} ${description}`),
    ...(clean(raw.remoteEligibility) ? { remoteEligibility: clean(raw.remoteEligibility) } : {}),
    employmentType: normalizeEmploymentType(clean(raw.employmentType), `${title} ${description}`),
    ...(clean(raw.seniority) ? { seniority: clean(raw.seniority) } : {}),
    ...(clean(raw.requiredExperience) ? { requiredExperience: clean(raw.requiredExperience) } : {}),
    requiredSkills: raw.requiredSkills?.map(clean).filter(Boolean).length
      ? raw.requiredSkills.map(clean).filter(Boolean)
      : extractSkills(`${title} ${description}`),
    ...(raw.preferredSkills?.length ? { preferredSkills: raw.preferredSkills.map(clean).filter(Boolean) } : {}),
    ...(raw.qualifications?.length ? { qualifications: raw.qualifications.map(clean).filter(Boolean) } : {}),
    ...(clean(raw.compensation) ? { compensation: clean(raw.compensation) } : {}),
    ...(clean(raw.currency) ? { currency: clean(raw.currency) } : {}),
    applicationUrl,
    ...(clean(raw.publishedAt) ? { publishedAt: clean(raw.publishedAt) } : {}),
    ...(clean(raw.updatedAt) ? { updatedAt: clean(raw.updatedAt) } : {}),
    fetchedAt,
    isActive: true,
    searchText: searchText.toLowerCase(),
  };
}
