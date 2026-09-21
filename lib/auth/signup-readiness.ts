export function isPublicSignupReady() {
  if (process.env.AUTH_SIGNUP_ENABLED !== "true") return false;
  if (process.env.AUTH_EMAIL_DELIVERY_READY !== "true") return false;

  if (process.env.NODE_ENV === "production") {
    return Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim());
  }

  return true;
}
