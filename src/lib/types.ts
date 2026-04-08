export type OfferStatus = "pending" | "approved" | "rejected";

export type TaskStatus = "not_started" | "in_progress" | "done" | "cancelled";

export type TaskApprovalStatus = "none" | "pending_client" | "approved_client";

export type Recurrence = "none" | "weekly" | "monthly";

export type CalendarEventType = "post" | "shoot" | "ad_start" | "other";

export type ClientPriority = "low" | "medium" | "high";

export type AgencyUserRole = "admin" | "editor" | "viewer";

/** Henüz müşteri kartına dönmemiş fırsatlar (görüşme + teklif takibi) */
export type ProspectStage =
  | "new"
  | "contacted"
  | "meeting"
  | "proposal_sent"
  | "negotiation"
  | "won"
  | "lost";

export type ProspectProposal = {
  id: string;
  label: string;
  amount: number;
  currency: string;
  fileUrl?: string;
  /** Gönderim tarihi YYYY-MM-DD */
  sentAt: string;
  status: OfferStatus;
  note?: string;
};

export type Prospect = {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  sector: string;
  leadSource: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  stage: ProspectStage;
  /** Son veya planlanan görüşme (datetime-local biçimi) */
  meetingAt?: string;
  meetingNote?: string;
  proposals: ProspectProposal[];
  convertedClientId?: string;
  lossReason?: string;
};

export type PaymentEntry = {
  id: string;
  amount: number;
  date: string;
  note?: string;
  invoiceNo?: string;
};

/** Ajansın sattığı / sunduğu hizmet kalemleri (müşteriye çoklu seçim) */
export type AgencyService = {
  id: string;
  name: string;
  description?: string;
};

export type Client = {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  sector: string;
  leadSource: string;
  notes: string;
  /** Seçilen hizmet id’leri */
  serviceIds: string[];
  createdAt: string;
  currency: string;
  priority: ClientPriority;
  leadScore: number;
  /** Basit sahiplik — viewer rolünde sadece kendi müşterileri (ileride genişletilebilir) */
  ownerMemberId?: string;
  payment: {
    agreementAmount: number;
    entries: PaymentEntry[];
    nextDueDate?: string;
  };
};

export type OfferVersion = {
  id: string;
  label: string;
  amount: number;
  fileUrl?: string;
  createdAt: string;
  status?: OfferStatus;
};

export type Deal = {
  id: string;
  clientId: string;
  offerGiven: boolean;
  offerAmount?: number;
  offerStatus?: OfferStatus;
  offerFileUrl?: string;
  updatedAt: string;
  lossReason?: string;
  offerVersions: OfferVersion[];
};

export type Project = {
  id: string;
  clientId: string;
  name: string;
  createdAt: string;
  /** İş planı penceresi (YYYY-MM-DD) — panelden oluşturulduğunda */
  planStartDate?: string;
  planEndDate?: string;
};

export type Task = {
  id: string;
  projectId: string;
  title: string;
  assignee: string;
  deadline?: string;
  status: TaskStatus;
  clientApproval: TaskApprovalStatus;
  recurrence: Recurrence;
  /** Tamamlandı / iptal edildi zamanı (ISO) */
  closedAt?: string;
};

export type CalendarEvent = {
  id: string;
  clientId: string;
  title: string;
  type: CalendarEventType;
  startDate: string;
  endDate?: string;
  notes?: string;
};

export type AdMetric = {
  id: string;
  clientId: string;
  label: string;
  budget: number;
  spent: number;
  conversions: number;
  roas: number;
  periodStart?: string;
  periodEnd?: string;
};

export type Asset = {
  id: string;
  clientId: string;
  title: string;
  url: string;
  kind: "video" | "design" | "drive" | "other";
};

export type TeamMember = {
  id: string;
  name: string;
  role?: string;
  active: boolean;
};

export type Reminder = {
  id: string;
  clientId?: string;
  title: string;
  dueAt: string;
  kind: "call" | "payment" | "other";
  done: boolean;
  recurrence: Recurrence;
};

export type ActivityType = "call" | "email" | "meeting" | "note" | "other";

export type Activity = {
  id: string;
  clientId: string;
  type: ActivityType;
  title: string;
  body?: string;
  createdAt: string;
  actor?: string;
};

export type ProjectTemplate = {
  id: string;
  name: string;
  description?: string;
  projects: {
    name: string;
    tasks: { title: string; assignee?: string }[];
  }[];
};

export type AuditEntry = {
  id: string;
  at: string;
  action: string;
  entity: string;
  entityId?: string;
  detail?: string;
};

export type IntegrationSettings = {
  metaAds: { connected: boolean; note?: string };
  googleCalendar: { connected: boolean; note?: string };
  webhookUrl?: string;
};

export type AgencyPreferences = {
  pinnedClientIds: string[];
  recentClientIds: string[];
  currentUserName: string;
  /** Basit rol: viewer sadece okur (formlar gizlenir) */
  sessionRole: AgencyUserRole;
};

export type AgencyState = {
  clients: Client[];
  prospects: Prospect[];
  /** Panelde tanımlanan hizmetler */
  services: AgencyService[];
  deals: Deal[];
  projects: Project[];
  tasks: Task[];
  events: CalendarEvent[];
  adMetrics: AdMetric[];
  assets: Asset[];
  teamMembers: TeamMember[];
  reminders: Reminder[];
  activities: Activity[];
  projectTemplates: ProjectTemplate[];
  auditLog: AuditEntry[];
  preferences: AgencyPreferences;
  integrationSettings: IntegrationSettings;
};
