import { deriveSessionToken, timingSafeEqualString } from "./session-token";

const COOKIE = "mami_session";

export function sessionCookieName() {
  return COOKIE;
}

export function isAuthEnabled(): boolean {
  return Boolean(process.env.PANEL_PASSWORD?.length);
}

export async function getExpectedSessionToken(): Promise<string> {
  return deriveSessionToken();
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!isAuthEnabled()) return true;
  if (!token) return false;
  const expected = await deriveSessionToken();
  return timingSafeEqualString(token, expected);
}

export function verifyPassword(plain: string): boolean {
  if (!isAuthEnabled()) return true;
  return plain === process.env.PANEL_PASSWORD;
}
