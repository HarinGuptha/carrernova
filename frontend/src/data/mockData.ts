import { JobMatch, RoadmapItem } from '../types';

export const jobs: JobMatch[] = [
  { company: 'Northstar Labs', role: 'Product Design Intern', meta: 'Remote · $24/hr', match: '94%', color: '#E1F2EC' },
  { company: 'Bloomberg', role: 'Junior Data Analyst', meta: 'New York · Hybrid', match: '89%', color: '#E9E7FB' },
  { company: 'Miro', role: 'Frontend Engineer', meta: 'Remote · Full-time', match: '86%', color: '#FCE8D7' },
];

export const roadmap: RoadmapItem[] = [
  { title: 'Build your portfolio', detail: '3 of 5 tasks complete', progress: 0.6 },
  { title: 'Master product thinking', detail: '2 of 4 tasks complete', progress: 0.5 },
];
