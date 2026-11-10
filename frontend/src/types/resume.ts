export type ResumeExtractionStatus = 'pending' | 'processing' | 'ready' | 'invalid' | 'failed';

export type ExtractedProfile = {
  fullName: string;
  headline: string;
  skills: string[];
  education: string[];
  experience: string[];
  projects: string[];
  certifications?: string[];
};

export type ResumeMetadata = {
  id: string;
  uid: string;
  fileName: string;
  mimeType: string;
  size: number | null;
  storagePath: string;
  extractionStatus: ResumeExtractionStatus;
  extractedProfile: ExtractedProfile | null;
  validationMessage?: string;
  extractionError?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type ResumeUploadResult = {
  metadata: ResumeMetadata;
  cleanupWarning?: string;
};
