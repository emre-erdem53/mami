import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  setGoogleCalConnected,
  setMetaConnected,
  updateIntegrationSettings,
  updateWorkspacePreferences,
} from "@/app/actions/agency";
import { readState } from "@/lib/store";
import { PageHeader } from "@/components/ui/page-header";
import { pageWrap } from "@/components/ui/page-layout";
import { btnPrimary, btnSecondary, card, input, labelSm, select, textarea } from "@/components/ui/styles";
import { cn } from "@/lib/cn";

export default async function SettingsPage() {
  const s = await readState();
  const p = s.preferences;
  const integ = s.integrationSettings;

  return (
    <div className={cn(pageWrap, "space-y-8")}>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-300"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} />
        Panel
      </Link>
      <PageHeader
        title="Ayarlar"
        description="Oturum rolü, entegrasyon notları ve webhook."
      />

      <section className={cn(card, "max-w-2xl space-y-5 p-6")}>
        <h2 className="text-sm font-semibold text-zinc-200">Çalışma alanı</h2>
        <form action={updateWorkspacePreferences} className="grid gap-4">
          <label className="flex flex-col gap-1.5">
            <span className={labelSm}>Aktivite kaydında görünen ad</span>
            <input
              name="currentUserName"
              defaultValue={p.currentUserName}
              className={input}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelSm}>Oturum rolü</span>
            <select name="sessionRole" className={select} defaultValue={p.sessionRole}>
              <option value="admin">Yönetici (tam erişim)</option>
              <option value="editor">Editör</option>
              <option value="viewer">Görüntüleyici (salt okunur)</option>
            </select>
          </label>
          <button type="submit" className={cn(btnPrimary, "h-10 w-fit")}>
            Kaydet
          </button>
        </form>
      </section>

      <section className={cn(card, "max-w-2xl space-y-5 p-6")}>
        <h2 className="text-sm font-semibold text-zinc-200">Entegrasyonlar</h2>
        <p className="text-xs text-zinc-500">
          OAuth yerine yerel durum anahtarları; gerçek bağlantı için ileride genişletilebilir.
        </p>
        <form action={updateIntegrationSettings} className="grid gap-4">
          <label className="flex flex-col gap-1.5">
            <span className={labelSm}>Webhook URL</span>
            <input
              name="webhookUrl"
              defaultValue={integ.webhookUrl ?? ""}
              placeholder="https://..."
              className={input}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelSm}>Meta Ads notu</span>
            <textarea
              name="metaNote"
              rows={2}
              defaultValue={integ.metaAds.note ?? ""}
              className={textarea}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelSm}>Google Takvim notu</span>
            <textarea
              name="gcalNote"
              rows={2}
              defaultValue={integ.googleCalendar.note ?? ""}
              className={textarea}
            />
          </label>
          <button type="submit" className={cn(btnSecondary, "h-10 w-fit")}>
            Notları kaydet
          </button>
        </form>
        <div className="flex flex-wrap gap-2 border-t border-white/[0.06] pt-5">
          <span className="w-full text-xs text-zinc-500">Bağlantı durumu (simüle)</span>
          <form action={setMetaConnected.bind(null, true)}>
            <button type="submit" className={cn(btnSecondary, "h-9 text-xs")}>
              Meta: bağlı
            </button>
          </form>
          <form action={setMetaConnected.bind(null, false)}>
            <button type="submit" className={cn(btnSecondary, "h-9 text-xs")}>
              Meta: kes
            </button>
          </form>
          <form action={setGoogleCalConnected.bind(null, true)}>
            <button type="submit" className={cn(btnSecondary, "h-9 text-xs")}>
              GCal: bağlı
            </button>
          </form>
          <form action={setGoogleCalConnected.bind(null, false)}>
            <button type="submit" className={cn(btnSecondary, "h-9 text-xs")}>
              GCal: kes
            </button>
          </form>
        </div>
        <p className="text-xs text-zinc-600">
          Meta: {integ.metaAds.connected ? "bağlı" : "kapalı"} · GCal:{" "}
          {integ.googleCalendar.connected ? "bağlı" : "kapalı"}
        </p>
      </section>
    </div>
  );
}
