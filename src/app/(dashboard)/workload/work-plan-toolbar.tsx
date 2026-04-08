"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { CalendarRange, Plus, X } from "lucide-react";
import { createWorkPlanFromPanel } from "@/app/actions/agency";
import {
  btnPrimary,
  btnSecondary,
  input,
  labelSm,
  select,
  textarea,
} from "@/components/ui/styles";
import { cn } from "@/lib/cn";

function CreatePlanSubmit({ noClients }: { noClients: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={noClients || pending}
      className={cn(btnPrimary, "h-10")}
    >
      {pending ? "Oluşturuluyor…" : "Planı oluştur"}
    </button>
  );
}

export function WorkPlanToolbar({
  clients,
  assignees,
}: {
  clients: { id: string; companyName: string }[];
  assignees: string[];
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) panelRef.current?.querySelector<HTMLElement>("select")?.focus();
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(btnPrimary, "h-10 gap-2")}
      >
        <Plus className="size-4" strokeWidth={1.75} />
        Yeni iş planı
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 sm:items-center sm:p-6"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="work-plan-dialog-title"
            className="max-h-[min(92vh,720px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/[0.08] bg-zinc-950 p-5 shadow-2xl shadow-black/50 sm:p-6"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/25">
                  <CalendarRange className="size-4" strokeWidth={1.75} />
                </span>
                <div>
                  <h2
                    id="work-plan-dialog-title"
                    className="text-base font-semibold text-white"
                  >
                    İş planı oluştur
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Başlangıç ve bitiş doldurursan, tarih yazmadığın satırlara bu aralıkta
                    eşit vadeler atanır. İstersen satırda{" "}
                    <code className="text-zinc-600">| 2026-04-15</code> kullan.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-300"
                aria-label="Kapat"
              >
                <X className="size-5" strokeWidth={1.75} />
              </button>
            </div>

            <form action={createWorkPlanFromPanel} className="grid gap-4">
              <label className="flex flex-col gap-1.5">
                <span className={labelSm}>Müşteri *</span>
                <select name="clientId" required className={select} defaultValue="">
                  <option value="" disabled>
                    Seç…
                  </option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName || "İsimsiz"}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelSm}>Plan / proje adı *</span>
                <input
                  name="planName"
                  required
                  placeholder="Örn. Nisan lansman paketi"
                  className={input}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className={labelSm}>İş başlangıcı</span>
                  <input name="planStartDate" type="date" className={input} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelSm}>İş bitişi</span>
                  <input name="planEndDate" type="date" className={input} />
                </label>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className={labelSm}>Görevler * (satır başına bir görev)</span>
                <textarea
                  name="taskLines"
                  required
                  rows={6}
                  placeholder={
                    "Storyboard onayı\nÇekim günü | 2026-04-12\nİlk kurgu teslimi"
                  }
                  className={textarea}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelSm}>Varsayılan sorumlu</span>
                <select
                  name="defaultAssignee"
                  className={select}
                  defaultValue={assignees[0] ?? "Sen"}
                >
                  {assignees.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  name="syncCalendar"
                  className="size-4 rounded border-white/20 bg-zinc-900 text-violet-600"
                />
                Vadeleri takvime yaz
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                <CreatePlanSubmit noClients={clients.length === 0} />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className={cn(btnSecondary, "h-10")}
                >
                  Vazgeç
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
