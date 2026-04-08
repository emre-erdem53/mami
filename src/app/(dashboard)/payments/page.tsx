import Link from "next/link";
import { AlertTriangle, CheckCircle2, ChevronRight, CreditCard, Wallet } from "lucide-react";
import { getPaymentRows } from "@/app/actions/agency";
import { tryFmt } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { card } from "@/components/ui/styles";
import { cn } from "@/lib/cn";
import { pageWrap } from "@/components/ui/page-layout";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ overdue?: string }>;
}) {
  const { overdue } = await searchParams;
  const overdueOnly = overdue === "1" || overdue === "true";
  const rows = await getPaymentRows(overdueOnly);

  return (
    <div className={cn(pageWrap, "space-y-8")}>
      <PageHeader
        title="Ödemeler"
        description="Anlaşma, tahsilat ve kalan bakiye. Geciken vadeleri tek tıkla filtrele."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Link
              href="/payments"
              className={cn(
                "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition",
                !overdueOnly
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-950/30"
                  : "border border-white/10 bg-zinc-800/60 text-zinc-300 hover:bg-zinc-800"
              )}
            >
              <Wallet className="size-4" strokeWidth={1.75} />
              Tümü
            </Link>
            <Link
              href="/payments?overdue=1"
              className={cn(
                "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition",
                overdueOnly
                  ? "bg-amber-600 text-white shadow-lg shadow-amber-950/30"
                  : "border border-white/10 bg-zinc-800/60 text-zinc-300 hover:bg-zinc-800"
              )}
            >
              <AlertTriangle className="size-4" strokeWidth={1.75} />
              Geciken
            </Link>
          </div>
        }
      />

      {/* Mobile */}
      <ul className="grid gap-3 sm:hidden">
        {rows.length === 0 ? (
          <li className={cn(card, "p-10 text-center text-sm text-zinc-500")}>
            {overdueOnly ? "Geciken ödeme yok." : "Müşteri ekleyerek başla."}
          </li>
        ) : (
          rows.map(({ client: c, remaining, overdue }) => (
            <li key={c.id}>
              <Link
                href={`/clients/${c.id}`}
                className={cn(
                  card,
                  "flex flex-col gap-3 p-4 transition hover:border-white/[0.1] active:scale-[0.99]"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 ring-1 ring-white/5">
                      <CreditCard className="size-5" strokeWidth={1.75} />
                    </span>
                    <div>
                      <p className="font-semibold text-white">{c.companyName}</p>
                      <p className="text-xs text-zinc-500">
                        Vade: {c.payment.nextDueDate ?? "—"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="size-5 text-zinc-600" />
                </div>
                <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
                  <span className="text-lg font-semibold tabular-nums text-zinc-200">
                    {tryFmt(remaining)}
                  </span>
                  {overdue ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-950/50 px-2 py-1 text-xs font-medium text-amber-400 ring-1 ring-amber-500/20">
                      <AlertTriangle className="size-3.5" />
                      Gecikmiş
                    </span>
                  ) : remaining > 0 ? (
                    <span className="text-xs text-zinc-500">Bakiye</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500">
                      <CheckCircle2 className="size-3.5" />
                      Kapandı
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))
        )}
      </ul>

      {/* Desktop */}
      <div className={cn(card, "hidden overflow-x-auto sm:block")}>
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-white/[0.06] bg-zinc-950/50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-5 py-3.5 font-medium">Müşteri</th>
              <th className="px-5 py-3.5 font-medium">Sonraki vade</th>
              <th className="px-5 py-3.5 text-right font-medium">Kalan</th>
              <th className="px-5 py-3.5 font-medium">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-14 text-center text-zinc-500">
                  {overdueOnly
                    ? "Geciken ödeme yok."
                    : "Müşteri ekleyerek başla."}
                </td>
              </tr>
            ) : (
              rows.map(({ client: c, remaining, overdue }) => (
                <tr key={c.id} className="hover:bg-white/[0.02]">
                  <td className="px-5 py-4">
                    <Link
                      href={`/clients/${c.id}`}
                      className="font-medium text-violet-400 hover:text-violet-300"
                    >
                      {c.companyName}
                    </Link>
                  </td>
                  <td className="px-5 py-4 tabular-nums text-zinc-400">
                    {c.payment.nextDueDate ?? "—"}
                  </td>
                  <td className="px-5 py-4 text-right text-base font-semibold tabular-nums text-zinc-200">
                    {tryFmt(remaining)}
                  </td>
                  <td className="px-5 py-4">
                    {overdue ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-amber-950/50 px-2.5 py-1 text-xs font-medium text-amber-400 ring-1 ring-amber-500/20">
                        <AlertTriangle className="size-3.5" />
                        Gecikmiş
                      </span>
                    ) : remaining > 0 ? (
                      <span className="text-xs text-zinc-500">Bakiye var</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500">
                        <CheckCircle2 className="size-3.5" />
                        Kapandı
                      </span>
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
