import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { card } from "./styles";

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent = "violet",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
  accent?: "violet" | "emerald" | "amber" | "sky";
}) {
  const accentRing = {
    violet: "bg-violet-500/10 text-violet-400 ring-violet-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
    sky: "bg-sky-500/10 text-sky-400 ring-sky-500/20",
  }[accent];

  return (
    <div
      className={cn(
        card,
        "group p-5 transition-all duration-300 hover:border-white/[0.09] hover:shadow-black/40"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          {label}
        </p>
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-xl ring-1 transition group-hover:scale-105",
            accentRing
          )}
        >
          <Icon className="size-4" strokeWidth={1.75} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums tracking-tight text-white sm:text-[1.75rem]">
        {value}
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-zinc-600">{hint}</p>
    </div>
  );
}
