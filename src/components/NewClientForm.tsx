"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/app/actions/agency";
import { btnPrimary, input, labelSm, select, textarea } from "@/components/ui/styles";
import { cn } from "@/lib/cn";
import type { AgencyService } from "@/lib/types";

export function NewClientForm({ services = [] }: { services?: AgencyService[] }) {
  const [state, formAction, pending] = useActionState(createClient, undefined);

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
      <Field label="Yetkili kişi" name="contactName" />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Telefon" name="phone" type="tel" />
        <Field label="E-posta" name="email" type="email" />
      </div>
      <Field label="Sektör" name="sector" />
      <Field
        label="Nereden geldi"
        name="leadSource"
        placeholder="Referans, reklam, LinkedIn…"
      />
      <label className="flex flex-col gap-1.5">
        <span className={labelSm}>Notlar</span>
        <textarea name="notes" rows={4} className={textarea} />
      </label>
      <div className="rounded-xl border border-white/[0.06] bg-zinc-950/30 p-4">
        <p className={labelSm}>Verilecek hizmetler</p>
        <p className="mb-3 text-xs text-zinc-600">
          Birden fazla seçebilirsin. Katalog:{" "}
          <a href="/services" className="text-violet-400 hover:underline">
            Hizmetler
          </a>
        </p>
        {services.length === 0 ? (
          <p className="text-sm text-amber-200/90">
            Henüz tanımlı hizmet yok; önce katalog oluşturabilirsin.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {services.map((svc) => (
              <li key={svc.id}>
                <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-white/[0.06] bg-zinc-950/50 px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.03]">
                  <input
                    type="checkbox"
                    name="serviceId"
                    value={svc.id}
                    className="mt-1 size-4 rounded border-white/20 bg-zinc-900"
                  />
                  <span>
                    <span className="font-medium text-zinc-200">{svc.name}</span>
                    {svc.description ? (
                      <span className="mt-0.5 block text-xs text-zinc-500">
                        {svc.description}
                      </span>
                    ) : null}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5">
          <span className={labelSm}>Para birimi</span>
          <select name="currency" className={select} defaultValue="TRY">
            <option value="TRY">TRY</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelSm}>Öncelik</span>
          <select name="priority" className={select} defaultValue="medium">
            <option value="low">Düşük</option>
            <option value="medium">Orta</option>
            <option value="high">Yüksek</option>
          </select>
        </label>
        <Field
          label="Lead skoru (0–100)"
          name="leadScore"
          type="number"
          placeholder="50"
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Anlaşma tutarı"
          name="agreementAmount"
          type="number"
          step="0.01"
          placeholder="0"
        />
        <Field label="Sonraki ödeme tarihi" name="nextDueDate" type="date" />
      </div>
      <button type="submit" disabled={pending} className={cn(btnPrimary, "h-11 w-full")}>
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" strokeWidth={2} />
            Kaydediliyor…
          </>
        ) : (
          "Müşteriyi oluştur"
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
  step,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  step?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={labelSm}>{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        step={step}
        className={input}
      />
    </label>
  );
}
