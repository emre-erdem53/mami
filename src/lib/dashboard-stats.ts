import { isOpenTask } from "@/lib/task-utils";
import type { AgencyState } from "@/lib/types";

/** Panel üst kartları — `readState()` çıktısından türetilir (tek kaynak). */
export function dashboardStatsFromState(s: AgencyState) {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  let monthlyRevenue = 0;
  for (const c of s.clients) {
    for (const e of c.payment.entries) {
      if (typeof e?.date === "string" && e.date.startsWith(ym) && typeof e.amount === "number") {
        monthlyRevenue += e.amount;
      }
    }
  }

  const activeProjects = s.projects.filter((p) => {
    const ts = s.tasks.filter((t) => t.projectId === p.id);
    if (ts.length === 0) return true;
    return ts.some((t) => isOpenTask(t));
  }).length;

  let pendingOfferTotal = 0;
  for (const d of s.deals) {
    if (d.offerGiven && d.offerStatus === "pending" && d.offerAmount) {
      pendingOfferTotal += d.offerAmount;
    }
  }

  const activeProspects = (s.prospects ?? []).filter(
    (p) => !p.convertedClientId && p.stage !== "lost"
  ).length;

  return {
    totalClients: s.clients.length,
    monthlyRevenue,
    activeProjects,
    openReminders: s.reminders.filter((r) => !r.done).length,
    pendingOfferTotal,
    activeProspects,
  };
}

export type DashboardStats = ReturnType<typeof dashboardStatsFromState>;
