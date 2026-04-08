import { AppShell } from "@/components/AppShell";
import { addDaysYMD, localYMD } from "@/lib/date-utils";
import { isAuthEnabled } from "@/lib/session";
import { readState } from "@/lib/store";
import { isOpenTask } from "@/lib/task-utils";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await readState();
  const pinIds = s.preferences.pinnedClientIds ?? [];
  const recIds = s.preferences.recentClientIds ?? [];
  const pinSet = new Set(pinIds);
  const clientById = new Map(s.clients.map((c) => [c.id, c]));
  const pinned = pinIds
    .map((id) => clientById.get(id))
    .filter(Boolean)
    .map((c) => ({ id: c!.id, companyName: c!.companyName }));
  const recent = recIds
    .map((id) => clientById.get(id))
    .filter(Boolean)
    .map((c) => ({ id: c!.id, companyName: c!.companyName }))
    .filter((c) => !pinSet.has(c.id));

  const today = localYMD();
  const tomorrow = addDaysYMD(today, 1);
  const remindersForNotify = s.reminders
    .filter(
      (r) =>
        !r.done &&
        (r.dueAt.startsWith(today) || r.dueAt.startsWith(tomorrow))
    )
    .map((r) => ({ title: r.title, dueAt: r.dueAt, done: r.done }));

  const projectById = new Map(s.projects.map((p) => [p.id, p]));
  const overdueTasksForNotify = s.tasks
    .filter((t) => isOpenTask(t) && t.deadline && t.deadline < today)
    .map((t) => {
      const p = projectById.get(t.projectId);
      const c = p ? clientById.get(p.clientId) : undefined;
      return {
        title: t.title,
        companyName: c?.companyName ?? "—",
      };
    });

  return (
    <AppShell
      pinned={pinned}
      recent={recent}
      openRemindersCount={s.reminders.filter((r) => !r.done).length}
      remindersForNotify={remindersForNotify}
      overdueTasksForNotify={overdueTasksForNotify}
      authEnabled={isAuthEnabled()}
    >
      {children}
    </AppShell>
  );
}
