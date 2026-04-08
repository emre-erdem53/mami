import Link from "next/link";
import { ArrowLeft, ScrollText } from "lucide-react";
import { readState } from "@/lib/store";
import { PageHeader } from "@/components/ui/page-header";
import { pageWrap } from "@/components/ui/page-layout";
import { card } from "@/components/ui/styles";
import { cn } from "@/lib/cn";

export default async function AuditPage() {
  const s = await readState();
  const log = [...(s.auditLog ?? [])].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <div className={cn(pageWrap, "space-y-8")}>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-300"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} />
        Panel
      </Link>
      <PageHeader
        title="Denetim günlüğü"
        description="Son işlemler — yerel JSON üzerinde tutulur (üretimde DB/log kanalına taşınabilir)."
      />

      <div className={cn(card, "overflow-x-auto")}>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-white/[0.06] bg-zinc-950/50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Zaman</th>
              <th className="px-4 py-3 font-medium">Eylem</th>
              <th className="px-4 py-3 font-medium">Varlık</th>
              <th className="px-4 py-3 font-medium">Detay</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {log.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-zinc-500">
                  <ScrollText className="mx-auto mb-2 size-8 text-zinc-600" strokeWidth={1.25} />
                  Henüz kayıt yok.
                </td>
              </tr>
            ) : (
              log.map((row) => (
                <tr key={row.id} className="hover:bg-white/[0.02]">
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-zinc-500">
                    {new Date(row.at).toLocaleString("tr-TR")}
                  </td>
                  <td className="px-4 py-3 font-medium text-violet-300">{row.action}</td>
                  <td className="px-4 py-3 text-zinc-400">
                    {row.entity}
                    {row.entityId ? (
                      <span className="mt-0.5 block truncate text-xs text-zinc-600">
                        {row.entityId}
                      </span>
                    ) : null}
                  </td>
                  <td className="max-w-md px-4 py-3 text-zinc-500">
                    {row.detail ?? "—"}
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
