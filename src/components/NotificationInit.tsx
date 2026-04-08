"use client";

import { useEffect, useRef } from "react";
import { addDaysYMD, localYMD } from "@/lib/date-utils";

type ReminderLike = { title: string; dueAt: string; done: boolean };

type OverdueTaskLike = { title: string; companyName: string };

/**
 * Bugün/yarın hatırlatıcılar ve geciken işler için tarayıcı bildirimi (izin verilirse).
 * Oturum başına bir kez izin istenir ve ilk uygun veri yükünde bildirim gösterilir.
 */
export function NotificationInit({
  reminders,
  overdueTasks = [],
}: {
  reminders: ReminderLike[];
  overdueTasks?: OverdueTaskLike[];
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (fired.current) return;

    const today = localYMD();
    const tomorrow = addDaysYMD(today, 1);
    const dueSoon = reminders.filter(
      (r) =>
        !r.done &&
        Boolean(r.dueAt) &&
        (r.dueAt.startsWith(today) || r.dueAt.startsWith(tomorrow))
    );

    if (dueSoon.length === 0 && overdueTasks.length === 0) return;

    fired.current = true;

    if (Notification.permission === "default") {
      void Notification.requestPermission().then((perm) => {
        if (perm !== "granted") return;
        notifyReminders(dueSoon);
        notifyOverdue(overdueTasks);
      });
      return;
    }

    if (Notification.permission !== "granted") return;
    notifyReminders(dueSoon);
    notifyOverdue(overdueTasks);
  }, [reminders, overdueTasks]);

  return null;
}

function notifyReminders(due: ReminderLike[]) {
  if (due.length === 0) return;
  const title =
    due.length === 1
      ? `Hatırlatıcı: ${due[0].title}`
      : `${due.length} hatırlatıcı (bugün / yarın)`;
  try {
    new Notification(title, {
      body: due.map((d) => d.title).join(" · "),
      silent: true,
    });
  } catch {
    /* ignore */
  }
}

function notifyOverdue(overdue: OverdueTaskLike[]) {
  if (overdue.length === 0) return;
  const title =
    overdue.length === 1
      ? `Geciken iş: ${overdue[0].title}`
      : `${overdue.length} iş gecikti`;
  const body = overdue
    .slice(0, 6)
    .map((o) => `${o.title} (${o.companyName})`)
    .join(" · ");
  try {
    new Notification(title, { body, silent: false });
  } catch {
    /* ignore */
  }
}
