"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  Briefcase,
  CalendarDays,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  ListTodo,
  Search,
  Settings,
  UserSearch,
  Users,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/cn";

type ClientRow = { id: string; companyName: string };

const shortcuts = [
  { href: "/", label: "Panel", icon: LayoutDashboard },
  { href: "/clients", label: "Müşteriler", icon: Users },
  { href: "/prospects", label: "Potansiyel & teklif", icon: UserSearch },
  { href: "/calendar", label: "Takvim", icon: CalendarDays },
  { href: "/calendar/month", label: "Takvim (ay görünümü)", icon: CalendarDays },
  { href: "/payments", label: "Ödemeler", icon: CreditCard },
  { href: "/payments?overdue=1", label: "Geciken ödemeler", icon: CreditCard },
  { href: "/services", label: "Hizmet kataloğu", icon: Briefcase },
  { href: "/settings", label: "Ayarlar", icon: Settings },
  { href: "/audit", label: "Denetim günlüğü", icon: ClipboardList },
  { href: "/workload", label: "İş planı", icon: ListTodo },
  { href: "/workload/archive", label: "İş arşivi", icon: Archive },
  { href: "/team", label: "Ekip", icon: UsersRound },
] as const;

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [clients, setClients] = useState<ClientRow[]>([]);

  const loadClients = useCallback(async () => {
    try {
      const res = await fetch("/api/panel/clients");
      if (!res.ok) return;
      const data = await res.json();
      setClients(data.clients ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => {
          const next = !o;
          if (next) void loadClients();
          return next;
        });
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loadClients]);

  const ql = q.trim().toLowerCase();
  const filteredClients = useMemo(() => {
    if (!ql) return clients.slice(0, 8);
    return clients
      .filter((c) => c.companyName.toLowerCase().includes(ql))
      .slice(0, 12);
  }, [clients, ql]);

  const filteredShortcuts = useMemo(() => {
    if (!ql) return [...shortcuts];
    return shortcuts.filter((s) => s.label.toLowerCase().includes(ql));
  }, [ql]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Kapat"
        onClick={() => setOpen(false)}
      />
      <div
        className={cn(
          "relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl shadow-black/50 ring-1 ring-white/5"
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
          <Search className="size-4 text-zinc-500" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Müşteri veya sayfa ara…"
            className="h-10 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
          />
          <kbd className="hidden rounded border border-white/10 bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-500 sm:inline">
            Esc
          </kbd>
        </div>
        <div className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
          {filteredShortcuts.length > 0 ? (
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
              Sayfalar
            </p>
          ) : null}
          {filteredShortcuts.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.href}
                type="button"
                onClick={() => {
                  router.push(s.href);
                  setOpen(false);
                  setQ("");
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-zinc-200 hover:bg-white/5"
              >
                <Icon className="size-4 text-violet-400" strokeWidth={1.75} />
                {s.label}
              </button>
            );
          })}
          {filteredClients.length > 0 ? (
            <p className="mt-2 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
              Müşteriler
            </p>
          ) : null}
          {filteredClients.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                router.push(`/clients/${c.id}`);
                setOpen(false);
                setQ("");
              }}
              className="flex w-full flex-col items-start gap-0.5 rounded-xl px-3 py-2.5 text-left hover:bg-white/5"
            >
              <span className="text-sm font-medium text-white">{c.companyName}</span>
            </button>
          ))}
          {ql && filteredShortcuts.length === 0 && filteredClients.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-zinc-500">Sonuç yok</p>
          ) : null}
        </div>
        <p className="border-t border-white/10 px-3 py-2 text-center text-[10px] text-zinc-600">
          <kbd className="rounded border border-white/10 px-1">⌘</kbd>{" "}
          <kbd className="rounded border border-white/10 px-1">K</kbd> ile aç / kapat
        </p>
      </div>
    </div>
  );
}
