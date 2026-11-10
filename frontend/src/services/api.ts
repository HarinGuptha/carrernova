const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';

export async function getRecommendedJobs() {
  const response = await fetch(`${API_BASE_URL}/jobs/recommend`, { method: 'POST' });

  if (!response.ok) {
    throw new Error('Unable to load recommended jobs');
  }

  return response.json();
}
