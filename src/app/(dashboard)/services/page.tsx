import Link from "next/link";
import { ArrowLeft, Briefcase, Trash2 } from "lucide-react";
import { addAgencyService, deleteAgencyService } from "@/app/actions/agency";
import { readState } from "@/lib/store";
import { PageHeader } from "@/components/ui/page-header";
import { pageWrap } from "@/components/ui/page-layout";
import { btnPrimary, btnSecondary, card, input, labelSm, textarea } from "@/components/ui/styles";
import { cn } from "@/lib/cn";

export default async function ServicesPage() {
  const s = await readState();
  const list = [...s.services].sort((a, b) => a.name.localeCompare(b.name, "tr"));

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
        title="Hizmet kataloğu"
        description="Ajansın sattığı hizmetleri burada tanımlarsın. Müşteri oluştururken ve müşteri kartında bu listeden çoklu seçim yapılır."
      />

      <form
        action={addAgencyService}
        className={cn(card, "grid gap-4 p-5 sm:grid-cols-2 lg:max-w-3xl")}
      >
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className={labelSm}>Hizmet adı *</span>
          <input name="name" required className={input} placeholder="Örn. Kurumsal kimlik paketi" />
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className={labelSm}>Kısa açıklama (opsiyonel)</span>
          <textarea name="description" rows={2} className={textarea} />
        </label>
        <button type="submit" className={cn(btnPrimary, "h-10 w-fit sm:col-span-2")}>
          Hizmet ekle
        </button>
      </form>

      <ul className="space-y-3">
        {list.length === 0 ? (
          <li className={cn(card, "p-8 text-center text-sm text-zinc-500")}>
            Henüz hizmet yok. Yukarıdan ekleyerek başla.
          </li>
        ) : (
          list.map((svc) => (
            <li
              key={svc.id}
              className={cn(
                card,
                "flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
              )}
            >
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20">
                  <Briefcase className="size-5" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="font-medium text-zinc-100">{svc.name}</p>
                  {svc.description ? (
                    <p className="mt-1 text-sm text-zinc-500">{svc.description}</p>
                  ) : null}
                  <p className="mt-1 text-[11px] text-zinc-600">ID: {svc.id}</p>
                </div>
              </div>
              <form action={deleteAgencyService.bind(null, svc.id)}>
                <button
                  type="submit"
                  className={cn(btnSecondary, "h-9 gap-1.5 text-xs text-red-300 hover:border-red-500/30")}
                >
                  <Trash2 className="size-3.5" />
                  Sil
                </button>
              </form>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
