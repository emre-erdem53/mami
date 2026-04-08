import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readState } from "@/lib/store";
import { sessionCookieName, verifySessionToken } from "@/lib/session";

function esc(v: string) {
  if (v.includes('"') || v.includes(",") || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

export async function GET() {
  const jar = await cookies();
  if (!(await verifySessionToken(jar.get(sessionCookieName())?.value))) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
  const s = await readState();
  const headers = [
    "id",
    "companyName",
    "contactName",
    "email",
    "phone",
    "sector",
    "priority",
    "leadScore",
    "currency",
    "offerGiven",
    "offerStatus",
    "agreementAmount",
  ];
  const lines = [headers.join(",")];
  for (const c of s.clients) {
    const d = s.deals.find((x) => x.clientId === c.id);
    lines.push(
      [
        esc(c.id),
        esc(c.companyName),
        esc(c.contactName),
        esc(c.email),
        esc(c.phone),
        esc(c.sector),
        esc(c.priority),
        String(c.leadScore),
        esc(c.currency),
        d?.offerGiven ? "yes" : "no",
        esc(d?.offerStatus ?? ""),
        String(c.payment.agreementAmount),
      ].join(",")
    );
  }
  const body = lines.join("\n");
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mami-clients-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
