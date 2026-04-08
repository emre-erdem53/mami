import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sessionCookieName } from "@/lib/session";

export async function POST() {
  const jar = await cookies();
  jar.delete(sessionCookieName());
  return NextResponse.json({ ok: true });
}
