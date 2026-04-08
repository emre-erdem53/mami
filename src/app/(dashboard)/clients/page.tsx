import Link from "next/link";
import { Building2, ChevronRight, Filter, Plus, Search } from "lucide-react";
import { localYMD } from "@/lib/date-utils";
import { readState } from "@/lib/store";
import {
  maxOpenTaskUrgencyForClient,
  urgencyChipClassName,
  urgencyLabelTr,
} from "@/lib/task-urgency";
import type { ClientPriority, Deal } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { btnPrimary, btnSecondary, card, input, labelSm, select } from "@/components/ui/styles";
import { cn } from "@/lib/cn";
import { pageWrap } from "@/components/ui/page-layout";

const priorityRank: Record<ClientPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

function offerSummary(d: Deal | undefined): string {
  if (!d) return "—";
  if (!d.offerGiven) return "Teklif yok";
  if (d.offerStatus === "pending") return "Teklif bekliyor";
  if (d.offerStatus === "approved") return "Onaylandı";
  if (d.offerStatus === "rejected") return "Reddedildi";
  return "Teklif";
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const { q = "", sort: sortRaw = "name" } = await searchParams;
  const sort =
    sortRaw === "priority" ? "priority" : sortRaw === "score" ? "score" : "name";
  const s = await readState();
  const today = localYMD();
  const ql = q.trim().toLowerCase();
  const rows = s.clients
    .map((c) => ({
      client: c,
      deal: s.deals.find((d) => d.clientId === c.id),
      taskUrgency: maxOpenTaskUrgencyForClient(c.id, s.tasks, s.projects, today),
    }))
    .filter(({ client: c }) => {
      if (ql) {
        const blob = `${c.companyName} ${c.contactName} ${c.sector} ${c.notes}`.toLowerCase();
        if (!blob.includes(ql)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sort === "score") return b.client.leadScore - a.client.leadScore;
      if (sort === "priority")
        return priorityRank[b.client.priority] - priorityRank[a.client.priority];
      return a.client.companyName.localeCompare(b.client.companyName, "tr");
    });

  return (
    <div className={cn(pageWrap, "space-y-8")}>
      <PageHeader
        title="Müşteriler"
        description="Tüm ilişkiler tek tıkla detayda — CRM, proje ve ödeme bir arada."
        actions={
          <Link href="/clients/new" className={btnPrimary + " h-10"}>
            <Plus className="size-4" strokeWidth={1.75} />
            Yeni müşteri
          </Link>
        }
      />

      <form
        className={cn(card, "flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-end")}
        method="get"
      >
        <label className="flex min-w-0 flex-1 flex-col gap-1.5 sm:min-w-[220px]">
          <span className={cn(labelSm, "inline-flex items-center gap-1.5")}>
            <Search className="size-3.5 text-zinc-500" strokeWidth={1.75} />
            Ara
          </span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Firma, yetkili, sektör…"
            className={input}
          />
        </label>
        <label className="flex w-full flex-col gap-1.5 sm:w-44">
          <span className={labelSm}>Sırala</span>
          <select name="sort" defaultValue={sort} className={select}>
            <option value="name">Firma (A-Z)</option>
            <option value="priority">Öncelik</option>
            <option value="score">Lead skoru</option>
          </select>
        </label>
        <button type="submit" className={cn(btnSecondary, "h-10 w-full gap-2 sm:w-auto")}>
          <Filter className="size-4" strokeWidth={1.75} />
          Filtrele
        </button>
      </form>

      <ul className="grid gap-3 sm:hidden">
        {rows.length === 0 ? (
          <li className={cn(card, "p-8 text-center text-sm text-zinc-500")}>
            Kayıt yok. Yeni müşteri ekleyerek başla.
          </li>
        ) : (
          rows.map(({ client: c, deal, taskUrgency }) => (
            <li key={c.id}>
              <div
                className={cn(
                  card,
                  "flex flex-col gap-3 p-4 transition hover:border-white/[0.1] hover:bg-zinc-900/60"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20">
                      <Building2 className="size-5" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">
                        {c.companyName || "İsimsiz"}
                      </p>
                      <p className="truncate text-sm text-zinc-500">{c.contactName}</p>
                    </div>
                  </div>
                  <Link
                    href={`/clients/${c.id}`}
                    className="shrink-0 text-zinc-600 hover:text-violet-400"
                    aria-label="Detay"
                  >
                    <ChevronRight className="size-5" />
                  </Link>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-zinc-800/80 px-2.5 py-1 text-xs font-medium text-zinc-300">
                    {offerSummary(deal)}
                  </span>
                  {taskUrgency ? (
                    <span
                      className={cn(
                        "rounded-lg px-2.5 py-1 text-xs font-medium ring-1",
                        urgencyChipClassName(taskUrgency)
                      )}
                    >
                      İş: {urgencyLabelTr[taskUrgency]}
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-600">Açık iş yok</span>
                  )}
                  {c.sector ? (
                    <span className="text-xs text-zinc-600">{c.sector}</span>
                  ) : null}
                </div>
              </div>
            </li>
          ))
        )}
      </ul>

      <div className={cn(card, "hidden overflow-x-auto sm:block")}>
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="border-b border-white/[0.06] bg-zinc-950/50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-5 py-3.5 font-medium">Firma</th>
              <th className="px-5 py-3.5 font-medium">Yetkili</th>
              <th className="hidden px-5 py-3.5 font-medium lg:table-cell">Sektör</th>
              <th className="px-5 py-3.5 font-medium">Teklif</th>
              <th className="px-5 py-3.5 font-medium">İş önceliği</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center text-zinc-500">
                  Kayıt yok. Yeni müşteri ekleyerek başla.
                </td>
              </tr>
            ) : (
              rows.map(({ client: c, deal, taskUrgency }) => (
                <tr
                  key={c.id}
                  className="transition-colors hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-4">
                    <Link
                      href={`/clients/${c.id}`}
                      className="inline-flex items-center gap-2 font-medium text-violet-400 hover:text-violet-300"
                    >
                      <Building2 className="size-4 opacity-70" strokeWidth={1.75} />
                      {c.companyName || "İsimsiz"}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-zinc-400">{c.contactName}</td>
                  <td className="hidden px-5 py-4 text-zinc-500 lg:table-cell">
                    {c.sector || "—"}
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex rounded-lg bg-zinc-800/80 px-2.5 py-1 text-xs font-medium text-zinc-300">
                      {offerSummary(deal)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {taskUrgency ? (
                      <span
                        className={cn(
                          "inline-flex rounded-lg px-2.5 py-1 text-xs font-medium ring-1",
                          urgencyChipClassName(taskUrgency)
                        )}
                      >
                        {urgencyLabelTr[taskUrgency]}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-600">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
