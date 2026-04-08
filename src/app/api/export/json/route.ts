import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readState } from "@/lib/store";
import { sessionCookieName, verifySessionToken } from "@/lib/session";

export async function GET() {
  const jar = await cookies();
  if (!(await verifySessionToken(jar.get(sessionCookieName())?.value))) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
  const s = await readState();
  return new NextResponse(JSON.stringify(s, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="mami-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
