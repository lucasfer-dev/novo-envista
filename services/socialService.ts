import { api } from '@/lib/api'
export const socialService = {
  publish: (body: string, authorType: 'user'|'team', authorId: string) => api('/api/social/posts', { method:'POST', body: JSON.stringify({body,authorType,authorId}) }),
  followUser: (id: string) => api(`/api/social/users/${id}/follow`, { method:'POST' }),
}
