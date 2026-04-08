"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { deleteClient } from "@/app/actions/agency";
import { btnDanger, btnSecondary } from "@/components/ui/styles";
import { cn } from "@/lib/cn";

export function ClientToolbar({
  clientId,
  readOnly,
}: {
  clientId: string;
  readOnly: boolean;
}) {
  if (readOnly) {
    return (
      <div className="flex flex-wrap gap-2">
        <a href="#musteri-genel" className={cn(btnSecondary, "h-10 gap-2 text-sm")}>
          <Pencil className="size-4" strokeWidth={1.75} />
          Bilgilere git
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a href="#musteri-genel" className={cn(btnSecondary, "h-10 gap-2 text-sm")}>
        <Pencil className="size-4" strokeWidth={1.75} />
        Genel bilgi düzenle
      </a>
      <Link href="/services" className={cn(btnSecondary, "h-10 text-sm")}>
        Hizmetleri yönet
      </Link>
      <form
        action={deleteClient.bind(null, clientId)}
        onSubmit={(e) => {
          if (
            !confirm(
              "Bu müşteri ve bağlı tüm veriler (projeler, görevler, ödemeler, etkinlikler) kalıcı olarak silinsin mi?"
            )
          ) {
            e.preventDefault();
          }
        }}
      >
        <button type="submit" className={cn(btnDanger, "h-10 gap-2 text-sm")}>
          <Trash2 className="size-4" strokeWidth={1.75} />
          Müşteriyi sil
        </button>
      </form>
    </div>
  );
}
