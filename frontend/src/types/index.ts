export type JobMatch = {
  company: string;
  role: string;
  meta: string;
  match: string;
  color: string;
};

export type RoadmapItem = {
  title: string;
  detail: string;
  progress: number;
};

export type AppTab = 'Home' | 'Discover' | 'Roadmap' | 'Profile';
