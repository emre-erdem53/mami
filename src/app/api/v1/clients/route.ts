import { NextResponse } from "next/server";
import { readState } from "@/lib/store";

export async function GET(req: Request) {
  const expected = process.env.PANEL_API_TOKEN;
  if (!expected?.length) {
    return NextResponse.json(
      { error: "PANEL_API_TOKEN ortam değişkeni tanımlı değil" },
      { status: 503 }
    );
  }
  const auth = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (auth !== expected) {
    return NextResponse.json({ error: "Geçersiz token" }, { status: 401 });
  }
  const s = await readState();
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    count: s.clients.length,
    clients: s.clients.map((c) => ({
      id: c.id,
      companyName: c.companyName,
      contactName: c.contactName,
      email: c.email,
      phone: c.phone,
      sector: c.sector,
      priority: c.priority,
      leadScore: c.leadScore,
      currency: c.currency,
    })),
  });
}
