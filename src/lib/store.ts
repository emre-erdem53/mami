import { promises as fs } from "fs";
import path from "path";
import {
  isDatabaseConfigured,
  readAgencyPayloadFromDb,
  writeAgencyPayloadToDb,
} from "./agency-db";
import type {
  AgencyService,
  AgencyState,
  CalendarEvent,
  Client,
  Deal,
  PaymentEntry,
  Project,
  Prospect,
  Reminder,
  Task,
  TeamMember,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "agency.json");

/** Panel alt bilgisi + ortam kontrolü */
export function persistenceMode(): "neon" | "file" {
  return isDatabaseConfigured() ? "neon" : "file";
}

/** Eski dosyalarda `services` yoksa varsayılan katalog */
export function defaultAgencyServiceCatalog(): AgencyService[] {
  return [
    {
      id: "svc-social",
      name: "Sosyal medya yönetimi",
      description: "İçerik, yayın, rapor",
    },
    { id: "svc-ads", name: "Meta / reklam yönetimi" },
    { id: "svc-web", name: "Web sitesi & SEO" },
    { id: "svc-video", name: "Video & prodüksiyon" },
    { id: "svc-brand", name: "Marka & tasarım" },
    { id: "svc-strategy", name: "Strateji & danışmanlık" },
  ];
}

export const defaultPreferences = () => ({
  pinnedClientIds: [] as string[],
  recentClientIds: [] as string[],
  currentUserName: "Sen",
  sessionRole: "admin" as const,
});

export const defaultIntegrationSettings = () => ({
  metaAds: {
    connected: false,
    note: "Meta Marketing API OAuth — entegrasyon hazırlığı (token ile bağlanır).",
  },
  googleCalendar: {
    connected: false,
    note: "Google Calendar API — çekim/toplantı senkronu için.",
  },
  webhookUrl: undefined as string | undefined,
});

const defaultState = (): AgencyState => ({
  clients: [],
  prospects: [],
  services: defaultAgencyServiceCatalog(),
  deals: [],
  projects: [],
  tasks: [],
  events: [],
  adMetrics: [],
  assets: [],
  teamMembers: [
    { id: "tm_self", name: "Sen", role: "Ajans", active: true },
  ],
  reminders: [],
  activities: [],
  projectTemplates: [],
  auditLog: [],
  preferences: defaultPreferences(),
  integrationSettings: defaultIntegrationSettings(),
});

/** Bozuk JSON (null eleman, eksik id) RSC render'da patlamasın. */
function normalizeServicesFromRaw(raw: unknown): AgencyService[] {
  if (!Array.isArray(raw)) return defaultAgencyServiceCatalog();
  const out: AgencyService[] = [];
  for (const x of raw) {
    if (!x || typeof x !== "object") continue;
    const o = x as Partial<AgencyService>;
    if (typeof o.id !== "string" || !o.id || typeof o.name !== "string") continue;
    out.push({
      id: o.id,
      name: o.name,
      description: typeof o.description === "string" ? o.description : undefined,
    });
  }
  return out.length > 0 ? out : defaultAgencyServiceCatalog();
}

function sanitizeProjects(raw: unknown): Project[] {
  if (!Array.isArray(raw)) return [];
  const out: Project[] = [];
  for (const x of raw) {
    if (!x || typeof x !== "object") continue;
    const p = x as Partial<Project>;
    if (typeof p.id !== "string" || typeof p.clientId !== "string") continue;
    out.push({
      id: p.id,
      clientId: p.clientId,
      name: typeof p.name === "string" ? p.name : "",
      createdAt: typeof p.createdAt === "string" ? p.createdAt : new Date().toISOString(),
      planStartDate: typeof p.planStartDate === "string" ? p.planStartDate : undefined,
      planEndDate: typeof p.planEndDate === "string" ? p.planEndDate : undefined,
    });
  }
  return out;
}

const EVENT_TYPES: CalendarEvent["type"][] = ["post", "shoot", "ad_start", "other"];

function sanitizeEvents(raw: unknown): CalendarEvent[] {
  if (!Array.isArray(raw)) return [];
  const out: CalendarEvent[] = [];
  for (const x of raw) {
    if (!x || typeof x !== "object") continue;
    const e = x as Partial<CalendarEvent>;
    if (typeof e.id !== "string" || typeof e.clientId !== "string" || typeof e.startDate !== "string") {
      continue;
    }
    const type = EVENT_TYPES.includes(e.type as CalendarEvent["type"])
      ? (e.type as CalendarEvent["type"])
      : "other";
    out.push({
      id: e.id,
      clientId: e.clientId,
      title: typeof e.title === "string" ? e.title : "",
      type,
      startDate: e.startDate,
      endDate: typeof e.endDate === "string" ? e.endDate : undefined,
      notes: typeof e.notes === "string" ? e.notes : undefined,
    });
  }
  return out;
}

function normalizePaymentEntry(e: PaymentEntry): PaymentEntry {
  if (!e || typeof e !== "object") {
    return { id: "", amount: 0, date: "" };
  }
  return {
    ...e,
    id: typeof e.id === "string" ? e.id : "",
    amount: typeof e.amount === "number" && !Number.isNaN(e.amount) ? e.amount : 0,
    date: typeof e.date === "string" ? e.date : "",
    note: typeof e.note === "string" ? e.note : undefined,
    invoiceNo: e.invoiceNo,
  };
}

function normalizeClient(c: Client & { tags?: unknown }): Client {
  return {
    id: c.id,
    companyName: String(c.companyName ?? ""),
    contactName: String(c.contactName ?? ""),
    phone: String(c.phone ?? ""),
    email: String(c.email ?? ""),
    sector: String(c.sector ?? ""),
    leadSource: String(c.leadSource ?? ""),
    notes: String(c.notes ?? ""),
    serviceIds: Array.isArray(c.serviceIds) ? c.serviceIds.filter((x) => typeof x === "string") : [],
    createdAt: c.createdAt,
    currency: c.currency ?? "TRY",
    priority: c.priority ?? "medium",
    leadScore: typeof c.leadScore === "number" ? c.leadScore : 0,
    ownerMemberId: c.ownerMemberId,
    payment: {
      agreementAmount: typeof c.payment?.agreementAmount === "number" ? c.payment.agreementAmount : 0,
      entries: (c.payment?.entries ?? [])
        .filter((e): e is PaymentEntry => e != null && typeof e === "object")
        .map(normalizePaymentEntry),
      nextDueDate: c.payment?.nextDueDate,
    },
  };
}

function normalizeDeal(d: Deal & { pipelineStage?: unknown }): Deal {
  return {
    id: d.id,
    clientId: d.clientId,
    offerGiven: d.offerGiven ?? false,
    offerAmount: d.offerAmount,
    offerStatus: d.offerStatus,
    offerFileUrl: d.offerFileUrl,
    updatedAt: d.updatedAt,
    lossReason: d.lossReason,
    offerVersions: d.offerVersions ?? [],
  };
}

const TASK_STATUSES: Task["status"][] = ["not_started", "in_progress", "done", "cancelled"];

function normalizeTask(t: Task): Task {
  const status = TASK_STATUSES.includes(t.status) ? t.status : "not_started";
  return {
    ...t,
    status,
    clientApproval: t.clientApproval ?? "none",
    recurrence: t.recurrence ?? "none",
    closedAt: t.closedAt,
  };
}

const REMINDER_KINDS: Reminder["kind"][] = ["call", "payment", "other"];

function normalizeReminder(r: Reminder): Reminder {
  const kind = REMINDER_KINDS.includes(r.kind as Reminder["kind"]) ? r.kind : "other";
  return {
    ...r,
    title: typeof r.title === "string" ? r.title : "",
    dueAt: typeof r.dueAt === "string" ? r.dueAt : "",
    kind,
    done: Boolean(r.done),
    recurrence: r.recurrence ?? "none",
  };
}

function normalizeProspect(p: Prospect & { tags?: unknown }): Prospect {
  return {
    id: p.id,
    companyName: String(p.companyName ?? ""),
    contactName: String(p.contactName ?? ""),
    phone: String(p.phone ?? ""),
    email: String(p.email ?? ""),
    sector: String(p.sector ?? ""),
    leadSource: String(p.leadSource ?? ""),
    notes: String(p.notes ?? ""),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    stage: p.stage,
    meetingAt: p.meetingAt,
    meetingNote: p.meetingNote,
    proposals: (p.proposals ?? []).map((x) => ({
      ...x,
      currency: x.currency ?? "TRY",
      status: x.status ?? "pending",
    })),
    convertedClientId: p.convertedClientId,
    lossReason: p.lossReason,
  };
}

export function normalizeState(raw: Partial<AgencyState> | null | undefined): AgencyState {
  const d = defaultState();
  if (!raw || typeof raw !== "object") return d;

  const prefs = {
    ...defaultPreferences(),
    ...(raw.preferences ?? {}),
    pinnedClientIds: raw.preferences?.pinnedClientIds ?? [],
    recentClientIds: raw.preferences?.recentClientIds ?? [],
  };

  const clientRows = Array.isArray(raw.clients) ? raw.clients : [];
  const prospectRows = Array.isArray(raw.prospects) ? raw.prospects : [];
  const dealRows = Array.isArray(raw.deals) ? raw.deals : [];
  const taskRows = Array.isArray(raw.tasks) ? raw.tasks : [];
  const reminderRows = Array.isArray(raw.reminders) ? raw.reminders : [];

  return {
    ...d,
    ...raw,
    clients: clientRows
      .filter(
        (c): c is Client & { tags?: unknown } =>
          c != null && typeof c === "object" && typeof (c as Client).id === "string"
      )
      .map(normalizeClient),
    prospects: prospectRows
      .filter(
        (p): p is Prospect & { tags?: unknown } =>
          p != null && typeof p === "object" && typeof (p as Prospect).id === "string"
      )
      .map(normalizeProspect),
    services: normalizeServicesFromRaw(raw.services),
    deals: dealRows
      .filter(
        (x): x is Deal & { pipelineStage?: unknown } =>
          x != null &&
          typeof x === "object" &&
          typeof (x as Deal).id === "string" &&
          typeof (x as Deal).clientId === "string"
      )
      .map(normalizeDeal),
    projects: sanitizeProjects(raw.projects),
    tasks: taskRows
      .filter(
        (t): t is Task =>
          t != null && typeof t === "object" && typeof (t as Task).id === "string" && typeof (t as Task).projectId === "string"
      )
      .map(normalizeTask),
    events: sanitizeEvents(raw.events),
    adMetrics: raw.adMetrics ?? [],
    assets: raw.assets ?? [],
    teamMembers: (() => {
      if (!Array.isArray(raw.teamMembers) || raw.teamMembers.length === 0) return d.teamMembers;
      const tm = raw.teamMembers.filter(
        (m): m is TeamMember =>
          m != null && typeof m === "object" && typeof (m as TeamMember).id === "string"
      );
      return tm.length > 0 ? tm : d.teamMembers;
    })(),
    reminders: reminderRows
      .filter((r): r is Reminder => r != null && typeof r === "object" && typeof (r as Reminder).id === "string")
      .map(normalizeReminder),
    activities: raw.activities ?? [],
    projectTemplates: raw.projectTemplates ?? [],
    auditLog: raw.auditLog ?? [],
    preferences: prefs,
    integrationSettings: {
      ...defaultIntegrationSettings(),
      ...(raw.integrationSettings ?? {}),
    },
  };
}

let chain: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function isENOENT(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as NodeJS.ErrnoException).code === "ENOENT";
}

export async function readState(): Promise<AgencyState> {
  if (isDatabaseConfigured()) {
    try {
      const raw = await readAgencyPayloadFromDb();
      if (raw === null) {
        const initial = normalizeState({});
        try {
          await writeAgencyPayloadToDb(initial);
        } catch (e) {
          console.error("[mami] Neon ilk kayıt yazılamadı", e);
        }
        return initial;
      }
      return normalizeState(raw);
    } catch (e) {
      console.error("[mami] Neon okuma hatası", e);
      return normalizeState({});
    }
  }

  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<AgencyState>;
    return normalizeState(parsed);
  } catch (e) {
    if (isENOENT(e)) {
      const initial = normalizeState({});
      try {
        await writeState(initial);
      } catch {
        // Vercel / salt okunur FS: dosya yok ve yazılamıyor; boş şablonu bellekten döndür.
      }
      return initial;
    }
    return defaultState();
  }
}

export async function writeState(next: AgencyState): Promise<void> {
  if (isDatabaseConfigured()) {
    await writeAgencyPayloadToDb(next);
    return;
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(next, null, 2), "utf8");
}

export async function mutate(
  updater: (s: AgencyState) => AgencyState | void
): Promise<AgencyState> {
  return withLock(async () => {
    const current = await readState();
    const draft = structuredClone(current);
    const result = updater(draft);
    const next = normalizeState(result ?? draft);
    await writeState(next);
    return next;
  });
}

export function newId(): string {
  return crypto.randomUUID();
}

export function emptyClient(partial: Partial<Client> = {}): Client {
  const id = partial.id ?? newId();
  return normalizeClient({
    id,
    companyName: partial.companyName ?? "",
    contactName: partial.contactName ?? "",
    phone: partial.phone ?? "",
    email: partial.email ?? "",
    sector: partial.sector ?? "",
    leadSource: partial.leadSource ?? "",
    notes: partial.notes ?? "",
    serviceIds: partial.serviceIds ?? [],
    createdAt: partial.createdAt ?? new Date().toISOString(),
    currency: partial.currency ?? "TRY",
    priority: partial.priority ?? "medium",
    leadScore: partial.leadScore ?? 0,
    ownerMemberId: partial.ownerMemberId,
    payment: partial.payment ?? {
      agreementAmount: 0,
      entries: [],
      nextDueDate: undefined,
    },
  });
}

export function defaultDealForClient(clientId: string): Deal {
  return normalizeDeal({
    id: newId(),
    clientId,
    offerGiven: false,
    updatedAt: new Date().toISOString(),
    offerVersions: [],
  });
}

export function emptyProspect(partial: Partial<Prospect> = {}): Prospect {
  const id = partial.id ?? newId();
  const now = new Date().toISOString();
  return normalizeProspect({
    id,
    companyName: partial.companyName ?? "",
    contactName: partial.contactName ?? "",
    phone: partial.phone ?? "",
    email: partial.email ?? "",
    sector: partial.sector ?? "",
    leadSource: partial.leadSource ?? "",
    notes: partial.notes ?? "",
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now,
    stage: partial.stage ?? "new",
    meetingAt: partial.meetingAt,
    meetingNote: partial.meetingNote,
    proposals: partial.proposals ?? [],
    convertedClientId: partial.convertedClientId,
    lossReason: partial.lossReason,
  });
}

export function sumPayments(client: Client): number {
  return client.payment.entries.reduce((a, e) => a + e.amount, 0);
}

export function remainingBalance(client: Client): number {
  return Math.max(0, client.payment.agreementAmount - sumPayments(client));
}
