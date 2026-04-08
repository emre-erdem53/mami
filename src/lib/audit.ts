import type { AgencyState } from "./types";
import { newId } from "./store";

export function pushAudit(
  s: AgencyState,
  action: string,
  entity: string,
  entityId?: string,
  detail?: string
) {
  if (!s.auditLog) s.auditLog = [];
  s.auditLog.unshift({
    id: newId(),
    at: new Date().toISOString(),
    action,
    entity,
    entityId,
    detail,
  });
  if (s.auditLog.length > 500) s.auditLog = s.auditLog.slice(0, 500);
}
