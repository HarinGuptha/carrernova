export type ExtractedProfile = {
  fullName: string;
  headline: string;
  skills: string[];
  education: string[];
  experience: string[];
  projects: string[];
  certifications?: string[];
};

const skillVocabulary = [
  'JavaScript', 'TypeScript', 'React', 'React Native', 'Expo', 'Python', 'Java', 'SQL',
  'Firebase', 'Firestore', 'Node.js', 'Figma', 'Product Design', 'Data Analysis',
  'Machine Learning', 'NLP', 'Git', 'GitHub', 'AWS', 'Docker',
];

const sectionAliases: Record<string, keyof Pick<ExtractedProfile, 'education' | 'experience' | 'projects'>> = {
  education: 'education',
  'educational qualifications': 'education',
  'academic background': 'education',
  'academic details': 'education',
  academics: 'education',
  qualifications: 'education',
  experience: 'experience',
  'work experience': 'experience',
  'professional experience': 'experience',
  'work history': 'experience',
  employment: 'experience',
  internships: 'experience',
  internship: 'experience',
  projects: 'projects',
  'academic projects': 'projects',
  'personal projects': 'projects',
  'major project': 'projects',
  'mini project': 'projects',
  'capstone project': 'projects',
  'key projects': 'projects',
  'selected projects': 'projects',
};
const otherSectionHeadings = new Set([
  'summary',
  'profile',
  'objective',
  'skills',
  'technical skills',
  'core skills',
  'technologies',
  'certifications',
  'certificates',
  'professional certifications',
  'awards',
  'achievements',
  'publications',
  'activities',
  'interests',
  'references',
]);
const aiSectionPriority = [
  'contact',
  'education',
  'experience',
  'internships',
  'projects',
  'skills',
  'certifications',
];

function normalizeSectionHeading(line: string) {
  return line
    .trim()
    .replace(/^[•*▪◦-]\s*/, '')
    .toLowerCase()
    .replace(/[#:]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function sectionNameForHeading(heading: string) {
  if (sectionAliases[heading]) return sectionAliases[heading];
  if (heading === 'internship' || heading === 'internships') return 'internships';
  if (heading === 'skills' || heading === 'technical skills' || heading === 'core skills' || heading === 'technologies') return 'skills';
  if (heading === 'certifications' || heading === 'certificates' || heading === 'professional certifications') return 'certifications';
  return null;
}

export function normalizeResumeText(text: string) {
  return text
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function prepareResumeTextForAi(text: string, maxCharacters = 20000) {
  const normalizedText = normalizeResumeText(text);
  if (normalizedText.length <= maxCharacters) return normalizedText;

  const lines = normalizedText.split('\n');
  const sections = new Map<string, string[]>();
  let activeSection = 'contact';

  for (const line of lines) {
    const heading = normalizeSectionHeading(line);
    const section = sectionNameForHeading(heading);
    if (section) {
      activeSection = section;
      if (!sections.has(activeSection)) sections.set(activeSection, []);
      sections.get(activeSection)?.push(line.trim());
      continue;
    }
    if (otherSectionHeadings.has(heading)) {
      activeSection = heading;
      if (!sections.has(activeSection)) sections.set(activeSection, []);
      sections.get(activeSection)?.push(line.trim());
      continue;
    }
    sections.set(activeSection, [...(sections.get(activeSection) ?? []), line.trim()]);
  }

  let remaining = maxCharacters;
  const selected: string[] = [];
  for (const section of aiSectionPriority) {
    const content = sections.get(section)?.filter(Boolean).join('\n');
    if (!content || remaining <= 0) continue;
    const chunk = content.slice(0, remaining);
    selected.push(chunk);
    remaining -= chunk.length;
  }

  return selected.join('\n\n').trim();
}

export function extractResumeSections(text: string) {
  const lines = text.split(/\r?\n/);
  const sections: Record<string, string[]> = { education: [], experience: [], projects: [] };
  let activeSection: keyof typeof sections | null = null;

  for (const line of lines) {
    const heading = normalizeSectionHeading(line);
    const section = sectionAliases[heading];
    if (section) {
      activeSection = section;
      continue;
    }
    if (otherSectionHeadings.has(heading)) {
      activeSection = null;
      continue;
    }
    if (activeSection && line.trim()) sections[activeSection].push(line.trim());
  }

  return sections;
}

export function extractResumeProfile(text: string): ExtractedProfile {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const sections = extractResumeSections(text);
  const lowerText = text.toLowerCase();
  const skills = skillVocabulary.filter((skill) => lowerText.includes(skill.toLowerCase()));

  return {
    fullName: lines[0]?.slice(0, 120) ?? '',
    headline: lines[1]?.slice(0, 180) ?? '',
    skills,
    education: sections.education,
    experience: sections.experience,
    projects: sections.projects,
    certifications: [],
  };
}

export async function extractResumeText(buffer: Buffer, contentType: string) {
  let text: string;

  if (contentType === 'application/pdf') {
    const pdf = await import('pdf-parse');
    const result = await pdf.default(buffer);
    text = result.text;
  } else if (contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  } else {
    throw new Error('Unsupported resume type. Only PDF and DOCX are supported.');
  }

  return normalizeResumeText(text);
}
