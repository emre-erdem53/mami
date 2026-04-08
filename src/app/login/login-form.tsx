"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { btnPrimary, card, input, labelSm } from "@/components/ui/styles";
import { cn } from "@/lib/cn";

export function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Giriş başarısız");
        return;
      }
      router.push(next);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#070709] px-4">
      <div className={cn(card, "w-full max-w-md p-8")}>
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/25">
            <Lock className="size-6" strokeWidth={1.75} />
          </span>
          <h1 className="text-xl font-semibold text-white">Mami panel</h1>
          <p className="text-sm text-zinc-500">
            Devam etmek için panel şifresini girin.
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          {error ? (
            <p className="rounded-xl border border-red-500/25 bg-red-950/40 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          ) : null}
          <label className="flex flex-col gap-1.5">
            <span className={labelSm}>Şifre</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={input}
              autoComplete="current-password"
              required
            />
          </label>
          <button type="submit" disabled={pending} className={cn(btnPrimary, "h-11 w-full")}>
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Giriş yap"
            )}
          </button>
        </form>
        <p className="mt-6 text-center text-[11px] leading-relaxed text-zinc-600">
          Şifre yoksa <code className="text-zinc-500">PANEL_PASSWORD</code> tanımlamayın;
          geliştirme ortamında giriş istenmez.
        </p>
      </div>
    </div>
  );
}
