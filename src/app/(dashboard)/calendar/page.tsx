import Link from "next/link";
import { CalendarDays, Clapperboard, Megaphone, Sparkles } from "lucide-react";
import { readState } from "@/lib/store";
import { PageHeader } from "@/components/ui/page-header";
import { btnSecondary, card } from "@/components/ui/styles";
import { cn } from "@/lib/cn";
import { pageWrap } from "@/components/ui/page-layout";

const typeLabel: Record<string, string> = {
  post: "Post",
  shoot: "Çekim",
  ad_start: "Reklam",
  other: "Diğer",
};

const typeIcon = (t: string) => {
  switch (t) {
    case "post":
      return Sparkles;
    case "shoot":
      return Clapperboard;
    case "ad_start":
      return Megaphone;
    default:
      return CalendarDays;
  }
};

export default async function CalendarPage() {
  const s = await readState();
  const events = s.events
    .map((e) => ({
      ...e,
      client: s.clients.find((c) => c.id === e.clientId),
    }))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const byWeek = new Map<string, typeof events>();
  for (const e of events) {
    const d = new Date(e.startDate + "T12:00:00");
    const wk = weekKey(d);
    if (!byWeek.has(wk)) byWeek.set(wk, []);
    byWeek.get(wk)!.push(e);
  }
  const weeks = [...byWeek.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className={cn(pageWrap, "space-y-8")}>
      <PageHeader
        title="Takvim"
        description="Post planı, çekim ve reklam başlangıçları — etkinlikleri müşteri kartından yönet."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/calendar/month" className={btnSecondary + " h-10 gap-2"}>
              Ay görünümü
            </Link>
            <Link href="/clients" className={btnSecondary + " h-10 gap-2"}>
              <CalendarDays className="size-4" strokeWidth={1.75} />
              Müşteriler
            </Link>
          </div>
        }
      />

      <div className="space-y-10 2xl:columns-2 2xl:gap-x-10 2xl:gap-y-6 2xl:space-y-0 min-[2200px]:gap-x-14 2xl:[column-fill:balance]">
        {weeks.length === 0 ? (
          <div className={cn(card, "p-12 text-center")}>
            <CalendarDays className="mx-auto size-10 text-zinc-600" strokeWidth={1.25} />
            <p className="mt-4 text-sm text-zinc-500">Henüz etkinlik yok.</p>
            <Link
              href="/clients"
              className="mt-4 inline-block text-sm font-medium text-violet-400 hover:text-violet-300"
            >
              Müşteri seçerek ekle →
            </Link>
          </div>
        ) : (
          weeks.map(([wk, evs]) => (
            <section key={wk} className="break-inside-avoid pb-10 last:pb-0">
              <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                {wk}
                <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
              </h2>
              <ul className="space-y-3">
                {evs.map((e) => {
                  const Icon = typeIcon(e.type);
                  return (
                    <li key={e.id}>
                      <div
                        className={cn(
                          card,
                          "flex flex-col gap-3 p-4 transition hover:border-white/[0.09] sm:flex-row sm:items-start sm:justify-between"
                        )}
                      >
                        <div className="flex min-w-0 gap-3">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20">
                            <Icon className="size-5" strokeWidth={1.75} />
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-zinc-100">{e.title}</p>
                            {e.client ? (
                              <Link
                                href={`/clients/${e.client.id}`}
                                className="mt-0.5 inline-block text-sm text-violet-400 hover:underline"
                              >
                                {e.client.companyName}
                              </Link>
                            ) : null}
                            {e.notes ? (
                              <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                                {e.notes}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <div className="shrink-0 text-left sm:text-right">
                          <p className="text-xs font-medium text-violet-400/90">
                            {typeLabel[e.type] ?? e.type}
                          </p>
                          <p className="mt-1 text-xs tabular-nums text-zinc-500">
                            {e.startDate}
                            {e.endDate ? ` → ${e.endDate}` : ""}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

function weekKey(d: Date) {
  const start = new Date(d);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (x: Date) =>
    `${x.getDate()}.${x.getMonth() + 1}.${x.getFullYear()}`;
  return `${fmt(start)} – ${fmt(end)}`;
}
