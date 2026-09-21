export function isPublicSignupReady() {
  // Public signup is available by default. Set AUTH_SIGNUP_ENABLED=false
  // only when registrations need to be intentionally paused.
  return process.env.AUTH_SIGNUP_ENABLED !== "false";
}
