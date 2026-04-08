export function tryFmt(n: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(n);
}

export function fmtMoney(amount: number, currency = "TRY") {
  const c =
    currency === "USD" || currency === "EUR" ? currency : "TRY";
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: c,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function dateFmt(iso: string) {
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso + (iso.length <= 10 ? "T12:00:00" : "")));
  } catch {
    return iso;
  }
}
