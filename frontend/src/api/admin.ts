const BASE = '/admin';

export interface Company {
  id: string;
  name: string;
  created_at: string;
  project_count: number;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  has_demographics: boolean;
  languages: string[];
  created_at: string;
  session_count: number;
  completed_count: number;
}

export interface Analytics {
  total: number;
  completed: number;
  completionRate: number;
  dimensionCoverage: Record<string, number>;
}

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const adminApi = {
  getCompanies: () => req<Company[]>('/companies'),
  createCompany: (name: string) => req<Company>('/companies', { method: 'POST', body: JSON.stringify({ name }) }),
  deleteCompany: (id: string) => req(`/companies/${id}`, { method: 'DELETE' }),

  getProjects: (companyId: string) => req<Project[]>(`/companies/${companyId}/projects`),
  createProject: (companyId: string, data: { name: string; description?: string; hasDemographics: boolean; languages: string[] }) =>
    req<Project>(`/companies/${companyId}/projects`, { method: 'POST', body: JSON.stringify(data) }),
  deleteProject: (id: string) => req(`/projects/${id}`, { method: 'DELETE' }),

  generateLink: (projectId: string) => req<{ token: string; url: string; expiresAt: string }>(`/projects/${projectId}/generate-link`, { method: 'POST' }),
  getAnalytics: (projectId: string) => req<Analytics>(`/projects/${projectId}/analytics`),
};
