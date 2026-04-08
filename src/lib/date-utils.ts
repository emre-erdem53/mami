/** Yerel takvim günü (YYYY-MM-DD) — ödeme/vade/hatırlatıcı ile uyumlu. */
export function localYMD(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDaysYMD(ymd: string, deltaDays: number): string {
  const [y, mo, da] = ymd.split("-").map(Number);
  const x = new Date(y, mo - 1, da + deltaDays);
  return localYMD(x);
}

export function monthPrefix(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function dayInMonth(prefix: string, day: number): string {
  return `${prefix}-${String(day).padStart(2, "0")}`;
}

/** datetime-local ile uyumlu (timezone yok). */
export function localDateTimeFromYMD(ymd: string, hour: number, minute: number): string {
  return `${ymd}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidYMD(s: string): boolean {
  if (!YMD_RE.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

/** Başlangıç–bitiş arasında n görev için eş aralıklı vadeler (uçlar dahil, n ≥ 1). */
export function spreadDatesInclusive(startYMD: string, endYMD: string, n: number): string[] {
  if (n <= 0) return [];
  const [y0, m0, d0] = startYMD.split("-").map(Number);
  const [y1, m1, d1] = endYMD.split("-").map(Number);
  const t0 = new Date(y0, m0 - 1, d0).getTime();
  const t1 = new Date(y1, m1 - 1, d1).getTime();
  if (t1 < t0) return spreadDatesInclusive(endYMD, startYMD, n);
  if (n === 1) return [localYMD(new Date(t1))];
  const out: string[] = [];
  const span = t1 - t0;
  for (let i = 0; i < n; i++) {
    const t = t0 + Math.round((span * i) / (n - 1));
    out.push(localYMD(new Date(t)));
  }
  return out;
}
