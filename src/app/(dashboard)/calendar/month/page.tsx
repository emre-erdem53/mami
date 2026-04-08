import Link from "next/link";
import { ArrowLeft, CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";
import { readState } from "@/lib/store";
import { PageHeader } from "@/components/ui/page-header";
import { pageWrap } from "@/components/ui/page-layout";
import { btnSecondary, card } from "@/components/ui/styles";
import { cn } from "@/lib/cn";

function monthBounds(ym: string) {
  const [ys, ms] = ym.split("-");
  const y = Number(ys);
  const m = Number(ms);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return null;
  const first = new Date(y, m - 1, 1);
  const last = new Date(y, m, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  const label = first.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
  return { y, m, first, last, ym: `${y}-${pad(m)}`, label, daysInMonth: last.getDate() };
}

function shiftMonth(ym: string, delta: number) {
  const b = monthBounds(ym);
  if (!b) return ym;
  const d = new Date(b.y, b.m - 1 + delta, 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export default async function CalendarMonthPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const { m: raw } = await searchParams;
  const defaultYm = new Date().toISOString().slice(0, 7);
  const ym = raw && /^\d{4}-\d{2}$/.test(raw) ? raw : defaultYm;
  const b = monthBounds(ym);
  const s = await readState();

  if (!b) {
    return (
      <div className={cn(pageWrap)}>
        <p className="text-zinc-500">Geçersiz ay parametresi.</p>
        <Link href="/calendar/month" className="text-violet-400">
          Bu aya dön
        </Link>
      </div>
    );
  }

  const events = s.events
    .filter((e) => e.startDate.startsWith(b.ym))
    .map((e) => ({
      ...e,
      client: s.clients.find((c) => c.id === e.clientId),
    }))
    .sort((a, c) => a.startDate.localeCompare(c.startDate));

  const byDay = new Map<number, typeof events>();
  for (const e of events) {
    const day = Number(e.startDate.slice(8, 10));
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(e);
  }

  const startWeekday = (b.first.getDay() + 6) % 7;
  const blanks = Array.from({ length: startWeekday }, (_, i) => (
    <div key={`b-${i}`} className="min-h-[4.5rem] rounded-lg bg-zinc-950/20" />
  ));
  const cells = Array.from({ length: b.daysInMonth }, (_, i) => {
    const day = i + 1;
    const list = byDay.get(day) ?? [];
    return (
      <div
        key={day}
        className="min-h-[4.5rem] rounded-lg border border-white/[0.06] bg-zinc-950/30 p-1.5"
      >
        <span className="text-[11px] font-semibold tabular-nums text-zinc-500">{day}</span>
        <ul className="mt-1 space-y-0.5">
          {list.slice(0, 3).map((ev) => (
            <li key={ev.id}>
              <Link
                href={`/clients/${ev.clientId}`}
                className="line-clamp-2 text-[10px] leading-tight text-violet-400 hover:text-violet-300"
              >
                {ev.title}
              </Link>
            </li>
          ))}
          {list.length > 3 ? (
            <li className="text-[10px] text-zinc-600">+{list.length - 3}</li>
          ) : null}
        </ul>
      </div>
    );
  });

  const prev = shiftMonth(b.ym, -1);
  const next = shiftMonth(b.ym, 1);

  return (
    <div className={cn(pageWrap, "space-y-8")}>
      <Link
        href="/calendar"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-300"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} />
        Takvim (liste)
      </Link>
      <PageHeader
        title="Ay görünümü"
        description={b.label}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/calendar/month?m=${prev}`}
              className={cn(btnSecondary, "h-10 gap-1 px-3")}
            >
              <ChevronLeft className="size-4" />
            </Link>
            <Link
              href={`/calendar/month?m=${next}`}
              className={cn(btnSecondary, "h-10 gap-1 px-3")}
            >
              <ChevronRight className="size-4" />
            </Link>
            <Link href="/calendar/month" className={cn(btnSecondary, "h-10")}>
              <CalendarRange className="size-4" strokeWidth={1.75} />
              Bugünün ayı
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-7 gap-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-600 sm:gap-2 sm:text-xs">
        {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((d) => (
          <div key={d} className="px-1 py-2 text-center">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {blanks}
        {cells}
      </div>

      {events.length === 0 ? (
        <p className="text-center text-sm text-zinc-500">Bu ay için etkinlik yok.</p>
      ) : (
        <section className={cn(card, "p-5")}>
          <h2 className="text-sm font-semibold text-zinc-200">Ay içi liste</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {events.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/[0.04] py-2 last:border-0"
              >
                <Link href={`/clients/${e.clientId}`} className="font-medium text-violet-400">
                  {e.title}
                </Link>
                <span className="text-xs tabular-nums text-zinc-500">
                  {e.startDate}
                  {e.client ? ` · ${e.client.companyName}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
