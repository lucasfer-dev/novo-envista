const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    credentials: 'include',
  })
  if (!response.ok) throw new Error(`Envista API ${response.status}`)
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
