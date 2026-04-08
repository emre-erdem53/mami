"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";

export function OverdueTasksBanner({
  count,
  preview,
}: {
  count: number;
  preview: string[];
}) {
  if (count <= 0) return null;
  return (
    <div
      className={cn(
        "mb-4 flex flex-col gap-2 rounded-xl border border-red-500/35 bg-red-950/35 px-4 py-3 text-sm text-red-100 sm:flex-row sm:items-center sm:justify-between"
      )}
      role="status"
    >
      <div className="flex min-w-0 items-start gap-2">
        <AlertTriangle
          className="mt-0.5 size-4 shrink-0 text-red-400"
          strokeWidth={1.75}
          aria-hidden
        />
        <div className="min-w-0">
          <p className="font-medium">
            <Link href="/workload" className="underline decoration-red-400/50 hover:decoration-red-300">
              {count} iş vadesi geçti
            </Link>
          </p>
          {preview.length > 0 ? (
            <p className="mt-1 line-clamp-2 text-xs text-red-200/80">{preview.join(" · ")}</p>
          ) : null}
        </div>
      </div>
      <Link
        href="/workload"
        className="shrink-0 text-xs font-medium text-red-200 underline hover:text-white"
      >
        İş planına git →
      </Link>
    </div>
  );
}
