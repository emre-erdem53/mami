import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getExpectedSessionToken,
  isAuthEnabled,
  sessionCookieName,
  verifyPassword,
} from "@/lib/session";

export async function POST(req: Request) {
  if (!isAuthEnabled()) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  let body: { password?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  if (!verifyPassword(String(body.password ?? ""))) {
    return NextResponse.json({ error: "Şifre hatalı" }, { status: 401 });
  }

  const token = await getExpectedSessionToken();
  const jar = await cookies();
  jar.set(sessionCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return NextResponse.json({ ok: true });
}
