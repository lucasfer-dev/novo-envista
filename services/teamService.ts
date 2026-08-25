import { api } from '@/lib/api'
export const teamService = { remove: (id: string) => api<void>(`/api/teams/${id}`, { method: 'DELETE' }) }
