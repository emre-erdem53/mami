import type { Task } from "@/lib/types";

export function isOpenTask(t: Task): boolean {
  return t.status !== "done" && t.status !== "cancelled";
}
