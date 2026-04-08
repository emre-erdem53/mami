"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pushAudit } from "@/lib/audit";
import {
  defaultDealForClient,
  emptyClient,
  emptyProspect,
  mutate,
  newId,
  readState,
  remainingBalance,
} from "@/lib/store";
import { revAgency as rev } from "@/app/actions/revalidate";
import { dashboardStatsFromState } from "@/lib/dashboard-stats";
import { isOpenTask } from "@/lib/task-utils";
import { isValidYMD, localYMD, spreadDatesInclusive } from "@/lib/date-utils";
import type {
  AdMetric,
  Asset,
  CalendarEventType,
  Client,
  ClientPriority,
  Deal,
  OfferStatus,
  PaymentEntry,
  Project,
  ProspectStage,
  Recurrence,
  Reminder,
  Task,
  TaskApprovalStatus,
  TaskStatus,
  TeamMember,
} from "@/lib/types";

export async function createClient(
  _prev: { error?: string } | undefined,
  formData: FormData
) {
  const companyName = String(formData.get("companyName") ?? "").trim();
  if (!companyName) return { error: "Firma adı gerekli" };

  const client = emptyClient({
    companyName,
    contactName: String(formData.get("contactName") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    sector: String(formData.get("sector") ?? "").trim(),
    leadSource: String(formData.get("leadSource") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
    serviceIds: formData.getAll("serviceId").map(String).filter(Boolean),
    currency: String(formData.get("currency") ?? "TRY").trim() || "TRY",
    priority: parsePriority(formData.get("priority")),
    leadScore: num(formData.get("leadScore")),
    payment: {
      agreementAmount: num(formData.get("agreementAmount")),
      entries: [],
      nextDueDate: optDate(formData.get("nextDueDate")),
    },
  });

  await mutate((s) => {
    s.clients.push(client);
    s.deals.push(defaultDealForClient(client.id));
    pushAudit(s, "create", "client", client.id, client.companyName);
  });
  rev(client.id);
  redirect(`/clients/${client.id}`);
}

export async function updateClientCore(clientId: string, formData: FormData) {
  await mutate((s) => {
    const c = s.clients.find((x) => x.id === clientId);
    if (!c) return;
    c.companyName = String(formData.get("companyName") ?? "").trim();
    c.contactName = String(formData.get("contactName") ?? "").trim();
    c.phone = String(formData.get("phone") ?? "").trim();
    c.email = String(formData.get("email") ?? "").trim();
    c.sector = String(formData.get("sector") ?? "").trim();
    c.leadSource = String(formData.get("leadSource") ?? "").trim();
    c.notes = String(formData.get("notes") ?? "").trim();
    c.serviceIds = formData.getAll("serviceId").map(String).filter(Boolean);
    c.payment.agreementAmount = num(formData.get("agreementAmount"));
    c.payment.nextDueDate = optDate(formData.get("nextDueDate"));
    c.currency = String(formData.get("currency") ?? "TRY").trim() || "TRY";
    c.priority = parsePriority(formData.get("priority"));
    c.leadScore = num(formData.get("leadScore"));
    pushAudit(s, "update", "client", clientId, c.companyName);
  });
  rev(clientId);
}

export async function updateDeal(clientId: string, formData: FormData) {
  await mutate((s) => {
    let d = s.deals.find((x) => x.clientId === clientId);
    if (!d) {
      d = defaultDealForClient(clientId);
      s.deals.push(d);
    }
    d.offerGiven = formData.get("offerGiven") === "on";
    d.offerAmount = optNum(formData.get("offerAmount"));
    const os = String(formData.get("offerStatus") ?? "");
    d.offerStatus = (os === "" ? undefined : os) as OfferStatus | undefined;
    d.offerFileUrl = String(formData.get("offerFileUrl") ?? "").trim() || undefined;
    d.lossReason = String(formData.get("lossReason") ?? "").trim() || undefined;
    d.updatedAt = new Date().toISOString();
    pushAudit(s, "update", "deal", d.id, d.clientId);
  });
  rev(clientId);
}

export async function addProject(clientId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await mutate((s) => {
    s.projects.push({
      id: newId(),
      clientId,
      name,
      createdAt: new Date().toISOString(),
    });
  });
  rev(clientId);
}

export async function addTask(projectId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  await mutate((s) => {
    s.tasks.push({
      id: newId(),
      projectId,
      title,
      assignee: String(formData.get("assignee") ?? "").trim() || "Sen",
      deadline: optDate(formData.get("deadline")),
      status: (String(formData.get("status") ?? "not_started") ||
        "not_started") as TaskStatus,
      clientApproval: String(
        formData.get("clientApproval") ?? "none"
      ) as TaskApprovalStatus,
      recurrence: String(formData.get("recurrence") ?? "none") as Recurrence,
    });
    pushAudit(s, "create", "task", projectId, title);
  });
  const s = await readState();
  rev(s.projects.find((p) => p.id === projectId)?.clientId);
}

export async function updateTask(taskId: string, formData: FormData) {
  let projectId = "";
  await mutate((s) => {
    const t = s.tasks.find((x) => x.id === taskId);
    if (!t) return;
    projectId = t.projectId;
    t.title = String(formData.get("title") ?? "").trim();
    t.assignee = String(formData.get("assignee") ?? "").trim() || "Sen";
    t.deadline = optDate(formData.get("deadline"));
    const nextStatus = String(formData.get("status") ?? t.status) as TaskStatus;
    const wasClosed = t.status === "done" || t.status === "cancelled";
    const willClose = nextStatus === "done" || nextStatus === "cancelled";
    if (willClose && !wasClosed) {
      t.closedAt = new Date().toISOString();
    } else if (!willClose) {
      t.closedAt = undefined;
    }
    t.status = nextStatus;
    t.clientApproval = String(
      formData.get("clientApproval") ?? t.clientApproval
    ) as TaskApprovalStatus;
    t.recurrence = String(
      formData.get("recurrence") ?? t.recurrence
    ) as Recurrence;
  });
  const s = await readState();
  rev(s.projects.find((p) => p.id === projectId)?.clientId);
}

export async function completeTask(taskId: string) {
  let clientId: string | undefined;
  await mutate((s) => {
    const t = s.tasks.find((x) => x.id === taskId);
    if (!t || !isOpenTask(t)) return;
    const p = s.projects.find((pr) => pr.id === t.projectId);
    if (p) clientId = p.clientId;
    t.status = "done";
    t.closedAt = new Date().toISOString();
    pushAudit(s, "complete", "task", taskId, t.title);
  });
  rev(clientId);
}

export async function cancelTask(taskId: string) {
  let clientId: string | undefined;
  await mutate((s) => {
    const t = s.tasks.find((x) => x.id === taskId);
    if (!t || !isOpenTask(t)) return;
    const p = s.projects.find((pr) => pr.id === t.projectId);
    if (p) clientId = p.clientId;
    t.status = "cancelled";
    t.closedAt = new Date().toISOString();
    pushAudit(s, "cancel", "task", taskId, t.title);
  });
  rev(clientId);
}

export async function deleteTask(taskId: string) {
  let projectId = "";
  await mutate((s) => {
    const t = s.tasks.find((x) => x.id === taskId);
    if (t) projectId = t.projectId;
    s.tasks = s.tasks.filter((t) => t.id !== taskId);
  });
  const s = await readState();
  rev(s.projects.find((p) => p.id === projectId)?.clientId);
}

export async function addCalendarEvent(clientId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const startDate = String(formData.get("startDate") ?? "").slice(0, 10);
  if (!isValidYMD(startDate)) return;
  const endRaw = optDate(formData.get("endDate"));
  if (endRaw && !isValidYMD(endRaw)) return;
  await mutate((s) => {
    s.events.push({
      id: newId(),
      clientId,
      title,
      type: String(formData.get("type") ?? "other") as CalendarEventType,
      startDate,
      endDate: endRaw,
      notes: String(formData.get("notes") ?? "").trim() || undefined,
    });
  });
  rev(clientId);
}

export async function deleteEvent(eventId: string) {
  let clientId: string | undefined;
  await mutate((s) => {
    const ev = s.events.find((e) => e.id === eventId);
    if (ev) clientId = ev.clientId;
    s.events = s.events.filter((e) => e.id !== eventId);
  });
  rev(clientId);
}

export async function addPaymentEntry(clientId: string, formData: FormData) {
  const amount = num(formData.get("amount"));
  if (amount <= 0) return;
  const date = String(formData.get("date") ?? "").slice(0, 10);
  if (!isValidYMD(date)) return;
  const entry: PaymentEntry = {
    id: newId(),
    amount,
    date,
    note: String(formData.get("note") ?? "").trim() || undefined,
    invoiceNo: String(formData.get("invoiceNo") ?? "").trim() || undefined,
  };
  await mutate((s) => {
    const c = s.clients.find((x) => x.id === clientId);
    if (!c) return;
    c.payment.entries.push(entry);
    pushAudit(s, "payment", "client", clientId, String(amount));
  });
  rev(clientId);
}

export async function addAdMetric(clientId: string, formData: FormData) {
  await mutate((s) => {
    const m: AdMetric = {
      id: newId(),
      clientId,
      label: String(formData.get("label") ?? "").trim() || "Meta Ads",
      budget: num(formData.get("budget")),
      spent: num(formData.get("spent")),
      conversions: num(formData.get("conversions")),
      roas: num(formData.get("roas")),
      periodStart: optDate(formData.get("periodStart")),
      periodEnd: optDate(formData.get("periodEnd")),
    };
    s.adMetrics.push(m);
  });
  rev(clientId);
}

export async function deleteAdMetric(id: string) {
  let clientId: string | undefined;
  await mutate((s) => {
    const m = s.adMetrics.find((x) => x.id === id);
    if (m) clientId = m.clientId;
    s.adMetrics = s.adMetrics.filter((x) => x.id !== id);
  });
  rev(clientId);
}

export async function addAsset(clientId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  if (!title || !url) return;
  await mutate((s) => {
    s.assets.push({
      id: newId(),
      clientId,
      title,
      url,
      kind: String(formData.get("kind") ?? "other") as Asset["kind"],
    });
  });
  rev(clientId);
}

export async function deleteAsset(id: string) {
  let clientId: string | undefined;
  await mutate((s) => {
    const a = s.assets.find((x) => x.id === id);
    if (a) clientId = a.clientId;
    s.assets = s.assets.filter((x) => x.id !== id);
  });
  rev(clientId);
}

export async function addTeamMember(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await mutate((s) => {
    s.teamMembers.push({
      id: newId(),
      name,
      role: String(formData.get("role") ?? "").trim() || undefined,
      active: true,
    });
  });
  rev();
}

export async function toggleTeamMember(id: string) {
  await mutate((s) => {
    const m = s.teamMembers.find((x) => x.id === id);
    if (m) m.active = !m.active;
  });
  rev();
}

export async function addReminder(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const dueAt = String(formData.get("dueAt") ?? "").trim();
  if (!dueAt) return;
  const clientId = String(formData.get("clientId") ?? "").trim() || undefined;
  await mutate((s) => {
    s.reminders.push({
      id: newId(),
      clientId,
      title,
      dueAt,
      kind: String(formData.get("kind") ?? "other") as Reminder["kind"],
      done: false,
      recurrence: String(formData.get("recurrence") ?? "none") as Reminder["recurrence"],
    });
  });
  rev(clientId);
}

export async function toggleReminder(id: string) {
  let clientId: string | undefined;
  await mutate((s) => {
    const r = s.reminders.find((x) => x.id === id);
    if (r) {
      r.done = !r.done;
      clientId = r.clientId;
    }
  });
  rev(clientId);
}

export async function deleteClient(clientId: string) {
  await mutate((s) => {
    s.clients = s.clients.filter((c) => c.id !== clientId);
    s.deals = s.deals.filter((d) => d.clientId !== clientId);
    const pids = new Set(
      s.projects.filter((p) => p.clientId === clientId).map((p) => p.id)
    );
    s.projects = s.projects.filter((p) => p.clientId !== clientId);
    s.tasks = s.tasks.filter((t) => !pids.has(t.projectId));
    s.events = s.events.filter((e) => e.clientId !== clientId);
    s.adMetrics = s.adMetrics.filter((m) => m.clientId !== clientId);
    s.assets = s.assets.filter((a) => a.clientId !== clientId);
    s.reminders = s.reminders.filter((r) => r.clientId !== clientId);
    s.activities = (s.activities ?? []).filter((a) => a.clientId !== clientId);
    pushAudit(s, "delete", "client", clientId);
  });
  rev();
}

function num(v: FormDataEntryValue | null): number {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function optNum(v: FormDataEntryValue | null): number | undefined {
  const s = String(v ?? "").trim();
  if (!s) return undefined;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

function optDate(v: FormDataEntryValue | null): string | undefined {
  const s = String(v ?? "").trim();
  return s ? s.slice(0, 10) : undefined;
}

export async function getDashboardStats() {
  const s = await readState();
  return dashboardStatsFromState(s);
}

export async function getPaymentRows(overdueOnly: boolean) {
  const s = await readState();
  const today = localYMD();
  return s.clients
    .map((c) => ({
      client: c,
      remaining: remainingBalance(c),
      overdue:
        !!c.payment.nextDueDate &&
        c.payment.nextDueDate < today &&
        remainingBalance(c) > 0,
    }))
    .filter((row) => !overdueOnly || row.overdue);
}

export type ClientBundle = {
  client: Client;
  deal: Deal;
  projects: (Project & { tasks: Task[] })[];
  events: import("@/lib/types").CalendarEvent[];
  adMetrics: AdMetric[];
  assets: Asset[];
  reminders: Reminder[];
  teamMembers: TeamMember[];
  activities: import("@/lib/types").Activity[];
  projectTemplates: import("@/lib/types").ProjectTemplate[];
  agencyServices: import("@/lib/types").AgencyService[];
  readOnly: boolean;
  pinned: boolean;
};

export async function getClientBundle(clientId: string): Promise<ClientBundle | null> {
  let s = await readState();
  const client = s.clients.find((c) => c.id === clientId);
  if (!client) return null;
  if (!s.deals.some((d) => d.clientId === clientId)) {
    await mutate((st) => {
      if (!st.deals.some((d) => d.clientId === clientId)) {
        st.deals.push(defaultDealForClient(clientId));
      }
    });
    s = await readState();
  }
  const deal = s.deals.find((d) => d.clientId === clientId)!;
  const projects = s.projects
    .filter((p) => p.clientId === clientId)
    .map((p) => ({
      ...p,
      tasks: s.tasks.filter((t) => t.projectId === p.id),
    }));
  const pinned = s.preferences.pinnedClientIds.includes(clientId);
  const readOnly = s.preferences.sessionRole === "viewer";

  return {
    client,
    deal,
    projects,
    events: s.events.filter((e) => e.clientId === clientId),
    adMetrics: s.adMetrics.filter((m) => m.clientId === clientId),
    assets: s.assets.filter((a) => a.clientId === clientId),
    reminders: s.reminders.filter((r) => r.clientId === clientId),
    teamMembers: s.teamMembers.filter((m) => m.active),
    activities: (s.activities ?? [])
      .filter((a) => a.clientId === clientId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    projectTemplates: s.projectTemplates ?? [],
    agencyServices: s.services ?? [],
    readOnly,
    pinned,
  };
}

export async function recordRecentClient(clientId: string) {
  await mutate((s) => {
    const cur = [...(s.preferences.recentClientIds ?? [])].filter(
      (id) => id !== clientId
    );
    cur.unshift(clientId);
    s.preferences.recentClientIds = cur.slice(0, 12);
  });
  revalidatePath("/");
  revalidatePath("/clients");
}

export async function togglePinClient(clientId: string) {
  await mutate((s) => {
    const pins = s.preferences.pinnedClientIds ?? [];
    if (pins.includes(clientId)) {
      s.preferences.pinnedClientIds = pins.filter((id) => id !== clientId);
      pushAudit(s, "unpin", "client", clientId);
    } else {
      s.preferences.pinnedClientIds = [...pins, clientId];
      pushAudit(s, "pin", "client", clientId);
    }
  });
  rev(clientId);
}

export async function addActivity(clientId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  await mutate((s) => {
    s.activities.push({
      id: newId(),
      clientId,
      type: String(formData.get("type") ?? "note") as import("@/lib/types").ActivityType,
      title,
      body: String(formData.get("body") ?? "").trim() || undefined,
      createdAt: new Date().toISOString(),
      actor: s.preferences.currentUserName,
    });
    pushAudit(s, "activity", "client", clientId, title);
  });
  rev(clientId);
}

export async function addOfferVersion(clientId: string, formData: FormData) {
  const label = String(formData.get("label") ?? "").trim() || "Revizyon";
  const amount = optNum(formData.get("amount"));
  if (amount == null) return;
  await mutate((s) => {
    let d = s.deals.find((x) => x.clientId === clientId);
    if (!d) {
      d = defaultDealForClient(clientId);
      s.deals.push(d);
    }
    d.offerVersions.push({
      id: newId(),
      label,
      amount,
      fileUrl: String(formData.get("fileUrl") ?? "").trim() || undefined,
      createdAt: new Date().toISOString(),
      status: (String(formData.get("versionStatus") ?? "pending") ||
        "pending") as OfferStatus,
    });
    d.offerAmount = amount;
    d.updatedAt = new Date().toISOString();
    pushAudit(s, "offer_version", "deal", d.id, label);
  });
  rev(clientId);
}

export async function applyProjectTemplate(
  clientId: string,
  templateId: string,
  formData?: FormData
) {
  void formData;
  await mutate((s) => {
    const tpl = s.projectTemplates.find((t) => t.id === templateId);
    if (!tpl) return;
    for (const block of tpl.projects) {
      const pid = newId();
      s.projects.push({
        id: pid,
        clientId,
        name: block.name,
        createdAt: new Date().toISOString(),
      });
      for (const tk of block.tasks) {
        s.tasks.push({
          id: newId(),
          projectId: pid,
          title: tk.title,
          assignee: tk.assignee || s.preferences.currentUserName || "Sen",
          status: "not_started",
          clientApproval: "none",
          recurrence: "none",
        });
      }
    }
    pushAudit(s, "template", "client", clientId, tpl.name);
  });
  rev(clientId);
}

export async function updateWorkspacePreferences(formData: FormData) {
  await mutate((s) => {
    s.preferences.currentUserName =
      String(formData.get("currentUserName") ?? "").trim() ||
      s.preferences.currentUserName;
    const role = String(formData.get("sessionRole") ?? "admin");
    if (role === "admin" || role === "editor" || role === "viewer") {
      s.preferences.sessionRole = role;
    }
    pushAudit(s, "prefs", "settings");
  });
  rev();
}

export async function updateIntegrationSettings(formData: FormData) {
  await mutate((s) => {
    s.integrationSettings.webhookUrl =
      String(formData.get("webhookUrl") ?? "").trim() || undefined;
    s.integrationSettings.metaAds.note =
      String(formData.get("metaNote") ?? "").trim() ||
      s.integrationSettings.metaAds.note;
    s.integrationSettings.googleCalendar.note =
      String(formData.get("gcalNote") ?? "").trim() ||
      s.integrationSettings.googleCalendar.note;
    pushAudit(s, "integration", "settings");
  });
  rev();
}

export async function setMetaConnected(value: boolean) {
  await mutate((s) => {
    s.integrationSettings.metaAds.connected = value;
    pushAudit(s, value ? "meta_on" : "meta_off", "integration");
  });
  rev();
}

export async function setGoogleCalConnected(value: boolean) {
  await mutate((s) => {
    s.integrationSettings.googleCalendar.connected = value;
    pushAudit(s, value ? "gcal_on" : "gcal_off", "integration");
  });
  rev();
}

function parseProspectStage(v: FormDataEntryValue | null): ProspectStage {
  const x = String(v ?? "new");
  const ok: ProspectStage[] = [
    "new",
    "contacted",
    "meeting",
    "proposal_sent",
    "negotiation",
    "won",
    "lost",
  ];
  return ok.includes(x as ProspectStage) ? (x as ProspectStage) : "new";
}

export async function createProspect(
  _prev: { error?: string } | undefined,
  formData: FormData
) {
  const companyName = String(formData.get("companyName") ?? "").trim();
  if (!companyName) return { error: "Firma adı gerekli" };

  const p = emptyProspect({
    companyName,
    contactName: String(formData.get("contactName") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    sector: String(formData.get("sector") ?? "").trim(),
    leadSource: String(formData.get("leadSource") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
    stage: parseProspectStage(formData.get("stage")),
  });

  await mutate((s) => {
    s.prospects.push(p);
    pushAudit(s, "create", "prospect", p.id, p.companyName);
  });
  rev();
  redirect(`/prospects/${p.id}`);
}

export async function updateProspectCore(prospectId: string, formData: FormData) {
  await mutate((s) => {
    const p = s.prospects.find((x) => x.id === prospectId);
    if (!p || p.convertedClientId) return;
    p.companyName = String(formData.get("companyName") ?? "").trim();
    p.contactName = String(formData.get("contactName") ?? "").trim();
    p.phone = String(formData.get("phone") ?? "").trim();
    p.email = String(formData.get("email") ?? "").trim();
    p.sector = String(formData.get("sector") ?? "").trim();
    p.leadSource = String(formData.get("leadSource") ?? "").trim();
    p.notes = String(formData.get("notes") ?? "").trim();
    let nextStage = parseProspectStage(formData.get("stage"));
    if (nextStage === "won" && !p.convertedClientId) nextStage = p.stage;
    p.stage = nextStage;
    p.meetingAt = String(formData.get("meetingAt") ?? "").trim() || undefined;
    p.meetingNote = String(formData.get("meetingNote") ?? "").trim() || undefined;
    if (p.stage === "lost") {
      p.lossReason =
        String(formData.get("lossReason") ?? "").trim() || undefined;
    } else {
      p.lossReason = undefined;
    }
    p.updatedAt = new Date().toISOString();
    pushAudit(s, "update", "prospect", prospectId, p.companyName);
  });
  rev();
}

export async function addProspectProposal(prospectId: string, formData: FormData) {
  const label = String(formData.get("label") ?? "").trim() || "Teklif";
  const amount = num(formData.get("amount"));
  if (amount <= 0) return;
  const sentAt = String(formData.get("sentAt") ?? "").slice(0, 10);
  if (!isValidYMD(sentAt)) return;
  const currency =
    String(formData.get("currency") ?? "TRY").trim() || "TRY";
  const os = String(formData.get("versionStatus") ?? "pending");
  const status = (os === "approved" || os === "rejected" ? os : "pending") as OfferStatus;

  await mutate((s) => {
    const p = s.prospects.find((x) => x.id === prospectId);
    if (!p || p.convertedClientId) return;
    p.proposals.push({
      id: newId(),
      label,
      amount,
      currency,
      fileUrl: String(formData.get("fileUrl") ?? "").trim() || undefined,
      sentAt,
      status,
      note: String(formData.get("note") ?? "").trim() || undefined,
    });
    if (
      p.stage === "new" ||
      p.stage === "contacted" ||
      p.stage === "meeting"
    ) {
      p.stage = "proposal_sent";
    }
    p.updatedAt = new Date().toISOString();
    pushAudit(s, "proposal", "prospect", prospectId, label);
  });
  rev();
}

export async function deleteProspect(prospectId: string) {
  await mutate((s) => {
    s.prospects = s.prospects.filter((x) => x.id !== prospectId);
    pushAudit(s, "delete", "prospect", prospectId);
  });
  rev();
}

export async function convertProspectToClient(
  prospectId: string,
  formData: FormData
) {
  let newClientId = "";
  await mutate((s) => {
    const pr = s.prospects.find((x) => x.id === prospectId);
    if (!pr || pr.convertedClientId) return;

    const client = emptyClient({
      companyName: pr.companyName,
      contactName: pr.contactName,
      phone: pr.phone,
      email: pr.email,
      sector: pr.sector,
      leadSource: pr.leadSource || "Potansiyel dönüşümü",
      notes: pr.notes,
      serviceIds: [],
      currency: String(formData.get("currency") ?? "TRY").trim() || "TRY",
      priority: parsePriority(formData.get("priority")),
      leadScore: num(formData.get("leadScore")),
      payment: {
        agreementAmount: num(formData.get("agreementAmount")),
        entries: [],
        nextDueDate: optDate(formData.get("nextDueDate")),
      },
    });

    newClientId = client.id;
    s.clients.push(client);

    const deal = defaultDealForClient(client.id);
    const last = pr.proposals[pr.proposals.length - 1];
    deal.offerGiven = true;
    deal.offerAmount = last?.amount ?? num(formData.get("agreementAmount"));
    deal.offerStatus = "pending";
    deal.updatedAt = new Date().toISOString();
    if (last) {
      deal.offerVersions.push({
        id: newId(),
        label: last.label,
        amount: last.amount,
        fileUrl: last.fileUrl,
        createdAt: new Date().toISOString(),
        status: last.status,
      });
    }
    s.deals.push(deal);

    pr.convertedClientId = client.id;
    pr.stage = "won";
    pr.updatedAt = new Date().toISOString();
    pushAudit(s, "convert", "prospect", prospectId, client.companyName);
  });

  if (!newClientId) return;
  rev(newClientId);
  redirect(`/clients/${newClientId}`);
}

function parseWorkPlanTaskLine(line: string): {
  title: string;
  deadline?: string;
  assignee?: string;
} {
  const raw = line.trim();
  if (!raw) return { title: "" };
  const parts = raw.split("|").map((x) => x.trim());
  const title = parts[0];
  if (!title) return { title: "" };
  let deadline: string | undefined;
  let assignee: string | undefined;
  if (parts[1] && isValidYMD(parts[1])) {
    deadline = parts[1];
    assignee = parts[2];
  } else if (parts[1]) {
    assignee = parts[1];
  }
  return { title, deadline, assignee };
}

async function createWorkPlanInternal(
  clientId: string,
  formData: FormData
): Promise<boolean> {
  const planName = String(formData.get("planName") ?? "").trim();
  if (!planName) return false;
  const body = String(formData.get("taskLines") ?? "");
  const defaultAssignee =
    String(formData.get("defaultAssignee") ?? "").trim() || "Sen";
  const syncCalendar = formData.get("syncCalendar") === "on";
  const planStart = optDate(formData.get("planStartDate"));
  const planEnd = optDate(formData.get("planEndDate"));
  const parsed = body
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => parseWorkPlanTaskLine(line))
    .filter((x) => x.title);

  if (parsed.length === 0) return false;

  const canSpread =
    !!planStart &&
    !!planEnd &&
    isValidYMD(planStart) &&
    isValidYMD(planEnd) &&
    planEnd >= planStart;

  const undatedCount = parsed.filter((p) => !p.deadline).length;
  const spread =
    canSpread && undatedCount > 0
      ? spreadDatesInclusive(planStart!, planEnd!, undatedCount)
      : [];

  let applied = false;
  await mutate((s) => {
    const client = s.clients.find((c) => c.id === clientId);
    if (!client) return;
    applied = true;
    const pid = newId();
    s.projects.push({
      id: pid,
      clientId,
      name: planName,
      createdAt: new Date().toISOString(),
      ...(canSpread ? { planStartDate: planStart, planEndDate: planEnd } : {}),
    });
    let si = 0;
    for (const item of parsed) {
      let deadline = item.deadline;
      if (!deadline && si < spread.length) {
        deadline = spread[si++];
      }
      s.tasks.push({
        id: newId(),
        projectId: pid,
        title: item.title,
        assignee: item.assignee || defaultAssignee,
        deadline,
        status: "not_started",
        clientApproval: "none",
        recurrence: "none",
      });
      if (syncCalendar && deadline && isValidYMD(deadline)) {
        s.events.push({
          id: newId(),
          clientId,
          title: `[İş planı] ${item.title}`,
          type: "other" as CalendarEventType,
          startDate: deadline,
          notes: `Plan: ${planName}`,
        });
      }
    }
    pushAudit(s, "workplan", "client", clientId, planName);
  });
  if (applied) rev(clientId);
  return applied;
}

export async function createCustomWorkPlan(clientId: string, formData: FormData) {
  await createWorkPlanInternal(clientId, formData);
}

export async function createWorkPlanFromPanel(formData: FormData) {
  const clientId = String(formData.get("clientId") ?? "").trim();
  if (!clientId) return;
  const ok = await createWorkPlanInternal(clientId, formData);
  if (ok) redirect("/workload");
}

export async function deleteProject(projectId: string) {
  let clientId: string | undefined;
  await mutate((s) => {
    const p = s.projects.find((x) => x.id === projectId);
    if (p) clientId = p.clientId;
    s.projects = s.projects.filter((x) => x.id !== projectId);
    s.tasks = s.tasks.filter((t) => t.projectId !== projectId);
    if (p) pushAudit(s, "delete", "project", projectId, p.name);
  });
  rev(clientId);
}

export async function addAgencyService(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await mutate((s) => {
    s.services.push({
      id: newId(),
      name,
      description:
        String(formData.get("description") ?? "").trim() || undefined,
    });
    pushAudit(s, "create", "service", undefined, name);
  });
  rev();
}

export async function deleteAgencyService(serviceId: string) {
  await mutate((s) => {
    s.services = s.services.filter((x) => x.id !== serviceId);
    for (const c of s.clients) {
      c.serviceIds = (c.serviceIds ?? []).filter((id) => id !== serviceId);
    }
    pushAudit(s, "delete", "service", serviceId);
  });
  rev();
}

export type ProspectPageData = {
  prospect: import("@/lib/types").Prospect;
  readOnly: boolean;
};

export async function getProspectPageData(
  prospectId: string
): Promise<ProspectPageData | null> {
  const s = await readState();
  const prospect = s.prospects.find((x) => x.id === prospectId);
  if (!prospect) return null;
  return {
    prospect,
    readOnly: s.preferences.sessionRole === "viewer",
  };
}

function parsePriority(v: FormDataEntryValue | null): ClientPriority {
  const s = String(v ?? "medium");
  if (s === "low" || s === "high" || s === "medium") return s;
  return "medium";
}
