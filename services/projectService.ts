import { api } from '@/lib/api'
import { Project } from '@/types'

export const projectService = {
  create: (input: Partial<Project>) => api('/api/projects', { method: 'POST', body: JSON.stringify(input) }),
  remove: (id: string) => api<void>(`/api/projects/${id}`, { method: 'DELETE' }),
  like: (id: string) => api(`/api/projects/${id}/like`, { method: 'POST' }),
  follow: (id: string) => api(`/api/projects/${id}/follow`, { method: 'POST' }),
}
