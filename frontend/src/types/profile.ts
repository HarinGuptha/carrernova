import type { ExtractedProfile } from './resume';

export type CandidatePreferences = {
  targetRole: string;
  domain: string;
  dreamCompany: string;
  location: string;
  workMode: string;
  experienceLevel: string;
};

export type CandidateStats = {
  savedRoles: number;
  completedTasks: number;
  applications: number;
};

export type CandidateProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  reviewedProfile?: ExtractedProfile | null;
  preferences?: CandidatePreferences;
  stats?: CandidateStats;
  createdAt?: unknown;
  updatedAt?: unknown;
};
