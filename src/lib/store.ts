import { promises as fs } from "fs";
import path from "path";
import type {
  AgencyService,
  AgencyState,
  Client,
  Deal,
  PaymentEntry,
  Prospect,
  Reminder,
  Task,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "agency.json");

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

function normalizePaymentEntry(e: PaymentEntry): PaymentEntry {
  return {
    ...e,
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
    serviceIds: Array.isArray(c.serviceIds) ? c.serviceIds : [],
    createdAt: c.createdAt,
    currency: c.currency ?? "TRY",
    priority: c.priority ?? "medium",
    leadScore: typeof c.leadScore === "number" ? c.leadScore : 0,
    ownerMemberId: c.ownerMemberId,
    payment: {
      agreementAmount: typeof c.payment?.agreementAmount === "number" ? c.payment.agreementAmount : 0,
      entries: (c.payment?.entries ?? []).map(normalizePaymentEntry),
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

function normalizeTask(t: Task): Task {
  return {
    ...t,
    clientApproval: t.clientApproval ?? "none",
    recurrence: t.recurrence ?? "none",
    closedAt: t.closedAt,
  };
}

function normalizeReminder(r: Reminder): Reminder {
  return {
    ...r,
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

  return {
    ...d,
    ...raw,
    clients: (raw.clients ?? []).map(normalizeClient),
    prospects: (raw.prospects ?? []).map(normalizeProspect),
    services: Array.isArray(raw.services) ? raw.services : defaultAgencyServiceCatalog(),
    deals: (raw.deals ?? []).map(normalizeDeal),
    projects: raw.projects ?? [],
    tasks: (raw.tasks ?? []).map(normalizeTask),
    events: raw.events ?? [],
    adMetrics: raw.adMetrics ?? [],
    assets: raw.assets ?? [],
    teamMembers:
      raw.teamMembers?.length ? raw.teamMembers : d.teamMembers,
    reminders: (raw.reminders ?? []).map(normalizeReminder),
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
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<AgencyState>;
    return normalizeState(parsed);
  } catch (e) {
    if (isENOENT(e)) {
      const initial = normalizeState({});
      await writeState(initial);
      return initial;
    }
    return defaultState();
  }
}

export async function writeState(next: AgencyState): Promise<void> {
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
