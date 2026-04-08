import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { pageWrap } from "@/components/ui/page-layout";
import { card } from "@/components/ui/styles";
import { cn } from "@/lib/cn";
import { NewProspectForm } from "./prospect-new-form";

export default function NewProspectPage() {
  return (
    <div className={cn(pageWrap, "space-y-8")}>
      <Link
        href="/prospects"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-300"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} />
        Potansiyeller
      </Link>
      <PageHeader
        title="Yeni potansiyel"
        description="Görüşme ve teklif sürecini burada takip et; anlaşma olunca müşteri kartına dönüştürürsün."
      />
      <div className={cn(card, "mx-auto max-w-2xl p-6 sm:p-8")}>
        <NewProspectForm />
      </div>
    </div>
  );
}
