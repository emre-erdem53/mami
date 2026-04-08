import Link from "next/link";
import { ArrowLeft, ClipboardList, ListTodo } from "lucide-react";
import { cancelTask, completeTask } from "@/app/actions/agency";
import { readState } from "@/lib/store";
import { isOpenTask } from "@/lib/task-utils";
import { localYMD } from "@/lib/date-utils";
import {
  daysUntilDeadline,
  urgencyChipClassName,
  urgencyFromDeadline,
  urgencyLabelTr,
  urgencyRank,
  type TaskUrgency,
} from "@/lib/task-urgency";
import type { Task, TaskStatus } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { pageWrap } from "@/components/ui/page-layout";
import { btnSecondary, card, labelSm, select } from "@/components/ui/styles";
import { cn } from "@/lib/cn";
import { WorkPlanToolbar } from "./work-plan-toolbar";

const statusLabel: Record<TaskStatus, string> = {
  not_started: "Başlanmadı",
  in_progress: "Devam",
  done: "Bitti",
  cancelled: "İptal",
};

const URGENCY_KEYS: TaskUrgency[] = [
  "critical",
  "high",
  "medium",
  "low",
  "none",
];

function buildWorkloadHref(
  nextU: string,
  assignee: string,
  clientId: string
): string {
  const p = new URLSearchParams();
  if (nextU && nextU !== "all") p.set("u", nextU);
  if (assignee) p.set("a", assignee);
  if (clientId) p.set("c", clientId);
  const q = p.toString();
  return q ? `/workload?${q}` : "/workload";
}

type Row = Task & {
  projectName: string;
  clientId: string;
  companyName: string;
  urgency: TaskUrgency;
};

export default async function WorkPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string; a?: string; c?: string }>;
}) {
  const { u: uRaw = "all", a: assignee = "", c: clientFilter = "" } =
    await searchParams;
  let u: TaskUrgency | "all" = "all";
  if (
    uRaw &&
    uRaw !== "all" &&
    (URGENCY_KEYS as readonly string[]).includes(uRaw)
  ) {
    u = uRaw as TaskUrgency;
  }

  const s = await readState();
  const readOnly = s.preferences.sessionRole === "viewer";
  const today = localYMD();
  const projectById = new Map(s.projects.map((p) => [p.id, p]));
  const clientById = new Map(s.clients.map((c) => [c.id, c]));

  const assignees = [
    ...new Set(
      s.tasks
        .filter((t) => isOpenTask(t))
        .map((t) => (t.assignee || "Atanmamış").trim() || "Atanmamış")
    ),
  ].sort((a, b) => a.localeCompare(b, "tr"));

  const rowsAll: Row[] = s.tasks
    .filter((t) => isOpenTask(t))
    .map((t) => {
      const p = projectById.get(t.projectId);
      const c = p ? clientById.get(p.clientId) : undefined;
      const urgency = urgencyFromDeadline(t.deadline, today);
      return {
        ...t,
        projectName: p?.name ?? "?",
        clientId: p?.clientId ?? "",
        companyName: c?.companyName ?? "?",
        urgency,
      };
    });

  const counts: Record<TaskUrgency, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    none: 0,
  };
  for (const t of rowsAll) counts[t.urgency]++;

  const filtered = rowsAll
    .filter((t) => {
      if (u !== "all" && t.urgency !== u) return false;
      if (assignee && (t.assignee || "Atanmamış") !== assignee) return false;
      if (clientFilter && t.clientId !== clientFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const ru = urgencyRank[a.urgency] - urgencyRank[b.urgency];
      if (ru !== 0) return ru;
      const da = a.deadline ?? "9999-99-99";
      const db = b.deadline ?? "9999-99-99";
      if (da !== db) return da.localeCompare(db);
      return a.title.localeCompare(b.title, "tr");
    });

  const teamPick = s.teamMembers.filter((m) => m.active).map((m) => m.name);
  const assigneeOptions =
    teamPick.length > 0 ? teamPick : ["Sen"];

  const clientOptions = [...s.clients]
    .sort((a, b) => a.companyName.localeCompare(b.companyName, "tr"))
    .map((c) => ({ id: c.id, companyName: c.companyName }));

  return (
    <div className={cn(pageWrap, "space-y-8 pb-16")}>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-300"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} />
        Panel
      </Link>

      <PageHeader
        title="İş planı"
        description="Açık görevler vadeye göre aciliyetlenir. Yeni planı buradan oluştur; vadeleri takvim ve panel ile uyumludur."
        actions={
          <WorkPlanToolbar clients={clientOptions} assignees={assigneeOptions} />
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div
          className={cn(
            card,
            "flex flex-col justify-center border-white/[0.06] p-4 ring-1 ring-white/[0.04]"
          )}
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            Açık görev
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
            {rowsAll.length}
          </p>
        </div>
        {(URGENCY_KEYS as TaskUrgency[]).map((key) => (
          <Link
            key={key}
            href={buildWorkloadHref(key, assignee, clientFilter)}
            className={cn(
              card,
              "flex flex-col justify-center border-white/[0.06] p-4 transition hover:border-white/[0.12] hover:bg-white/[0.02] ring-1 ring-white/[0.04]",
              u === key && "ring-violet-500/40"
            )}
          >
            <p
              className={cn(
                "text-[11px] font-medium uppercase tracking-wide",
                key === "critical"
                  ? "text-red-400/90"
                  : key === "high"
                    ? "text-orange-400/90"
                    : "text-zinc-500"
              )}
            >
              {urgencyLabelTr[key]}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-100">
              {counts[key]}
            </p>
          </Link>
        ))}
      </section>

      <form
        method="get"
        className={cn(
          card,
          "flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-end"
        )}
      >
        {u !== "all" ? <input type="hidden" name="u" value={u} /> : null}
        <label className="flex min-w-[160px] flex-col gap-1.5 sm:max-w-xs">
          <span className={labelSm}>Sorumlu</span>
          <select name="a" defaultValue={assignee} className={select}>
            <option value="">Tümü</option>
            {assignees.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-[200px] flex-col gap-1.5 sm:max-w-sm">
          <span className={labelSm}>Müşteri</span>
          <select name="c" defaultValue={clientFilter} className={select}>
            <option value="">Tümü</option>
            {clientOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={cn(btnSecondary, "h-10")}>
          Filtrele
        </button>
        <Link href="/workload" className={cn(btnSecondary, "h-10 inline-flex items-center px-4")}>
          Sıfırla
        </Link>
      </form>

      {filtered.length === 0 ? (
        <div className={cn(card, "p-12 text-center")}>
          <ListTodo className="mx-auto mb-3 size-12 text-zinc-600" strokeWidth={1.25} />
          <p className="text-sm font-medium text-zinc-300">
            {rowsAll.length === 0
              ? "Açık görev yok — yeni iş planı oluşturabilirsin."
              : "Filtreye uyan görev yok."}
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            Müşteri kartından da plan ekleyebilirsin; burada tüm operasyonu tek listede
            görürsün.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <div className={cn(card, "overflow-x-auto")}>
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="border-b border-white/[0.06] bg-zinc-950/60 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Aciliyet</th>
                    <th className="px-4 py-3 font-medium">Görev</th>
                    <th className="px-4 py-3 font-medium">Müşteri</th>
                    <th className="px-4 py-3 font-medium">Proje</th>
                    <th className="px-4 py-3 font-medium">Vade</th>
                    <th className="px-4 py-3 font-medium">Kalan gün</th>
                    <th className="px-4 py-3 font-medium">Sorumlu</th>
                    <th className="px-4 py-3 font-medium">Durum</th>
                    <th className="px-4 py-3 font-medium">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filtered.map((t) => {
                    const daysLeft =
                      t.deadline && t.urgency !== "none"
                        ? daysUntilDeadline(t.deadline, today)
                        : null;
                    return (
                      <tr
                        key={t.id}
                        className="transition-colors hover:bg-white/[0.02]"
                      >
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex rounded-lg px-2.5 py-1 text-xs font-medium ring-1",
                              urgencyChipClassName(t.urgency)
                            )}
                          >
                            {urgencyLabelTr[t.urgency]}
                          </span>
                        </td>
                        <td className="max-w-[220px] px-4 py-3">
                          <p className="truncate font-medium text-zinc-100">{t.title}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/clients/${t.clientId}`}
                            className="text-violet-400 hover:text-violet-300"
                          >
                            {t.companyName}
                          </Link>
                        </td>
                        <td className="max-w-[160px] px-4 py-3 text-zinc-500">
                          <span className="line-clamp-2">{t.projectName}</span>
                        </td>
                        <td className="px-4 py-3 tabular-nums text-zinc-400">
                          {t.deadline ?? "—"}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-zinc-500">
                          {daysLeft === null
                            ? "—"
                            : daysLeft < 0
                              ? `${daysLeft} (gecikti)`
                              : String(daysLeft)}
                        </td>
                        <td className="px-4 py-3 text-zinc-400">{t.assignee}</td>
                        <td className="px-4 py-3 text-xs text-zinc-500">
                          {statusLabel[t.status]}
                        </td>
                        <td className="px-4 py-3">
                          {readOnly ? (
                            <span className="text-xs text-zinc-600">—</span>
                          ) : (
                            <div className="flex flex-col gap-1.5">
                              {daysLeft !== null && daysLeft < 0 ? (
                                <span className="text-[10px] font-semibold text-red-400">
                                  Gecikti
                                </span>
                              ) : null}
                              <form action={completeTask.bind(null, t.id)}>
                                <button
                                  type="submit"
                                  className="w-full rounded-lg bg-emerald-500/15 px-2 py-1 text-[11px] font-medium text-emerald-200 ring-1 ring-emerald-500/30 hover:bg-emerald-500/25"
                                >
                                  Tamamla
                                </button>
                              </form>
                              <form action={cancelTask.bind(null, t.id)}>
                                <button
                                  type="submit"
                                  className="w-full rounded-lg px-2 py-1 text-[11px] font-medium text-red-400/90 hover:bg-red-500/10"
                                >
                                  İptal
                                </button>
                              </form>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <ul className="grid gap-3 md:hidden">
            {filtered.map((t) => {
              const daysLeft =
                t.deadline && t.urgency !== "none"
                  ? daysUntilDeadline(t.deadline, today)
                  : null;
              return (
                <li
                  key={t.id}
                  className={cn(
                    card,
                    "border-white/[0.06] p-4 ring-1 ring-white/[0.04]"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={cn(
                        "shrink-0 rounded-lg px-2 py-1 text-[11px] font-semibold ring-1",
                        urgencyChipClassName(t.urgency)
                      )}
                    >
                      {urgencyLabelTr[t.urgency]}
                    </span>
                    <span className="text-xs text-zinc-600">{statusLabel[t.status]}</span>
                  </div>
                  <p className="mt-2 font-medium text-zinc-100">{t.title}</p>
                  <p className="mt-1 text-xs text-zinc-500">{t.projectName}</p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                    <Link
                      href={`/clients/${t.clientId}`}
                      className="font-medium text-violet-400 hover:text-violet-300"
                    >
                      {t.companyName}
                    </Link>
                    <span>
                      Vade:{" "}
                      <span className="tabular-nums text-zinc-400">
                        {t.deadline ?? "—"}
                      </span>
                    </span>
                    {daysLeft !== null ? (
                      <span className="tabular-nums">
                        {daysLeft < 0 ? `${daysLeft} gün` : `${daysLeft} gün kaldı`}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs text-zinc-600">{t.assignee}</p>
                  {!readOnly ? (
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-white/[0.06] pt-3">
                      {daysLeft !== null && daysLeft < 0 ? (
                        <span className="text-[10px] font-semibold text-red-400">Gecikti</span>
                      ) : null}
                      <form action={completeTask.bind(null, t.id)}>
                        <button
                          type="submit"
                          className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-200 ring-1 ring-emerald-500/30"
                        >
                          Tamamla
                        </button>
                      </form>
                      <form action={cancelTask.bind(null, t.id)}>
                        <button
                          type="submit"
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-400"
                        >
                          İptal
                        </button>
                      </form>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </>
      )}

      <p className="flex items-center gap-2 text-xs text-zinc-600">
        <ClipboardList className="size-3.5 shrink-0" strokeWidth={1.75} />
        Aciliyet: gecikmiş veya 0–1 gün çok yüksek; 2–3 yüksek; 4–7 orta; 8+ düşük; vade
        yoksa tarih yok.
      </p>
    </div>
  );
}
