"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Archive,
  CalendarDays,
  Briefcase,
  CalendarRange,
  CreditCard,
  Database,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  ScrollText,
  Settings,
  UserSearch,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { CommandPalette } from "@/components/CommandPalette";
import { NotificationInit } from "@/components/NotificationInit";
import { OverdueTasksBanner } from "@/components/OverdueTasksBanner";
import { cn } from "@/lib/cn";

export type ShellClientLink = { id: string; companyName: string };

const nav = [
  { href: "/", label: "Panel", icon: LayoutDashboard },
  { href: "/clients", label: "Müşteriler", icon: Users },
  { href: "/prospects", label: "Potansiyel & teklif", icon: UserSearch },
  { href: "/calendar", label: "Takvim", icon: CalendarDays },
  { href: "/calendar/month", label: "Ay görünümü", icon: CalendarRange },
  { href: "/workload", label: "İş planı", icon: ListTodo },
  { href: "/workload/archive", label: "İş arşivi", icon: Archive },
  { href: "/payments", label: "Ödemeler", icon: CreditCard },
] as const;

export function AppShell({
  children,
  pinned = [],
  recent = [],
  openRemindersCount = 0,
  remindersForNotify = [],
  overdueTasksForNotify = [],
  authEnabled = false,
  storageHint = "Veriler yerelde data/agency.json dosyasında.",
}: {
  children: React.ReactNode;
  pinned?: ShellClientLink[];
  recent?: ShellClientLink[];
  openRemindersCount?: number;
  remindersForNotify?: { title: string; dueAt: string; done: boolean }[];
  overdueTasksForNotify?: { title: string; companyName: string }[];
  authEnabled?: boolean;
  /** Sunucu (layout) tarafından üretilen depolama açıklaması */
  storageHint?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setOpen(false), 0);
    return () => window.clearTimeout(id);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="flex min-h-full bg-[#070709] text-zinc-100">
      <CommandPalette />
      <NotificationInit
        reminders={remindersForNotify}
        overdueTasks={overdueTasksForNotify}
      />

      {open ? (
        <button
          type="button"
          aria-label="Menüyü kapat"
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(18rem,88vw)] flex-col border-r border-white/[0.06] bg-[#050508] shadow-2xl shadow-black/50 transition-transform duration-300 ease-out lg:sticky lg:z-0 lg:w-60 lg:translate-x-0 lg:shadow-none",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-white/[0.06] px-4 lg:h-auto lg:border-0 lg:px-5 lg:pt-8">
          <Link
            href="/"
            className="flex flex-col gap-0.5"
            onClick={() => setOpen(false)}
          >
            <span className="text-lg font-semibold tracking-tight text-white">
              Mami
            </span>
            <span className="text-[11px] font-medium uppercase tracking-widest text-violet-400/90">
              Ajans OS
            </span>
          </Link>
          <button
            type="button"
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Kapat"
            onClick={() => setOpen(false)}
          >
            <X className="size-5" />
          </button>
        </div>

        {pinned.length > 0 ? (
          <div className="border-b border-white/[0.06] px-3 py-3">
            <p className="px-1 text-[10px] font-semibold uppercase tracking-widest text-amber-500/80">
              Sabitlenenler
            </p>
            <ul className="mt-2 space-y-1">
              {pinned.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/clients/${c.id}`}
                    className="block truncate rounded-lg px-2 py-1.5 text-xs font-medium text-amber-100/90 hover:bg-amber-500/10"
                    onClick={() => setOpen(false)}
                  >
                    {c.companyName}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {recent.length > 0 ? (
          <div className="border-b border-white/[0.06] px-3 py-3">
            <p className="px-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              Son bakılan
            </p>
            <ul className="mt-2 max-h-36 space-y-1 overflow-y-auto">
              {recent.slice(0, 8).map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/clients/${c.id}`}
                    className="block truncate rounded-lg px-2 py-1.5 text-xs text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                    onClick={() => setOpen(false)}
                  >
                    {c.companyName}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4 lg:px-4">
          {nav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-violet-600/15 text-violet-200 ring-1 ring-violet-500/25"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
                )}
                onClick={() => setOpen(false)}
              >
                <Icon className="size-[1.125rem] shrink-0 opacity-90" strokeWidth={1.75} />
                <span className="min-w-0 flex-1">{item.label}</span>
                {item.href === "/workload" && overdueTasksForNotify.length > 0 ? (
                  <span className="rounded-full bg-red-500/25 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-red-200">
                    {overdueTasksForNotify.length}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/[0.06] p-4">
          <div className="flex flex-col gap-1">
            <Link
              href="/team"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                pathname.startsWith("/team")
                  ? "bg-violet-600/15 text-violet-200 ring-1 ring-violet-500/25"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
              )}
              onClick={() => setOpen(false)}
            >
              <UsersRound className="size-[1.125rem] shrink-0" strokeWidth={1.75} />
              Ekip
            </Link>
            <Link
              href="/services"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                pathname.startsWith("/services")
                  ? "bg-violet-600/15 text-violet-200 ring-1 ring-violet-500/25"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
              )}
              onClick={() => setOpen(false)}
            >
              <Briefcase className="size-[1.125rem] shrink-0" strokeWidth={1.75} />
              Hizmetler
            </Link>
            <Link
              href="/settings"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                pathname.startsWith("/settings")
                  ? "bg-violet-600/15 text-violet-200 ring-1 ring-violet-500/25"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
              )}
              onClick={() => setOpen(false)}
            >
              <Settings className="size-[1.125rem] shrink-0" strokeWidth={1.75} />
              Ayarlar
            </Link>
            <Link
              href="/audit"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                pathname.startsWith("/audit")
                  ? "bg-violet-600/15 text-violet-200 ring-1 ring-violet-500/25"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
              )}
              onClick={() => setOpen(false)}
            >
              <ScrollText className="size-[1.125rem] shrink-0" strokeWidth={1.75} />
              Denetim günlüğü
            </Link>
          </div>
          {openRemindersCount > 0 ? (
            <p className="mt-3 px-1 text-[11px] text-amber-500/90">
              {openRemindersCount} açık hatırlatıcı
            </p>
          ) : null}
          {authEnabled ? (
            <button
              type="button"
              onClick={() => void logout()}
              className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-zinc-500 transition-colors hover:bg-white/[0.04] hover:text-zinc-300"
            >
              <LogOut className="size-[1.125rem] shrink-0" strokeWidth={1.75} />
              Çıkış
            </button>
          ) : null}
          <p className="mt-4 flex items-start gap-2 px-1 text-[10px] leading-relaxed text-zinc-600">
            <Database className="mt-0.5 size-3 shrink-0 text-zinc-500" />
            <span>{storageHint}</span>
          </p>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:min-h-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/[0.06] bg-[#070709]/90 px-4 backdrop-blur-md lg:hidden">
          <button
            type="button"
            className="rounded-xl p-2.5 text-zinc-300 hover:bg-white/5 hover:text-white"
            aria-label="Menüyü aç"
            onClick={() => setOpen(true)}
          >
            <Menu className="size-5" />
          </button>
          <span className="text-sm font-medium text-zinc-300">Mami</span>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 xl:px-12 xl:py-12 2xl:px-16 2xl:py-14 min-[2200px]:px-20">
          <OverdueTasksBanner
            count={overdueTasksForNotify.length}
            preview={overdueTasksForNotify.slice(0, 3).map(
              (o) => `${o.title} (${o.companyName})`
            )}
          />
          {children}
        </main>
      </div>
    </div>
  );
}
