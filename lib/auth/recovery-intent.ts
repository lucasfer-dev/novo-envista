import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { logServerEvent } from "@/lib/observability/logger";

const COOKIE_NAME = "envista-recovery-intent";
const MAX_AGE_SECONDS = 15 * 60;

type RecoveryIntent = {
  sub: string;
  exp: number;
};

function recoverySecret() {
  const secret = process.env.AUTH_RECOVERY_COOKIE_SECRET?.trim();
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV !== "production") return "envista-development-recovery-secret-change-me";
  throw new Error("AUTH_RECOVERY_COOKIE_SECRET must contain at least 32 characters in production");
}

function encodePayload(payload: RecoveryIntent) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function signature(payload: string) {
  return createHmac("sha256", recoverySecret()).update(payload).digest("base64url");
}

function safelyEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function issueRecoveryIntent(userId: string) {
  const payload = encodePayload({
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS,
  });
  const value = `${payload}.${signature(payload)}`;
  const store = await cookies();
  store.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function hasValidRecoveryIntent(userId: string) {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return false;

  try {
    const [payload, suppliedSignature, extra] = raw.split(".");
    if (!payload || !suppliedSignature || extra) return false;
    if (!safelyEqual(suppliedSignature, signature(payload))) return false;

    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<RecoveryIntent>;
    return (
      typeof decoded.sub === "string" &&
      decoded.sub === userId &&
      typeof decoded.exp === "number" &&
      decoded.exp >= Math.floor(Date.now() / 1000)
    );
  } catch (error) {
    logServerEvent("warn", "auth.recovery_intent.invalid", {
      error_name: error instanceof Error ? error.name : "UnknownError",
    });
    return false;
  }
}

export async function clearRecoveryIntent() {
  const store = await cookies();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
