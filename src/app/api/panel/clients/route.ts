import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readState } from "@/lib/store";
import { sessionCookieName, verifySessionToken } from "@/lib/session";

export async function GET() {
  const jar = await cookies();
  const ok = await verifySessionToken(jar.get(sessionCookieName())?.value);
  if (!ok) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
  const s = await readState();
  const list = s.clients.map((c) => ({
    id: c.id,
    companyName: c.companyName,
    priority: c.priority,
    leadScore: c.leadScore,
  }));
  return NextResponse.json({ clients: list });
}
