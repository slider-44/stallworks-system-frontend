// Philippine-time-aware date helpers. This business operates in the
// Philippines (Asia/Manila, UTC+8) — "today" must always mean Manila's
// today, regardless of the device/browser's own local timezone.
//
// IMPORTANT: don't use `new Date().toISOString().slice(0, 10)` anywhere —
// toISOString() always converts to UTC first, which silently gives the
// WRONG date for anywhere between midnight and 8am Manila time.

const MANILA_TZ = "Asia/Manila";

const manilaDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: MANILA_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}); // en-CA locale formats as YYYY-MM-DD directly

export function todayISO() {
  return manilaDateFormatter.format(new Date());
}

export function daysAgoISO(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return manilaDateFormatter.format(d);
}

export function formatDateLongManila(dateStr) {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  const full = d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: MANILA_TZ });
  const weekday = d.toLocaleDateString("en-US", { weekday: "short", timeZone: MANILA_TZ });
  return `${full} (${weekday})`;
}
