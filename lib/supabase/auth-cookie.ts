export function hasSupabaseAuthCookieNames(names: string[]) {
  return names.some((name) => name.startsWith("sb-") && name.includes("-auth-token"));
}
