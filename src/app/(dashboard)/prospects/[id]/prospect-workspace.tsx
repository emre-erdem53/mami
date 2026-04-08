import Link from "next/link";
import {
  addProspectProposal,
  convertProspectToClient,
  deleteProspect,
  updateProspectCore,
  type ProspectPageData,
} from "@/app/actions/agency";
import { dateFmt, fmtMoney } from "@/lib/format";
import type { ProspectStage } from "@/lib/types";
import { SectionCard } from "@/components/ui/section-card";
import { pageWrap } from "@/components/ui/page-layout";
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  card,
  input,
  labelSm,
  select,
  textarea,
} from "@/components/ui/styles";
import { cn } from "@/lib/cn";

const stageLabel: Record<ProspectStage, string> = {
  new: "Yeni",
  contacted: "İletişim kuruldu",
  meeting: "Görüşme",
  proposal_sent: "Teklif gönderildi",
  negotiation: "Pazarlık / revizyon",
  won: "Müşteriye dönüştü",
  lost: "Kayıp",
};

const offerStatusLabel: Record<string, string> = {
  pending: "Bekliyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
};

export function ProspectWorkspace({ data }: { data: ProspectPageData }) {
  const { prospect: p, readOnly } = data;
  const pid = p.id;
  const locked = readOnly || !!p.convertedClientId;

  return (
    <div className={cn(pageWrap, "space-y-8 pb-20")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/prospects"
            className="text-sm text-zinc-500 transition hover:text-zinc-300"
          >
            ← Potansiyeller
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
            {p.companyName || "İsimsiz"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {stageLabel[p.stage]}
            {p.convertedClientId ? (
              <>
                {" · "}
                <Link
                  href={`/clients/${p.convertedClientId}`}
                  className="text-violet-400 hover:text-violet-300"
                >
                  Müşteri kartını aç
                </Link>
              </>
            ) : null}
          </p>
        </div>
        {!readOnly && !p.convertedClientId ? (
          <form action={deleteProspect.bind(null, pid)}>
            <button type="submit" className={cn(btnDanger, "h-10 text-xs")}>
              Kaydı sil
            </button>
          </form>
        ) : null}
      </div>

      {readOnly ? (
        <div className="rounded-xl border border-amber-500/25 bg-amber-950/25 px-4 py-3 text-sm text-amber-200">
          Görüntüleme modu: düzenleme kapalı.
        </div>
      ) : null}

      <fieldset
        disabled={locked}
        className="space-y-8 border-0 p-0 disabled:opacity-[0.65]"
      >
        <SectionCard
          title="Genel bilgi & süreç"
          description="İletişim, aşama ve görüşme notları."
        >
          <form action={updateProspectCore.bind(null, pid)} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className={labelSm}>Firma</span>
                <input name="companyName" defaultValue={p.companyName} className={input} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelSm}>Yetkili</span>
                <input name="contactName" defaultValue={p.contactName} className={input} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelSm}>Telefon</span>
                <input name="phone" defaultValue={p.phone} className={input} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelSm}>E-posta</span>
                <input name="email" type="email" defaultValue={p.email} className={input} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelSm}>Sektör</span>
                <input name="sector" defaultValue={p.sector} className={input} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelSm}>Kaynak</span>
                <input name="leadSource" defaultValue={p.leadSource} className={input} />
              </label>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className={labelSm}>Aşama</span>
              <select name="stage" className={select} defaultValue={p.stage}>
                <option value="new">Yeni</option>
                <option value="contacted">İletişim kuruldu</option>
                <option value="meeting">Görüşme</option>
                <option value="proposal_sent">Teklif gönderildi</option>
                <option value="negotiation">Pazarlık / revizyon</option>
                <option value="lost">Kayıp</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelSm}>Kayıp nedeni (aşama “Kayıp” ise)</span>
              <textarea
                name="lossReason"
                rows={2}
                defaultValue={p.lossReason ?? ""}
                className={textarea}
                placeholder="Fiyat, zamanlama, rakip…"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelSm}>Görüşme (tarih & saat)</span>
              <input
                name="meetingAt"
                type="datetime-local"
                defaultValue={p.meetingAt ?? ""}
                className={input}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelSm}>Görüşme notu</span>
              <textarea
                name="meetingNote"
                rows={2}
                defaultValue={p.meetingNote ?? ""}
                className={textarea}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelSm}>Notlar</span>
              <textarea name="notes" rows={3} defaultValue={p.notes} className={textarea} />
            </label>
            <button type="submit" className={cn(btnSecondary, "h-10 w-fit")}>
              Kaydet
            </button>
          </form>
        </SectionCard>

        <SectionCard
          title="Teklif versiyonları"
          description="Her gönderdiğin PDF / tutar burada tarihlenir. Yeni teklif eklediğinde aşama otomatik güncellenebilir."
        >
          <ul className="mb-6 space-y-3 text-sm">
            {p.proposals.length === 0 ? (
              <li className="text-zinc-500">Henüz teklif kaydı yok.</li>
            ) : (
              [...p.proposals]
                .sort((a, b) => b.sentAt.localeCompare(a.sentAt))
                .map((x) => (
                  <li
                    key={x.id}
                    className="rounded-xl border border-white/[0.06] bg-zinc-950/40 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-medium text-zinc-200">{x.label}</span>
                      <span className="tabular-nums text-cyan-300">
                        {fmtMoney(x.amount, x.currency)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {dateFmt(x.sentAt)} · {offerStatusLabel[x.status] ?? x.status}
                      {x.fileUrl ? (
                        <>
                          {" · "}
                          <a
                            href={x.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-violet-400 hover:underline"
                          >
                            Dosya
                          </a>
                        </>
                      ) : null}
                    </p>
                    {x.note ? <p className="mt-2 text-xs text-zinc-400">{x.note}</p> : null}
                  </li>
                ))
            )}
          </ul>
          {!p.convertedClientId ? (
            <form action={addProspectProposal.bind(null, pid)} className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className={labelSm}>Versiyon adı</span>
                <input name="label" placeholder="v3 — revize" className={input} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelSm}>Tutar</span>
                <input name="amount" type="number" step="0.01" className={input} required />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelSm}>Para birimi</span>
                <select name="currency" className={select} defaultValue="TRY">
                  <option value="TRY">TRY</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelSm}>Gönderim tarihi</span>
                <input name="sentAt" type="date" className={input} required />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelSm}>Durum</span>
                <select name="versionStatus" className={select} defaultValue="pending">
                  <option value="pending">Bekliyor</option>
                  <option value="approved">Onaylandı</option>
                  <option value="rejected">Reddedildi</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className={labelSm}>PDF / link</span>
                <input name="fileUrl" placeholder="https://..." className={input} />
              </label>
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className={labelSm}>Not</span>
                <input name="note" className={input} />
              </label>
              <button type="submit" className={cn(btnPrimary, "h-10 w-fit sm:col-span-2")}>
                Teklif ekle
              </button>
            </form>
          ) : null}
        </SectionCard>

        {!p.convertedClientId ? (
          <SectionCard
            title="Müşteriye dönüştür"
            description="Anlaşma sağlandığında müşteri kartı ve teklif kaydı oluşturulur; son teklif tutarı aktarılır."
          >
            <form
              action={convertProspectToClient.bind(null, pid)}
              className={cn(card, "grid gap-4 p-5")}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className={labelSm}>Anlaşma tutarı</span>
                  <input name="agreementAmount" type="number" step="0.01" className={input} required />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelSm}>Para birimi</span>
                  <select name="currency" className={select} defaultValue="TRY">
                    <option value="TRY">TRY</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelSm}>Öncelik</span>
                  <select name="priority" className={select} defaultValue="medium">
                    <option value="low">Düşük</option>
                    <option value="medium">Orta</option>
                    <option value="high">Yüksek</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelSm}>Lead skoru (0–100)</span>
                  <input name="leadScore" type="number" defaultValue="50" className={input} />
                </label>
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className={labelSm}>Sonraki ödeme tarihi (opsiyonel)</span>
                  <input name="nextDueDate" type="date" className={input} />
                </label>
              </div>
              <button type="submit" className={cn(btnPrimary, "h-11 w-fit")}>
                Müşteri kartı oluştur
              </button>
            </form>
          </SectionCard>
        ) : null}
      </fieldset>
    </div>
  );
}
