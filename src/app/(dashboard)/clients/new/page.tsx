import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewClientForm } from "@/components/NewClientForm";
import { PageHeader } from "@/components/ui/page-header";
import { pageWrap } from "@/components/ui/page-layout";
import { card } from "@/components/ui/styles";
import { cn } from "@/lib/cn";
import { readState } from "@/lib/store";

export default async function NewClientPage() {
  const s = await readState();
  const services = s.services ?? [];

  return (
    <div className={cn(pageWrap, "space-y-8")}>
      <Link
        href="/clients"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-300"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} />
        Müşteriler
      </Link>
      <PageHeader
        title="Yeni müşteri"
        description="Temel bilgileri gir; projeler, teklif ve ödemeleri detay sayfasında genişletirsin."
      />
      <div
        className={cn(
          card,
          "mx-auto w-full max-w-2xl p-6 sm:p-8 2xl:max-w-3xl min-[2200px]:max-w-4xl"
        )}
      >
        <NewClientForm services={services} />
      </div>
    </div>
  );
}
