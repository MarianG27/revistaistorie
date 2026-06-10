// Server-only helpers for admin auth. Never imported from client code.
import { scryptSync, timingSafeEqual, createHash } from "crypto";

export const SESSION_COOKIE_NAME = "rdi_admin";

// Derive a stable session secret from the service-role key (already server-only).
// This way we don't need an extra secret to bootstrap.
export function getSessionPassword(): string {
  const base = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "fallback-dev-secret-please-rotate";
  return createHash("sha256").update("rdi-admin-session-v1|" + base).digest("hex");
}

export function verifyPassword(plain: string, saltHex: string, expectedHex: string): boolean {
  const computed = scryptSync(plain, saltHex, 64);
  const expected = Buffer.from(expectedHex, "hex");
  if (computed.length !== expected.length) return false;
  return timingSafeEqual(computed, expected);
}
