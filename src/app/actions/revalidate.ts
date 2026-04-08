import { revalidatePath } from "next/cache";

const STATIC_PATHS = [
  "/",
  "/clients",
  "/prospects",
  "/calendar",
  "/calendar/month",
  "/payments",
  "/team",
  "/settings",
  "/audit",
  "/workload",
  "/workload/archive",
  "/services",
] as const;

export function revAgency(clientId?: string) {
  for (const p of STATIC_PATHS) {
    revalidatePath(p);
  }
  if (clientId) revalidatePath(`/clients/${clientId}`);
}
