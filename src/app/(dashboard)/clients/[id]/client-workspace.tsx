import Link from "next/link";
import {
  Archive,
  ArrowLeft,
  BarChart3,
  Bell,
  CalendarPlus,
  CreditCard,
  FileText,
  FolderKanban,
  History,
  Mail,
  MessageCircle,
  Phone,
  Pin,
  Trash2,
  TrendingUp,
} from "lucide-react";
import {
  addActivity,
  addAdMetric,
  addAsset,
  addCalendarEvent,
  addOfferVersion,
  addPaymentEntry,
  addProject,
  addReminder,
  addTask,
  applyProjectTemplate,
  cancelTask,
  completeTask,
  createCustomWorkPlan,
  deleteAdMetric,
  deleteAsset,
  deleteEvent,
  deleteProject,
  deleteTask,
  togglePinClient,
  toggleReminder,
  updateClientCore,
  updateDeal,
  updateTask,
  type ClientBundle,
} from "@/app/actions/agency";
import { ClientToolbar } from "@/components/ClientToolbar";
import { remainingBalance, sumPayments } from "@/lib/store";
import { localYMD } from "@/lib/date-utils";
import { dateFmt, tryFmt } from "@/lib/format";
import {
  daysUntilDeadline,
  urgencyChipClassName,
  urgencyFromDeadline,
  urgencyLabelTr,
} from "@/lib/task-urgency";
import { isOpenTask } from "@/lib/task-utils";
import { cn } from "@/lib/cn";
import { SectionCard } from "@/components/ui/section-card";
import { pageWrap } from "@/components/ui/page-layout";
import {
  btnPrimary,
  btnSecondary,
  card,
  input,
  labelSm,
  select,
  textarea,
} from "@/components/ui/styles";
import type { TaskStatus } from "@/lib/types";

const offerStatuses: { v: string; l: string }[] = [
  { v: "", l: "—" },
  { v: "pending", l: "Bekliyor" },
  { v: "approved", l: "Onaylandı" },
  { v: "rejected", l: "Reddedildi" },
];

const taskStatuses: { v: TaskStatus; l: string }[] = [
  { v: "not_started", l: "Başlanmadı" },
  { v: "in_progress", l: "Devam ediyor" },
  { v: "done", l: "Bitti" },
  { v: "cancelled", l: "İptal" },
];

const eventTypes = [
  { v: "post", l: "Post planı" },
  { v: "shoot", l: "Çekim" },
  { v: "ad_start", l: "Reklam başlangıcı" },
  { v: "other", l: "Diğer" },
];

const assetKinds = [
  { v: "video", l: "Video" },
  { v: "design", l: "Tasarım" },
  { v: "drive", l: "Drive / dosya" },
  { v: "other", l: "Diğer" },
];

const inputSm = cn(input, "h-9 text-sm");
const selectSm = cn(select, "h-9 text-sm");

const approvalOpts = [
  { v: "none", l: "Onay yok" },
  { v: "pending_client", l: "Müşteri onayı bekliyor" },
  { v: "approved_client", l: "Müşteri onayladı" },
] as const;

const recurrenceOpts = [
  { v: "none", l: "Tek sefer" },
  { v: "weekly", l: "Haftalık" },
  { v: "monthly", l: "Aylık" },
] as const;

export function ClientWorkspace({ bundle }: { bundle: ClientBundle }) {
  const {
    client,
    deal,
    projects,
    events,
    adMetrics,
    assets,
    reminders,
    teamMembers,
    activities,
    projectTemplates,
    agencyServices,
    readOnly,
    pinned,
  } = bundle;
  const cid = client.id;
  const received = sumPayments(client);
  const left = remainingBalance(client);
  const waDigits = String(client.phone ?? "").replace(/\D/g, "");
  const todayYMD = localYMD();
  const defaultAssigneeName =
    teamMembers.find((m) => m.active)?.name ??
    teamMembers[0]?.name ??
    "Sen";

  return (
    <div className={cn(pageWrap, "space-y-6 pb-20 sm:space-y-8 sm:pb-24")}>
      <div className="flex flex-col gap-3 border-b border-white/[0.06] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-500">
          Müşteri kartı — tüm operasyon bu sayfada toplanır.
        </p>
        <ClientToolbar clientId={cid} readOnly={readOnly} />
      </div>
      <div className="grid gap-8 2xl:grid-cols-[minmax(260px,360px)_minmax(0,1fr)] 2xl:items-start 2xl:gap-10 min-[2000px]:grid-cols-[minmax(280px,400px)_1fr] min-[2000px]:gap-14 min-[2400px]:gap-16">
        <aside className="space-y-5 2xl:sticky 2xl:top-10 2xl:z-10 2xl:self-start">
          <Link
            href="/clients"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-300"
          >
            <ArrowLeft className="size-4" strokeWidth={1.75} />
            Müşteriler
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl 2xl:text-4xl min-[2200px]:text-[2.5rem]">
            {client.companyName || "İsimsiz firma"}
          </h1>
          <div className="flex flex-wrap gap-2">
            {client.phone ? (
              <a
                href={`tel:${client.phone.replace(/\s/g, "")}`}
                className={cn(btnSecondary, "h-9 gap-1.5 px-3 text-xs")}
              >
                <Phone className="size-3.5" />
                Ara
              </a>
            ) : null}
            {client.email ? (
              <a
                href={`mailto:${client.email}`}
                className={cn(btnSecondary, "h-9 gap-1.5 px-3 text-xs")}
              >
                <Mail className="size-3.5" />
                E-posta
              </a>
            ) : null}
            {waDigits.length >= 10 ? (
              <a
                href={`https://wa.me/${waDigits.replace(/^0/, "90")}`}
                target="_blank"
                rel="noreferrer"
                className={cn(btnSecondary, "h-9 gap-1.5 border-emerald-500/20 bg-emerald-950/30 px-3 text-xs text-emerald-200")}
              >
                <MessageCircle className="size-3.5" />
                WhatsApp
              </a>
            ) : null}
          </div>
          <div className={cn(card, "p-4")}>
            <p className="text-xs font-medium text-zinc-500">Teklif özeti</p>
            <p className="mt-1 text-sm text-zinc-300">
              {deal.offerGiven && deal.offerAmount != null ? (
                <>
                  <span className="font-semibold tabular-nums text-violet-300">
                    {tryFmt(deal.offerAmount)}
                  </span>
                  {deal.offerStatus ? (
                    <span className="ml-2 text-xs text-zinc-500">
                      ·{" "}
                      {deal.offerStatus === "pending"
                        ? "Bekliyor"
                        : deal.offerStatus === "approved"
                          ? "Onaylandı"
                          : "Reddedildi"}
                    </span>
                  ) : null}
                </>
              ) : (
                <span className="text-zinc-500">Kayıtlı teklif yok</span>
              )}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/[0.08] pt-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-600">
                  Anlaşma
                </p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums text-zinc-200">
                  {tryFmt(client.payment.agreementAmount)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-600">
                  Tahsil
                </p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums text-emerald-400">
                  {tryFmt(received)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-600">
                  Kalan
                </p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums text-amber-400">
                  {tryFmt(left)}
                </p>
              </div>
            </div>
            {client.payment.nextDueDate ? (
              <p className="mt-3 text-xs text-zinc-500">
                Sonraki vade:{" "}
                <span className="font-medium text-zinc-400">
                  {client.payment.nextDueDate}
                </span>
              </p>
            ) : null}
          </div>
          {!readOnly ? (
            <form action={togglePinClient.bind(null, cid)}>
              <button
                type="submit"
                className={cn(btnSecondary, "w-full gap-2 sm:w-auto", pinned && "border-amber-500/30 bg-amber-950/20 text-amber-200")}
              >
                <Pin className={cn("size-4", pinned && "fill-current")} />
                {pinned ? "Sabitten çıkar" : "Sabitle"}
              </button>
            </form>
          ) : null}
        </aside>

        <div className="min-w-0">
          {readOnly ? (
            <div className="mb-4 rounded-xl border border-amber-500/25 bg-amber-950/25 px-4 py-3 text-sm text-amber-200">
              Görüntüleme modu: Ayarlardan rolü düzenleyebilirsin.
            </div>
          ) : null}
          <fieldset
            disabled={readOnly}
            className="min-w-0 space-y-6 border-0 p-0 2xl:grid 2xl:grid-cols-2 2xl:gap-6 2xl:space-y-0 disabled:opacity-[0.65]"
          >
      <SectionCard icon={History} title="Aktivite zaman çizelgesi" description="Arama, mail, toplantı kayıtları.">
        <form action={addActivity.bind(null, cid)} className="mb-4 grid gap-3 sm:grid-cols-2">
          <Inp name="title" placeholder="Başlık" className="sm:col-span-2" />
          <select name="type" className={select}>
            <option value="call">Arama</option>
            <option value="email">E-posta</option>
            <option value="meeting">Toplantı</option>
            <option value="note">Not</option>
            <option value="other">Diğer</option>
          </select>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className={labelSm}>Detay</span>
            <textarea name="body" rows={2} className={textarea} />
          </label>
          <button type="submit" className={cn(btnPrimary, "h-9 w-fit text-xs sm:col-span-2")}>
            Kayıt ekle
          </button>
        </form>
        <ul className="space-y-3 text-sm">
          {activities.length === 0 ? (
            <li className="text-zinc-500">Henüz aktivite yok.</li>
          ) : (
            activities.map((a) => (
              <li
                key={a.id}
                className="rounded-xl border border-white/[0.06] bg-zinc-950/40 px-4 py-3"
              >
                <p className="font-medium text-zinc-200">{a.title}</p>
                <p className="text-xs text-zinc-500">
                  {a.type} · {new Date(a.createdAt).toLocaleString("tr-TR")}
                  {a.actor ? ` · ${a.actor}` : ""}
                </p>
                {a.body ? <p className="mt-2 text-xs text-zinc-400">{a.body}</p> : null}
              </li>
            ))
          )}
        </ul>
      </SectionCard>

      <SectionCard
        id="musteri-genel"
        icon={FileText}
        title="Genel bilgi"
        description="İletişim, sektör, hizmet seçimi ve kritik notlar."
      >
        <form action={updateClientCore.bind(null, cid)} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Inp label="Firma adı" name="companyName" defaultValue={client.companyName} />
            <Inp label="Yetkili" name="contactName" defaultValue={client.contactName} />
            <Inp label="Telefon" name="phone" defaultValue={client.phone} />
            <Inp label="E-posta" name="email" type="email" defaultValue={client.email} />
            <Inp label="Sektör" name="sector" defaultValue={client.sector} />
            <Inp label="Nereden geldi" name="leadSource" defaultValue={client.leadSource} />
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={labelSm}>Notlar</span>
            <textarea
              name="notes"
              rows={4}
              defaultValue={client.notes}
              className={textarea}
            />
          </label>
          <div className="rounded-xl border border-white/[0.06] bg-zinc-950/30 p-4">
            <p className={labelSm}>Verilen hizmetler (çoklu seçim)</p>
            <p className="mb-3 text-xs text-zinc-600">
              Listeyi{" "}
              <a href="/services" className="text-violet-400 hover:underline">
                Hizmetler
              </a>{" "}
              sayfasından yönetirsin.
            </p>
            {agencyServices.length === 0 ? (
              <p className="text-sm text-amber-200/90">
                Henüz tanımlı hizmet yok. Önce katalog oluştur.
              </p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {agencyServices.map((svc) => (
                  <li key={svc.id}>
                    <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-white/[0.06] bg-zinc-950/50 px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.03]">
                      <input
                        type="checkbox"
                        name="serviceId"
                        value={svc.id}
                        defaultChecked={client.serviceIds.includes(svc.id)}
                        className="mt-1 size-4 rounded border-white/20 bg-zinc-900"
                      />
                      <span>
                        <span className="font-medium text-zinc-200">{svc.name}</span>
                        {svc.description ? (
                          <span className="mt-0.5 block text-xs text-zinc-500">
                            {svc.description}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-1.5">
              <span className={labelSm}>Para birimi</span>
              <select name="currency" className={select} defaultValue={client.currency}>
                <option value="TRY">TRY</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelSm}>Öncelik</span>
              <select name="priority" className={select} defaultValue={client.priority}>
                <option value="low">Düşük</option>
                <option value="medium">Orta</option>
                <option value="high">Yüksek</option>
              </select>
            </label>
            <Inp
              label="Lead skoru (0–100)"
              name="leadScore"
              type="number"
              defaultValue={String(client.leadScore)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Inp
              label={`Anlaşma tutarı (${client.currency})`}
              name="agreementAmount"
              type="number"
              step="0.01"
              defaultValue={String(client.payment.agreementAmount)}
            />
            <Inp
              label="Sonraki ödeme tarihi"
              name="nextDueDate"
              type="date"
              defaultValue={client.payment.nextDueDate ?? ""}
            />
          </div>
          <button type="submit" className={cn(btnSecondary, "h-10 w-fit bg-zinc-100 text-zinc-900 hover:bg-white")}>
            Kaydet
          </button>
        </form>
      </SectionCard>

      <SectionCard
        icon={TrendingUp}
        title="Teklif & anlaşma"
        description="Teklif tutarı, durum ve versiyon geçmişi."
      >
        <form action={updateDeal.bind(null, cid)} className="grid gap-4">
          <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-300">
            <input
              type="checkbox"
              name="offerGiven"
              defaultChecked={deal.offerGiven}
              className="size-4 rounded border-white/20 bg-zinc-900 text-violet-600 focus:ring-violet-500/30"
            />
            Teklif verildi
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Inp
              label="Teklif tutarı (₺)"
              name="offerAmount"
              type="number"
              step="0.01"
              defaultValue={deal.offerAmount != null ? String(deal.offerAmount) : ""}
            />
            <label className="flex flex-col gap-1.5">
              <span className={labelSm}>Teklif durumu</span>
              <select
                name="offerStatus"
                defaultValue={deal.offerStatus ?? ""}
                className={select}
              >
                {offerStatuses.map((s) => (
                  <option key={s.v || "empty"} value={s.v}>
                    {s.l}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <Inp
            label="Teklif dosyası (PDF / link)"
            name="offerFileUrl"
            defaultValue={deal.offerFileUrl ?? ""}
            placeholder="https://..."
          />
          <label className="flex flex-col gap-1.5">
            <span className={labelSm}>Not / kayıp nedeni (opsiyonel)</span>
            <textarea
              name="lossReason"
              rows={2}
              defaultValue={deal.lossReason ?? ""}
              placeholder="Fiyat, zamanlama, rakip…"
              className={textarea}
            />
          </label>
          <button type="submit" className={cn(btnPrimary, "w-fit")}>
            Teklifi kaydet
          </button>
        </form>
        <div className="mt-6 border-t border-white/[0.06] pt-6">
          <p className={labelSm}>Teklif versiyonları</p>
          <ul className="mt-2 space-y-2 text-sm">
            {deal.offerVersions.length === 0 ? (
              <li className="text-zinc-500">Henüz versiyon yok.</li>
            ) : (
              [...deal.offerVersions]
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                .map((v) => (
                  <li
                    key={v.id}
                    className="flex flex-wrap justify-between gap-2 rounded-lg border border-white/[0.06] px-3 py-2"
                  >
                    <span className="text-zinc-200">{v.label}</span>
                    <span className="tabular-nums text-violet-300">{tryFmt(v.amount)}</span>
                    <span className="w-full text-xs text-zinc-500">
                      {v.status ?? "—"} · {v.createdAt.slice(0, 10)}
                    </span>
                  </li>
                ))
            )}
          </ul>
          <form action={addOfferVersion.bind(null, cid)} className="mt-4 grid gap-3 sm:grid-cols-2">
            <Inp name="label" placeholder="Versiyon adı" />
            <Inp name="amount" type="number" step="0.01" placeholder="Tutar" />
            <Inp name="fileUrl" placeholder="PDF link" className="sm:col-span-2" />
            <select name="versionStatus" className={select}>
              <option value="pending">Bekliyor</option>
              <option value="approved">Onaylandı</option>
              <option value="rejected">Reddedildi</option>
            </select>
            <button type="submit" className={cn(btnSecondary, "h-10")}>
              Versiyon ekle
            </button>
          </form>
        </div>
      </SectionCard>

      <div className="min-w-0 2xl:col-span-2">
      <SectionCard
        icon={FolderKanban}
        title="İş planı oluştur"
        description="Toplu görev açar. İş başlangıç/bitiş doldurursan tarihsiz satırlara otomatik vade dağıtılır; satır içinde | tarih de kullanabilirsin. Takvim kutusu vadeleri etkinliğe yazar — İş planı sayfasında aciliyetlenir."
      >
        <form action={createCustomWorkPlan.bind(null, cid)} className="grid gap-4">
          <Inp
            label="Plan / proje adı"
            name="planName"
            placeholder="Örn. Nisan lansman paketi"
            className="sm:col-span-2"
          />
          <div className="grid gap-4 sm:grid-cols-2 sm:col-span-2">
            <label className="flex flex-col gap-1.5">
              <span className={labelSm}>İş başlangıcı (opsiyonel)</span>
              <input name="planStartDate" type="date" className={input} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelSm}>İş bitişi (opsiyonel)</span>
              <input name="planEndDate" type="date" className={input} />
            </label>
          </div>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className={labelSm}>
              Görevler (satır başına bir görev)
            </span>
            <span className="text-xs text-zinc-600">
              Sadece başlık veya: <code className="text-zinc-500">Başlık | 2026-04-20</code> veya{" "}
              <code className="text-zinc-500">Başlık | 2026-04-20 | Ayşe Yılmaz</code>
            </span>
            <textarea
              name="taskLines"
              rows={6}
              placeholder={"Storyboard onayı\nÇekim günü | 2026-04-12 | Mehmet Kaya\nİlk kurgu teslimi | 2026-04-18"}
              className={textarea}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelSm}>Varsayılan sorumlu</span>
            <select name="defaultAssignee" className={select} defaultValue={defaultAssigneeName}>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              name="syncCalendar"
              className="size-4 rounded border-white/20 bg-zinc-900 text-violet-600"
            />
            Vadeli satırları takvime yaz
          </label>
          <button type="submit" className={cn(btnPrimary, "h-10 w-fit")}>
            İş planını oluştur
          </button>
        </form>
      </SectionCard>
      </div>

      <div className="min-w-0 2xl:col-span-2">
      <SectionCard icon={FolderKanban} title="Şablonlardan proje oluştur" description="Hazır görev setlerini tek tıkla ekle.">
        <div className="flex flex-wrap gap-2">
          {projectTemplates.map((tpl) => (
            <form key={tpl.id} action={applyProjectTemplate.bind(null, cid, tpl.id)}>
              <button type="submit" className={cn(btnSecondary, "h-9 text-xs")}>
                {tpl.name}
              </button>
            </form>
          ))}
        </div>
        {projectTemplates.length === 0 ? (
          <p className="text-sm text-zinc-500">Şablon yok — seed verisinde örnekler var.</p>
        ) : null}
      </SectionCard>
      </div>

      <div className="min-w-0 2xl:col-span-2">
      <SectionCard
        icon={FolderKanban}
        title="Projeler & görevler"
        description="Açık görevler burada. Tamamlanan ve iptal edilenler arşivde saklanır."
      >
        <p className="mb-4 text-xs text-zinc-500">
          <Link
            href={`/workload/archive?c=${cid}`}
            className="font-medium text-violet-400 hover:text-violet-300"
          >
            Bu müşterinin iş arşivi (tamamlandı / iptal) →
          </Link>
        </p>
        <form action={addProject.bind(null, cid)} className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <input
            name="name"
            placeholder="Yeni proje adı"
            className={cn(input, "min-w-0 flex-1 sm:min-w-[240px]")}
          />
          <button type="submit" className={btnSecondary + " h-10 shrink-0"}>
            Proje ekle
          </button>
        </form>
        <div className="mt-8 space-y-10">
          {projects.length === 0 ? (
            <p className="text-sm text-zinc-500">Henüz proje yok.</p>
          ) : (
            projects.map((p) => (
              <div
                key={p.id}
                className="border-t border-white/[0.06] pt-8 first:border-0 first:pt-0"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-medium text-zinc-100">{p.name}</h3>
                  {!readOnly ? (
                    <form action={deleteProject.bind(null, p.id)}>
                      <button
                        type="submit"
                        className="text-xs font-medium text-red-400/90 hover:text-red-300"
                        title="Projeyi ve görevlerini sil"
                      >
                        Projeyi sil
                      </button>
                    </form>
                  ) : null}
                </div>
                <form
                  action={addTask.bind(null, p.id)}
                  className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
                >
                  <input
                    name="title"
                    placeholder="Görev başlığı"
                    className={cn(inputSm, "min-w-0 flex-1 sm:min-w-[200px]")}
                  />
                  <select name="assignee" className={cn(selectSm, "sm:w-44")}>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <input name="deadline" type="date" className={cn(inputSm, "sm:w-40")} />
                  <select name="status" className={cn(selectSm, "sm:w-40")} defaultValue="not_started">
                    {taskStatuses.map((x) => (
                      <option key={x.v} value={x.v}>
                        {x.l}
                      </option>
                    ))}
                  </select>
                  <select name="clientApproval" className={cn(selectSm, "sm:w-52")} defaultValue="none">
                    {approvalOpts.map((x) => (
                      <option key={x.v} value={x.v}>
                        {x.l}
                      </option>
                    ))}
                  </select>
                  <select name="recurrence" className={cn(selectSm, "sm:w-36")} defaultValue="none">
                    {recurrenceOpts.map((x) => (
                      <option key={x.v} value={x.v}>
                        {x.l}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className={cn(btnPrimary, "h-9 shrink-0 text-xs")}>
                    Görev ekle
                  </button>
                </form>
                <ul className="mt-4 space-y-3">
                  {p.tasks.filter(isOpenTask).length === 0 ? (
                    <li className="text-sm text-zinc-600">
                      {p.tasks.length === 0
                        ? "Görev yok."
                        : "Açık görev yok — kapalı işler arşivde."}
                    </li>
                  ) : (
                    p.tasks.filter(isOpenTask).map((t) => {
                      const urg = urgencyFromDeadline(t.deadline, todayYMD);
                      const late =
                        t.deadline && daysUntilDeadline(t.deadline, todayYMD) < 0;
                      return (
                      <li
                        key={t.id}
                        className="rounded-xl border border-white/[0.06] bg-zinc-950/40 p-4 ring-1 ring-white/[0.02]"
                      >
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1",
                              urgencyChipClassName(urg)
                            )}
                          >
                            {urgencyLabelTr[urg]}
                          </span>
                          {late ? (
                            <span className="text-[11px] font-semibold text-red-400">
                              Gecikti
                            </span>
                          ) : null}
                        </div>
                        <form
                          action={updateTask.bind(null, t.id)}
                          className="grid gap-3 xl:grid-cols-[1fr_auto_auto_auto_auto_auto_auto]"
                        >
                          <input
                            name="title"
                            defaultValue={t.title}
                            className={inputSm}
                          />
                          <select
                            name="assignee"
                            defaultValue={t.assignee}
                            className={selectSm}
                          >
                            {teamMembers.map((m) => (
                              <option key={m.id} value={m.name}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                          <input
                            name="deadline"
                            type="date"
                            defaultValue={t.deadline ?? ""}
                            className={inputSm}
                          />
                          <select
                            name="status"
                            defaultValue={t.status}
                            className={selectSm}
                          >
                            {taskStatuses.map((x) => (
                              <option key={x.v} value={x.v}>
                                {x.l}
                              </option>
                            ))}
                          </select>
                          <select
                            name="clientApproval"
                            defaultValue={t.clientApproval}
                            className={selectSm}
                          >
                            {approvalOpts.map((x) => (
                              <option key={x.v} value={x.v}>
                                {x.l}
                              </option>
                            ))}
                          </select>
                          <select
                            name="recurrence"
                            defaultValue={t.recurrence}
                            className={selectSm}
                          >
                            {recurrenceOpts.map((x) => (
                              <option key={x.v} value={x.v}>
                                {x.l}
                              </option>
                            ))}
                          </select>
                          <button
                            type="submit"
                            className={cn(btnSecondary, "h-9 text-xs")}
                          >
                            Güncelle
                          </button>
                        </form>
                        {!readOnly ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            <form action={completeTask.bind(null, t.id)}>
                              <button
                                type="submit"
                                className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-200 ring-1 ring-emerald-500/30 hover:bg-emerald-500/25"
                              >
                                Tamamla
                              </button>
                            </form>
                            <form action={cancelTask.bind(null, t.id)}>
                              <button
                                type="submit"
                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-amber-400/90 ring-1 ring-amber-500/25 hover:bg-amber-500/10"
                              >
                                İptal
                              </button>
                            </form>
                            <form action={deleteTask.bind(null, t.id)}>
                              <button
                                type="submit"
                                className="inline-flex items-center gap-1 text-xs text-red-400/90 hover:text-red-300"
                              >
                                <Trash2 className="size-3" />
                                Sil
                              </button>
                            </form>
                          </div>
                        ) : null}
                      </li>
                    );
                    })
                  )}
                </ul>
              </div>
            ))
          )}
        </div>
      </SectionCard>
      </div>

      <SectionCard icon={CalendarPlus} title="Takvim" description="Bu müşteriye özel etkinlikler.">
        <form
          action={addCalendarEvent.bind(null, cid)}
          className="grid gap-3 sm:grid-cols-2"
        >
          <Inp name="title" placeholder="Başlık" className="sm:col-span-2" />
          <select name="type" className={select}>
            {eventTypes.map((e) => (
              <option key={e.v} value={e.v}>
                {e.l}
              </option>
            ))}
          </select>
          <Inp name="startDate" type="date" label="Başlangıç" />
          <Inp name="endDate" type="date" label="Bitiş (opsiyonel)" />
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className={labelSm}>Not</span>
            <input name="notes" className={input} />
          </label>
          <button type="submit" className={cn(btnSecondary, "w-fit sm:col-span-2")}>
            Etkinlik ekle
          </button>
        </form>
        <ul className="mt-6 space-y-2">
          {events.length === 0 ? (
            <li className="text-sm text-zinc-500">Etkinlik yok.</li>
          ) : (
            events
              .slice()
              .sort((a, b) => a.startDate.localeCompare(b.startDate))
              .map((e) => (
                <li
                  key={e.id}
                  className="flex flex-col gap-2 rounded-xl border border-white/[0.06] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <span className="font-medium text-zinc-200">{e.title}</span>
                    <span className="mt-0.5 block text-xs text-zinc-500">
                      {eventTypes.find((x) => x.v === e.type)?.l} · {e.startDate}
                    </span>
                  </div>
                  <form action={deleteEvent.bind(null, e.id)}>
                    <button
                      type="submit"
                      className="text-xs font-medium text-red-400 hover:text-red-300"
                    >
                      Sil
                    </button>
                  </form>
                </li>
              ))
          )}
        </ul>
      </SectionCard>

      <SectionCard icon={CreditCard} title="Ödeme takibi" description="Anlaşma, tahsilat ve kalan bakiye.">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { k: "Anlaşma", v: tryFmt(client.payment.agreementAmount), c: "text-white" },
            { k: "Tahsil edilen", v: tryFmt(received), c: "text-emerald-400" },
            { k: "Kalan", v: tryFmt(left), c: "text-amber-400" },
          ].map((x) => (
            <div
              key={x.k}
              className="rounded-xl border border-white/[0.06] bg-zinc-950/50 p-4 ring-1 ring-white/[0.02]"
            >
              <p className="text-xs font-medium text-zinc-500">{x.k}</p>
              <p className={cn("mt-1 text-lg font-semibold tabular-nums", x.c)}>{x.v}</p>
            </div>
          ))}
        </div>
        <form
          action={addPaymentEntry.bind(null, cid)}
          className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap"
        >
          <input
            name="amount"
            type="number"
            step="0.01"
            placeholder="Tutar"
            className={cn(input, "sm:w-36")}
          />
          <input name="date" type="date" className={cn(input, "sm:w-44")} />
          <input
            name="note"
            placeholder="Not"
            className={cn(input, "min-w-0 flex-1")}
          />
          <Inp name="invoiceNo" placeholder="Fatura no" className="sm:w-40" />
          <button type="submit" className={cn(btnSecondary, "h-10 border-emerald-500/20 bg-emerald-950/30 text-emerald-200 hover:bg-emerald-950/50")}>
            Ödeme gir
          </button>
        </form>
        <ul className="mt-4 space-y-2 text-sm text-zinc-400">
          {client.payment.entries.map((e) => (
            <li key={e.id} className="flex flex-wrap gap-x-2 border-b border-white/[0.04] py-2 last:border-0">
              <span className="text-zinc-500">{dateFmt(e.date)}</span>
              <span className="font-medium text-zinc-300">{tryFmt(e.amount)}</span>
              {e.invoiceNo ? (
                <span className="text-zinc-500">· {e.invoiceNo}</span>
              ) : null}
              {e.note ? <span className="text-zinc-600">· {e.note}</span> : null}
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard
        icon={BarChart3}
        title="Reklam performansı"
        description="Meta vb. — müşteri raporu için özet."
      >
        <form
          action={addAdMetric.bind(null, cid)}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          <Inp name="label" placeholder="Dönem / kampanya adı" className="sm:col-span-2 lg:col-span-3" />
          <Inp name="budget" type="number" step="0.01" placeholder="Bütçe" />
          <Inp name="spent" type="number" step="0.01" placeholder="Harcanan" />
          <Inp name="conversions" type="number" step="0.01" placeholder="Dönüşüm" />
          <Inp name="roas" type="number" step="0.01" placeholder="ROAS" />
          <Inp name="periodStart" type="date" label="Dönem başı" />
          <Inp name="periodEnd" type="date" label="Dönem sonu" />
          <button type="submit" className={cn(btnSecondary, "h-10 sm:col-span-2 lg:col-span-3")}>
            Kayıt ekle
          </button>
        </form>
        <div className="mt-6 space-y-3">
          {adMetrics.length === 0 ? (
            <p className="text-sm text-zinc-500">Henüz metrik yok.</p>
          ) : (
            adMetrics.map((m) => (
              <div
                key={m.id}
                className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-zinc-950/40 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-zinc-200">{m.label}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Bütçe {tryFmt(m.budget)} · Harcanan {tryFmt(m.spent)} · ROAS {m.roas}
                    {m.periodStart ? ` · ${m.periodStart}` : ""}
                  </p>
                </div>
                <form action={deleteAdMetric.bind(null, m.id)}>
                  <button type="submit" className="text-xs text-red-400 hover:text-red-300">
                    Sil
                  </button>
                </form>
              </div>
            ))
          )}
        </div>
      </SectionCard>

      <SectionCard icon={Archive} title="Dosya & içerik arşivi" description="Video, tasarım ve Drive linkleri.">
        <form
          action={addAsset.bind(null, cid)}
          className="flex flex-col gap-2 sm:flex-row sm:flex-wrap"
        >
          <input name="title" placeholder="Başlık" className={cn(input, "min-w-0 flex-1 sm:min-w-[160px]")} />
          <input
            name="url"
            placeholder="https://..."
            className={cn(input, "min-w-0 flex-[2]")}
          />
          <select name="kind" className={cn(select, "sm:w-44")}>
            {assetKinds.map((k) => (
              <option key={k.v} value={k.v}>
                {k.l}
              </option>
            ))}
          </select>
          <button type="submit" className={btnSecondary + " h-10"}>
            Ekle
          </button>
        </form>
        <ul className="mt-5 space-y-2">
          {assets.map((a) => (
            <li
              key={a.id}
              className="flex flex-col gap-2 rounded-xl border border-white/[0.06] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <a
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-violet-400 hover:text-violet-300"
              >
                {a.title}
              </a>
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-wide text-zinc-600">{a.kind}</span>
                <form action={deleteAsset.bind(null, a.id)}>
                  <button type="submit" className="text-xs text-red-400">
                    Sil
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </SectionCard>

      <div className="min-w-0 2xl:col-span-2">
      <SectionCard icon={Bell} title="Hatırlatıcılar" description="Bu müşteriye özel görevler.">
        <form action={addReminder} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="clientId" value={cid} />
          <Inp name="title" placeholder="Ne hatırlanacak?" className="sm:col-span-2" />
          <input name="dueAt" type="datetime-local" className={input} />
          <select name="kind" className={select}>
            <option value="call">Müşteri arama</option>
            <option value="payment">Ödeme</option>
            <option value="other">Diğer</option>
          </select>
          <select name="recurrence" className={select} defaultValue="none">
            {recurrenceOpts.map((x) => (
              <option key={x.v} value={x.v}>
                {x.l}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className={cn(
              btnSecondary,
              "h-10 w-fit border-amber-500/20 bg-amber-950/25 text-amber-200 hover:bg-amber-950/40"
            )}
          >
            Hatırlatıcı ekle
          </button>
        </form>
        <ul className="mt-5 space-y-2">
          {reminders.length === 0 ? (
            <li className="text-sm text-zinc-500">Hatırlatıcı yok.</li>
          ) : (
            reminders.map((r) => (
              <li key={r.id}>
                <form action={toggleReminder.bind(null, r.id)}>
                  <button
                    type="submit"
                    className="flex w-full flex-col items-start gap-0.5 rounded-xl border border-white/[0.04] px-4 py-3 text-left transition hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span
                      className={cn(
                        "text-sm",
                        r.done ? "text-zinc-600 line-through" : "text-zinc-200"
                      )}
                    >
                      {r.title}
                    </span>
                    <span className="text-xs tabular-nums text-zinc-600">
                      {r.dueAt.slice(0, 16).replace("T", " ")}
                      {r.recurrence !== "none" ? ` · ${r.recurrence}` : ""}
                    </span>
                  </button>
                </form>
              </li>
            ))
          )}
        </ul>
      </SectionCard>
      </div>
          </fieldset>
        </div>
      </div>
    </div>
  );
}

function Inp({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  step,
  className = "",
}: {
  label?: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  step?: string;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      {label ? <span className={labelSm}>{label}</span> : null}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        step={step}
        className={input}
      />
    </label>
  );
}
