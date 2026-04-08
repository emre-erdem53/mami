import Link from "next/link";
import { ArrowLeft, Archive } from "lucide-react";
import { readState } from "@/lib/store";
import { dateFmt } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { pageWrap } from "@/components/ui/page-layout";
import { card } from "@/components/ui/styles";
import { cn } from "@/lib/cn";

const outcomeLabel: Record<"done" | "cancelled", string> = {
  done: "Tamamlandı",
  cancelled: "İptal",
};

type ClosedRow = {
  task: import("@/lib/types").Task;
  projectName: string;
  clientId: string;
  companyName: string;
  outcome: "done" | "cancelled";
  sortKey: string;
};

export default async function TaskArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c: clientFilter = "" } = await searchParams;
  const s = await readState();
  const projectById = new Map(s.projects.map((p) => [p.id, p]));
  const clientById = new Map(s.clients.map((c) => [c.id, c]));

  let rows: ClosedRow[] = s.tasks
    .filter((t): t is typeof t & { status: "done" | "cancelled" } =>
      t.status === "done" || t.status === "cancelled"
    )
    .map((t) => {
      const p = projectById.get(t.projectId);
      const c = p ? clientById.get(p.clientId) : undefined;
      const outcome = t.status as "done" | "cancelled";
      const sortKey =
        t.closedAt ??
        t.deadline ??
        "1970-01-01T00:00:00.000Z";
      return {
        task: t,
        projectName: p?.name ?? "—",
        clientId: p?.clientId ?? "",
        companyName: c?.companyName ?? "—",
        outcome,
        sortKey,
      };
    });

  if (clientFilter) {
    rows = rows.filter((r) => r.clientId === clientFilter);
  }

  rows.sort((a, b) => b.sortKey.localeCompare(a.sortKey));

  const filterClient = clientFilter
    ? s.clients.find((x) => x.id === clientFilter)
    : null;

  return (
    <div className={cn(pageWrap, "space-y-8")}>
      <Link
        href="/workload"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-300"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} />
        İş planı
      </Link>

      <PageHeader
        title="İş arşivi"
        description={
          filterClient
            ? `${filterClient.companyName} — tamamlanan ve iptal edilen görevler.`
            : "Tamamlanan ve iptal edilen tüm görevler; en yeniler üstte."
        }
      />

      <div className={cn(card, "overflow-x-auto")}>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-white/[0.06] bg-zinc-950/60 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Sonuç</th>
              <th className="px-4 py-3 font-medium">Görev</th>
              <th className="px-4 py-3 font-medium">Müşteri</th>
              <th className="px-4 py-3 font-medium">Proje</th>
              <th className="px-4 py-3 font-medium">Vade</th>
              <th className="px-4 py-3 font-medium">Kapanış</th>
              <th className="px-4 py-3 font-medium">Sorumlu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-zinc-500">
                  Arşivde kayıt yok.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.task.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-lg px-2 py-1 text-xs font-medium ring-1",
                        r.outcome === "done"
                          ? "bg-emerald-500/15 text-emerald-200 ring-emerald-500/25"
                          : "bg-zinc-500/15 text-zinc-400 ring-zinc-500/30"
                      )}
                    >
                      {outcomeLabel[r.outcome]}
                    </span>
                  </td>
                  <td className="max-w-[200px] px-4 py-3 font-medium text-zinc-200">
                    <span className="line-clamp-2">{r.task.title}</span>
                  </td>
                  <td className="px-4 py-3">
                    {r.clientId ? (
                      <Link
                        href={`/clients/${r.clientId}`}
                        className="text-violet-400 hover:text-violet-300"
                      >
                        {r.companyName}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="max-w-[140px] px-4 py-3 text-zinc-500">
                    <span className="line-clamp-2">{r.projectName}</span>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-zinc-500">
                    {r.task.deadline ? dateFmt(r.task.deadline) : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {r.task.closedAt
                      ? new Date(r.task.closedAt).toLocaleString("tr-TR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{r.task.assignee}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="flex items-center gap-2 text-xs text-zinc-600">
        <Archive className="size-3.5 shrink-0" strokeWidth={1.75} />
        İptal veya tamamlanan işler burada kalır; silinen kayıtlar arşivde görünmez.
      </p>
    </div>
  );
}
