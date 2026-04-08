import Link from "next/link";
import { Building2, ChevronRight, Filter, Plus, UserSearch } from "lucide-react";
import { readState } from "@/lib/store";
import type { ProspectStage } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { btnPrimary, btnSecondary, card, labelSm, select } from "@/components/ui/styles";
import { cn } from "@/lib/cn";
import { pageWrap } from "@/components/ui/page-layout";

const stageLabel: Record<ProspectStage, string> = {
  new: "Yeni",
  contacted: "İletişim kuruldu",
  meeting: "Görüşme",
  proposal_sent: "Teklif gönderildi",
  negotiation: "Pazarlık / revizyon",
  won: "Müşteriye dönüştü",
  lost: "Kayıp",
};

export default async function ProspectsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const { stage: stageFilter = "" } = await searchParams;
  const s = await readState();
  const rows = (s.prospects ?? [])
    .filter((p) => {
      if (!stageFilter) return true;
      return p.stage === stageFilter;
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div className={cn(pageWrap, "space-y-8")}>
      <PageHeader
        title="Potansiyel müşteriler & teklifler"
        description="Henüz müşteri kartına almadığın fırsatlar: görüşme, gönderilen teklifler ve durum. Kazanınca tek tıkla müşteriye dönüştür."
        actions={
          <Link href="/prospects/new" className={btnPrimary + " h-10"}>
            <Plus className="size-4" strokeWidth={1.75} />
            Yeni potansiyel
          </Link>
        }
      />

      <form
        className={cn(card, "flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-end")}
        method="get"
      >
        <label className="flex w-full flex-col gap-1.5 sm:w-56">
          <span className={labelSm}>Aşama</span>
          <select name="stage" defaultValue={stageFilter} className={select}>
            <option value="">Tümü</option>
            {(Object.keys(stageLabel) as ProspectStage[]).map((k) => (
              <option key={k} value={k}>
                {stageLabel[k]}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={cn(btnSecondary, "h-10 gap-2")}>
          <Filter className="size-4" strokeWidth={1.75} />
          Filtrele
        </button>
      </form>

      <ul className="grid gap-3 sm:hidden">
        {rows.length === 0 ? (
          <li className={cn(card, "p-8 text-center text-sm text-zinc-500")}>
            Henüz potansiyel yok. Yeni kayıt ekleyerek başlayın.
          </li>
        ) : (
          rows.map((p) => (
            <li key={p.id}>
              <div
                className={cn(
                  card,
                  "flex flex-col gap-3 p-4 transition hover:border-white/[0.1] hover:bg-zinc-900/60"
                )}
              >
                <Link href={`/prospects/${p.id}`} className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20">
                      <UserSearch className="size-5" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{p.companyName}</p>
                      <p className="truncate text-sm text-zinc-500">{p.contactName}</p>
                    </div>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-zinc-600" />
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-zinc-800/80 px-2.5 py-1 text-xs font-medium text-zinc-300">
                    {stageLabel[p.stage]}
                  </span>
                  <span className="text-xs text-zinc-600">
                    {p.proposals.length} teklif
                  </span>
                  {p.convertedClientId ? (
                    <Link
                      href={`/clients/${p.convertedClientId}`}
                      className="text-xs font-medium text-violet-400 hover:underline"
                    >
                      Müşteri kartı →
                    </Link>
                  ) : null}
                </div>
              </div>
            </li>
          ))
        )}
      </ul>

      <div className={cn(card, "hidden overflow-x-auto sm:block")}>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-white/[0.06] bg-zinc-950/50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-5 py-3.5 font-medium">Firma</th>
              <th className="px-5 py-3.5 font-medium">Yetkili</th>
              <th className="hidden px-5 py-3.5 font-medium lg:table-cell">Sektör</th>
              <th className="px-5 py-3.5 font-medium">Aşama</th>
              <th className="px-5 py-3.5 font-medium">Teklif</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center text-zinc-500">
                  Henüz potansiyel yok.
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-5 py-4">
                    <Link
                      href={`/prospects/${p.id}`}
                      className="inline-flex items-center gap-2 font-medium text-cyan-400 hover:text-cyan-300"
                    >
                      <Building2 className="size-4 opacity-70" strokeWidth={1.75} />
                      {p.companyName}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-zinc-400">{p.contactName}</td>
                  <td className="hidden px-5 py-4 text-zinc-500 lg:table-cell">
                    {p.sector || "—"}
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex rounded-lg bg-zinc-800/80 px-2.5 py-1 text-xs font-medium text-zinc-300">
                      {stageLabel[p.stage]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-zinc-500">
                    {p.proposals.length} versiyon
                    {p.convertedClientId ? (
                      <Link
                        href={`/clients/${p.convertedClientId}`}
                        className="ml-2 text-violet-400 hover:underline"
                      >
                        CRM
                      </Link>
                    ) : null}
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
