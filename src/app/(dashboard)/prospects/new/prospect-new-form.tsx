"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { createProspect } from "@/app/actions/agency";
import { btnPrimary, input, labelSm, select, textarea } from "@/components/ui/styles";
import { cn } from "@/lib/cn";

export function NewProspectForm() {
  const [state, formAction, pending] = useActionState(createProspect, undefined);

  return (
    <form action={formAction} className="space-y-5">
      {state?.error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-500/25 bg-red-950/35 px-4 py-3 text-sm text-red-200"
        >
          {state.error}
        </p>
      ) : null}
      <Field label="Firma adı *" name="companyName" required />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Yetkili" name="contactName" />
        <Field label="Telefon" name="phone" type="tel" />
      </div>
      <Field label="E-posta" name="email" type="email" />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Sektör" name="sector" />
        <Field label="Nereden geldi" name="leadSource" placeholder="Reklam, fuar, referans…" />
      </div>
      <label className="flex flex-col gap-1.5">
        <span className={labelSm}>Aşama</span>
        <select name="stage" className={select} defaultValue="new">
          <option value="new">Yeni</option>
          <option value="contacted">İletişim kuruldu</option>
          <option value="meeting">Görüşme</option>
          <option value="proposal_sent">Teklif gönderildi</option>
          <option value="negotiation">Pazarlık / revizyon</option>
          <option value="lost">Kayıp</option>
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={labelSm}>Notlar</span>
        <textarea name="notes" rows={4} className={textarea} />
      </label>
      <button type="submit" disabled={pending} className={cn(btnPrimary, "h-11 w-full")}>
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" strokeWidth={2} />
            Kaydediliyor…
          </>
        ) : (
          "Potansiyeli oluştur"
        )}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={labelSm}>{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className={input}
      />
    </label>
  );
}
