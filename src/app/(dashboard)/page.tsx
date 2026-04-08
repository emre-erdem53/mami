import Link from "next/link";
import {
  Bell,
  CalendarDays,
  ClipboardList,
  FolderKanban,
  Plus,
  TrendingUp,
  UserSearch,
  Users,
  Wallet,
} from "lucide-react";
import { addReminder, toggleReminder } from "@/app/actions/agency";
import { dashboardStatsFromState } from "@/lib/dashboard-stats";
import { dateFmt, tryFmt } from "@/lib/format";
import { localYMD } from "@/lib/date-utils";
import { readState } from "@/lib/store";
import { isOpenTask } from "@/lib/task-utils";
import {
  daysUntilDeadline,
  urgencyChipClassName,
  urgencyFromDeadline,
  urgencyLabelTr,
  urgencyRank,
} from "@/lib/task-urgency";
import type { Reminder } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { btnPrimary, btnSecondary, card, input, labelSm, select } from "@/components/ui/styles";
import { cn } from "@/lib/cn";
import { pageWrap } from "@/components/ui/page-layout";

/** Her istekte `data/agency.json` güncel okunur (statik önbellek yok). */
export const dynamic = "force-dynamic";

const reminderKindLabel: Record<Reminder["kind"], string> = {
  call: "Arama",
  payment: "Ödeme",
  other: "Diğer",
};

function formatReminderDue(iso: string): string {
  try {
    const hasTime = iso.includes("T") && iso.length > 10;
    const d = new Date(
      hasTime ? iso : `${iso.slice(0, 10)}T12:00:00`
    );
    if (Number.isNaN(d.getTime())) return iso.replace("T", " ");
    return new Intl.DateTimeFormat("tr-TR", {
      dateStyle: "medium",
      timeStyle: hasTime ? "short" : undefined,
    }).format(d);
  } catch {
    return iso.slice(0, 16).replace("T", " ");
  }
}

export default async function DashboardPage() {
  const s = await readState();
  const stats = dashboardStatsFromState(s);
  const today = localYMD();

  const upcomingEvents = s.events
    .filter((e) => e.startDate >= today)
    .map((e) => ({
      ...e,
      client: s.clients.find((c) => c.id === e.clientId)?.companyName ?? "—",
      clientId: e.clientId,
    }))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 8);

  const pastEventCount = s.events.filter((e) => e.startDate < today).length;

  const projectById = new Map(s.projects.map((p) => [p.id, p]));
  const upcomingTasks = s.tasks
    .filter((t) => isOpenTask(t) && t.deadline)
    .map((t) => {
      const proj = projectById.get(t.projectId);
      const client = proj
        ? s.clients.find((c) => c.id === proj.clientId)
        : undefined;
      const urgency = urgencyFromDeadline(t.deadline, today);
      return {
        ...t,
        projectName: proj?.name ?? "—",
        clientId: proj?.clientId ?? "",
        clientName: client?.companyName ?? "—",
        urgency,
      };
    })
    .sort((a, b) => {
      const ru = urgencyRank[a.urgency] - urgencyRank[b.urgency];
      if (ru !== 0) return ru;
      return (a.deadline ?? "").localeCompare(b.deadline ?? "");
    })
    .slice(0, 10);

  const dueReminders = s.reminders
    .filter((r) => !r.done)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
    .slice(0, 6);

  const clientsSorted = [...s.clients].sort((a, b) =>
    a.companyName.localeCompare(b.companyName, "tr")
  );

  return (
    <div className={cn(pageWrap, "space-y-8 sm:space-y-10")}>
      <PageHeader
        title="Panel"
        description="Müşteri, satış ve içerik akışını tek yerden takip et."
        actions={
          <>
            <Link href="/calendar" className={btnSecondary + " h-10"}>
              <CalendarDays className="size-4" strokeWidth={1.75} />
              Takvim
            </Link>
            <Link href="/prospects/new" className={btnSecondary + " h-10"}>
              <UserSearch className="size-4" strokeWidth={1.75} />
              Potansiyel
            </Link>
            <Link href="/clients/new" className={btnPrimary + " h-10"}>
              <Plus className="size-4" strokeWidth={1.75} />
              Yeni müşteri
            </Link>
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 2xl:gap-5 min-[1800px]:gap-6">
        <StatCard
          icon={Users}
          label="Toplam müşteri"
          value={String(stats.totalClients)}
          hint="CRM kayıtları"
          accent="violet"
        />
        <StatCard
          icon={Wallet}
          label="Aylık tahsilat"
          value={tryFmt(stats.monthlyRevenue)}
          hint="Bu ay girilen ödemeler (TRY)"
          accent="emerald"
        />
        <StatCard
          icon={FolderKanban}
          label="Aktif projeler"
          value={String(stats.activeProjects)}
          hint="Tamamlanmamış işi olan"
          accent="sky"
        />
        <StatCard
          icon={Bell}
          label="Açık hatırlatıcı"
          value={String(stats.openReminders)}
          hint="Tamamlanmadı"
          accent="amber"
        />
        <StatCard
          icon={TrendingUp}
          label="Bekleyen teklif tutarı"
          value={tryFmt(stats.pendingOfferTotal)}
          hint="Verilmiş teklif, onay bekliyor"
          accent="violet"
        />
        <StatCard
          icon={UserSearch}
          label="Aktif potansiyel"
          value={String(stats.activeProspects)}
          hint="Kayıp değil, henüz müşteriye dönmemiş"
          accent="sky"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8 2xl:grid-cols-3 2xl:gap-8 min-[2200px]:gap-10">
        <section className={cn(card, "p-5 sm:p-6")}>
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20">
                <CalendarDays className="size-4" strokeWidth={1.75} />
              </span>
              <h2 className="text-sm font-semibold text-zinc-200">
                Yaklaşan takvim
              </h2>
            </div>
            <Link
              href="/calendar"
              className="text-xs font-medium text-violet-400 hover:text-violet-300"
            >
              Tümü →
            </Link>
          </div>
          <ul className="space-y-1">
            {upcomingEvents.length === 0 ? (
              <li className="py-8 text-center text-sm text-zinc-500">
                {s.events.length === 0
                  ? "Henüz takvim etkinliği yok."
                  : `Bugünden sonraki etkinlik yok (${pastEventCount} geçmiş kayıt).`}
              </li>
            ) : (
              upcomingEvents.map((e) => (
                <li
                  key={e.id}
                  className="flex flex-col gap-1 rounded-xl border border-transparent px-3 py-3 transition hover:border-white/[0.06] hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-200">
                      {e.title}
                    </p>
                    <Link
                      href={`/clients/${e.clientId}`}
                      className="text-xs text-zinc-500 hover:text-violet-400"
                    >
                      {e.client}
                    </Link>
                  </div>
                  <time
                    className="shrink-0 text-xs tabular-nums text-violet-400/90"
                    dateTime={e.startDate}
                  >
                    {dateFmt(e.startDate)}
                  </time>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className={cn(card, "p-5 sm:p-6")}>
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20">
                <ClipboardList className="size-4" strokeWidth={1.75} />
              </span>
              <h2 className="text-sm font-semibold text-zinc-200">
                Yaklaşan görevler
              </h2>
            </div>
            <Link
              href="/workload"
              className="text-xs font-medium text-violet-400 hover:text-violet-300"
            >
              İş planı →
            </Link>
          </div>
          <ul className="space-y-1">
            {upcomingTasks.length === 0 ? (
              <li className="py-8 text-center text-sm text-zinc-500">
                Vadeli açık görev yok.
              </li>
            ) : (
              upcomingTasks.map((t) => {
                const daysLeft = t.deadline
                  ? daysUntilDeadline(t.deadline, today)
                  : null;
                return (
                  <li
                    key={t.id}
                    className="flex flex-col gap-2 rounded-xl border border-transparent px-3 py-3 transition hover:border-white/[0.06] hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1",
                            urgencyChipClassName(t.urgency)
                          )}
                        >
                          {urgencyLabelTr[t.urgency]}
                        </span>
                        <p className="min-w-0 truncate text-sm font-medium text-zinc-200">
                          {t.title}
                        </p>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-zinc-600">
                        {t.projectName}
                        {t.assignee ? ` · ${t.assignee}` : ""}
                      </p>
                      {t.clientId ? (
                        <Link
                          href={`/clients/${t.clientId}`}
                          className="mt-0.5 inline-block text-xs text-zinc-500 hover:text-violet-400"
                        >
                          {t.clientName}
                        </Link>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-0.5 sm:text-right">
                      <time
                        className="text-xs tabular-nums text-violet-400/90"
                        dateTime={t.deadline}
                      >
                        {t.deadline ? dateFmt(t.deadline) : ""}
                      </time>
                      {daysLeft !== null ? (
                        <span className="text-[10px] tabular-nums text-zinc-600">
                          {daysLeft < 0
                            ? `${daysLeft} gün (gecikti)`
                            : daysLeft === 0
                              ? "Bugün"
                              : `${daysLeft} gün kaldı`}
                        </span>
                      ) : null}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </section>

        <section className={cn(card, "p-5 sm:p-6")}>
          <div className="mb-4 flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
              <Bell className="size-4" strokeWidth={1.75} />
            </span>
            <h2 className="text-sm font-semibold text-zinc-200">Hatırlatıcılar</h2>
          </div>
          <ul className="space-y-2">
            {dueReminders.length === 0 ? (
              <li className="py-6 text-center text-sm text-zinc-500">
                Açık hatırlatıcı yok.
              </li>
            ) : (
              dueReminders.map((r) => {
                const rc = r.clientId
                  ? s.clients.find((c) => c.id === r.clientId)
                  : null;
                return (
                  <li
                    key={r.id}
                    className="flex flex-col gap-2 rounded-xl border border-white/[0.04] bg-zinc-950/30 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-zinc-800/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                          {reminderKindLabel[r.kind]}
                        </span>
                        <p className="text-sm text-zinc-200">{r.title}</p>
                      </div>
                      <p className="mt-1 text-xs text-zinc-600">
                        {formatReminderDue(r.dueAt)}
                      </p>
                      {rc ? (
                        <Link
                          href={`/clients/${rc.id}`}
                          className="mt-1 inline-block text-xs font-medium text-violet-400 hover:underline"
                        >
                          {rc.companyName}
                        </Link>
                      ) : null}
                    </div>
                    <form action={toggleReminder.bind(null, r.id)} className="shrink-0">
                      <button
                        type="submit"
                        className={btnSecondary + " h-9 px-3 text-xs"}
                      >
                        Tamamlandı
                      </button>
                    </form>
                  </li>
                );
              })
            )}
          </ul>
          <form
            action={addReminder}
            className="mt-5 space-y-3 border-t border-white/[0.06] pt-5"
          >
            <p className={labelSm}>Genel hatırlatıcı</p>
            <input
              name="title"
              placeholder="Başlık"
              className={input}
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <input
                name="dueAt"
                type="datetime-local"
                className={cn(input, "sm:min-w-[220px] sm:flex-1")}
              />
              <select name="clientId" className={cn(select, "sm:min-w-[200px] sm:max-w-xs")} defaultValue="">
                <option value="">Müşteri (opsiyonel)</option>
                {clientsSorted.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName || "İsimsiz"}
                  </option>
                ))}
              </select>
              <select name="kind" className={cn(select, "sm:w-40")}>
                <option value="call">Arama</option>
                <option value="payment">Ödeme</option>
                <option value="other">Diğer</option>
              </select>
              <select name="recurrence" className={cn(select, "sm:w-36")} defaultValue="none">
                <option value="none">Tek sefer</option>
                <option value="weekly">Haftalık</option>
                <option value="monthly">Aylık</option>
              </select>
              <button type="submit" className={btnSecondary + " h-10 sm:px-5"}>
                Ekle
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
