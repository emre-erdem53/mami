import { isValidYMD } from "@/lib/date-utils";
import type { Project, Task } from "@/lib/types";
import { isOpenTask } from "@/lib/task-utils";

export type TaskUrgency = "critical" | "high" | "medium" | "low" | "none";

/** Sıralama: en acil üstte */
export const urgencyRank: Record<TaskUrgency, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  none: 4,
};

export const urgencyLabelTr: Record<TaskUrgency, string> = {
  critical: "Çok yüksek",
  high: "Yüksek",
  medium: "Orta",
  low: "Düşük",
  none: "Tarih yok",
};

/** Bugünden vadeye kalan gün (pozitif = gelecek, negatif = gecikmiş). */
export function daysUntilDeadline(deadlineYMD: string, todayYMD: string): number {
  const [ty, tm, td] = todayYMD.split("-").map(Number);
  const [dy, dm, dd] = deadlineYMD.split("-").map(Number);
  const t0 = new Date(ty, tm - 1, td).getTime();
  const t1 = new Date(dy, dm - 1, dd).getTime();
  return Math.round((t1 - t0) / 86_400_000);
}

/** Liste / rozet için Tailwind sınıfları */
export function urgencyChipClassName(u: TaskUrgency): string {
  switch (u) {
    case "critical":
      return "bg-red-500/15 text-red-200 ring-red-500/30";
    case "high":
      return "bg-orange-500/15 text-orange-200 ring-orange-500/30";
    case "medium":
      return "bg-amber-500/12 text-amber-200 ring-amber-500/25";
    case "low":
      return "bg-emerald-500/12 text-emerald-200 ring-emerald-500/25";
    default:
      return "bg-zinc-500/15 text-zinc-400 ring-zinc-500/25";
  }
}

export function urgencyFromDeadline(
  deadline: string | undefined,
  todayYMD: string
): TaskUrgency {
  if (!deadline || !isValidYMD(deadline)) return "none";
  const d = daysUntilDeadline(deadline, todayYMD);
  if (d < 0) return "critical";
  if (d <= 1) return "critical";
  if (d <= 3) return "high";
  if (d <= 7) return "medium";
  return "low";
}

/** Müşterinin açık işleri arasındaki en yüksek aciliyet (yoksa null). */
export function maxOpenTaskUrgencyForClient(
  clientId: string,
  tasks: Task[],
  projects: Project[],
  todayYMD: string
): TaskUrgency | null {
  const pids = new Set(
    projects.filter((p) => p.clientId === clientId).map((p) => p.id)
  );
  let best: TaskUrgency | null = null;
  let bestR = 999;
  for (const t of tasks) {
    if (!pids.has(t.projectId)) continue;
    if (!isOpenTask(t)) continue;
    const u = urgencyFromDeadline(t.deadline, todayYMD);
    const r = urgencyRank[u];
    if (r < bestR) {
      bestR = r;
      best = u;
    }
  }
  return best;
}
