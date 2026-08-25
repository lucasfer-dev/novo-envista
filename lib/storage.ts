export const storage = {
  get<T>(key:string, fallback:T):T {
    if (typeof window === 'undefined') return fallback
    try { const raw = localStorage.getItem(`envista:${key}`); return raw ? JSON.parse(raw) : fallback } catch { return fallback }
  },
  set<T>(key:string, value:T) { if (typeof window !== 'undefined') localStorage.setItem(`envista:${key}`, JSON.stringify(value)) },
  remove(key:string) { if (typeof window !== 'undefined') localStorage.removeItem(`envista:${key}`) }
}
