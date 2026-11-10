import { extractResumeSections, prepareResumeTextForAi, type ExtractedProfile } from './resumeParser';

export type ResumeValidation = {
  isResume: boolean;
  confidence: number;
  reason: string;
  detectedSections: string[];
};

type AiResponse = {
  validation: ResumeValidation;
  extraction: ExtractedProfile;
};

const emptyExtraction: ExtractedProfile = {
  fullName: '',
  headline: '',
  skills: [],
  education: [],
  experience: [],
  projects: [],
  certifications: [],
};

function parseJson(content: string): AiResponse {
  const normalized = content
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  const parsed = JSON.parse(normalized) as Partial<AiResponse>;
  const validation = parsed.validation;
  const extraction = parsed.extraction;

  if (
    !validation ||
    typeof validation.isResume !== 'boolean' ||
    !extraction
  ) {
    throw new Error('AI returned an invalid resume response.');
  }

  return {
    validation: {
      isResume: validation.isResume,
      confidence:
        typeof validation.confidence === 'number'
          ? validation.confidence
          : 0,
      reason:
        typeof validation.reason === 'string'
          ? validation.reason
          : '',
      detectedSections: Array.isArray(validation.detectedSections)
        ? validation.detectedSections.filter(
            (item): item is string => typeof item === 'string'
          )
        : [],
    },

    extraction: {
      fullName:
        typeof extraction.fullName === 'string'
          ? extraction.fullName
          : '',

      headline: sanitizeHeadline(
        typeof extraction.headline === 'string'
          ? extraction.headline
          : ''
      ),

      skills: Array.isArray(extraction.skills)
        ? extraction.skills.filter(
            (item): item is string => typeof item === 'string'
          )
        : [],

      education: Array.isArray(extraction.education)
        ? extraction.education.filter(
            (item): item is string => typeof item === 'string'
          )
        : [],

      experience: Array.isArray(extraction.experience)
        ? extraction.experience.filter(
            (item): item is string => typeof item === 'string'
          )
        : [],

      projects: Array.isArray(extraction.projects)
        ? extraction.projects.filter(
            (item): item is string => typeof item === 'string'
          )
        : [],

      certifications: Array.isArray(extraction.certifications)
        ? extraction.certifications.filter(
            (item): item is string => typeof item === 'string'
          )
        : [],
    },
  };
}

function sanitizeHeadline(headline: string) {
  const value = headline.trim();
  const containsEmail = /[^\s@]+@[^\s@]+\.[^\s@]+/i.test(value);
  const containsPhone = /(?:\+?\d[\d\s().-]{7,}\d)/.test(value);
  const containsUrl = /(?:https?:\/\/|www\.|linkedin\.com|github\.com)/i.test(value);
  const looksLikeContactLine = value.includes('|') && (containsEmail || containsPhone || containsUrl);

  if (containsEmail || containsPhone || containsUrl || looksLikeContactLine) {
    return '';
  }

  return value;
}

function deterministicSignals(text: string) {
  const lowerText = text.toLowerCase();

  return [
    'education',
    'skills',
    'projects',
    'experience',
    'internship',
    'certification',
    'objective',
    'profile',
  ].filter((signal) => lowerText.includes(signal));
}

function mergeDeterministicSections(text: string, extraction: ExtractedProfile) {
  const sections = extractResumeSections(text);

  return {
    ...extraction,
    education: extraction.education.length ? extraction.education : sections.education,
    experience: extraction.experience.length ? extraction.experience : sections.experience,
    projects: extraction.projects.length ? extraction.projects : sections.projects,
  };
}

export function validateDocumentText(text: string) {
  const signals = deterministicSignals(text);

  return {
    signals,
    isReadable: text.trim().length >= 100,
    hasCareerSignals: signals.length >= 2,
  };
}

export async function classifyAndExtractResume(
  text: string,
  apiKey: string
): Promise<AiResponse> {
  if (!apiKey) {
    throw new Error(
      'Resume AI processing is not configured. Set OPENROUTER_API_KEY for the Functions runtime.'
    );
  }

  const aiText = prepareResumeTextForAi(text);
  const response = await fetch(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',

      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'CareerNova',
      },

      body: JSON.stringify({
        model: 'openrouter/free',

        messages: [
          {
            role: 'system',
            content:
              [
                'You validate and extract resumes. Return only valid JSON with validation {isResume, confidence, reason, detectedSections} and extraction {fullName, headline, skills, education, experience, projects, certifications}.',
                'Read the entire resume text before extracting information. Do not stop after finding the name, contact information, or skills.',
                'Extract only information explicitly supported by the supplied resume. Never invent names, roles, companies, degrees, dates, skills, projects, experience, or certifications.',
                'Headline must be a short professional status or role, never contact information. Prioritize a clearly stated current job role, then internship role, then student status plus degree/field, then recent graduate status plus degree/field. If no supported role or status exists, return an empty headline.',
                'Never put email addresses, phone numbers, URLs, street addresses, city/state/country, postal codes, or contact-information lines in headline. Do not copy a contact-heavy first line.',
                'Extract actual skills only, without names, contact details, locations, institutions, duplicate entries, or job titles mistaken for skills.',
                'Education, experience, internships, projects, and certifications may appear anywhere in the document. Search the complete document for section headings and their variations, including Education, Educational Qualifications, Academic Background, Academic Details, Qualifications; Experience, Work Experience, Professional Experience, Employment, Work History, Internship, Internships; Projects, Academic Projects, Personal Projects, Key Projects, Major Project, Mini Project, Capstone Project; Skills, Technical Skills, Core Skills, Technologies; Certifications, Certificates, Professional Certifications.',
                'Education entries should preserve degree, institution, field, graduation year, and explicit CGPA/percentage. Experience includes employment and internships but not college projects or skills. Projects include project name, technologies, description, and explicit outcomes. Certifications include names and issuers when present.',
                'If information is explicitly present, extract it. Never return an empty array when relevant information is clearly present. Keep each item concise but informative.',
                'The first lines of a resume often contain contact information. Do not mistake those lines for professional experience, education, or projects. The resume may use columns or unusual formatting; use the meaning of the text and section headings rather than relying only on physical line order.',
                'A fresher resume can be valid with education, skills, projects, or certifications and no professional experience. Return empty arrays or strings only when information is genuinely unavailable.',
                'Return only the required JSON. Do not provide explanations, reasoning, Markdown, or repeated resume text.',
              ].join(' '),
          },

          {
            role: 'user',
            content: aiText,
          },
        ],

        temperature: 0,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `OpenRouter request failed (${response.status}): ${errorText}`
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('OpenRouter returned an empty response.');
  }

  const result = parseJson(content);
  return {
    ...result,
    extraction: mergeDeterministicSections(text, result.extraction),
  };
}

export function hasMeaningfulExtraction(
  extraction: ExtractedProfile
) {
  return Boolean(
    extraction.fullName ||
      extraction.headline ||
      extraction.skills.length ||
      extraction.education.length ||
      extraction.experience.length ||
      extraction.projects.length ||
      extraction.certifications?.length
  );
}

export function emptyResumeExtraction() {
  return emptyExtraction;
}