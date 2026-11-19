// Helper format angka & tanggal untuk halaman Inspection Record (laporan hasil cek).

/** Jumlah angka desimal sebuah angka (maks 4, sesuai presisi database). */
const decimalsOf = (n) => {
  const s = String(n ?? "");
  const i = s.indexOf(".");
  return i < 0 ? 0 : Math.min(4, s.length - i - 1);
};

/** Presisi satu titik ukur = desimal terbanyak di antara standard, min, max, value. */
export const pointDecimals = (p) =>
  Math.max(decimalsOf(p.standard), decimalsOf(p.min), decimalsOf(p.max), decimalsOf(p.value), decimalsOf(p.originalValue));

/** 124.98 → "124.98"; dengan tanda: 0.05 → "+0.05", -0.05 → "−0.05", 0 → "0". */
export function fmtNum(n, dec, { signed = false } = {}) {
  if (n === null || n === undefined || Number.isNaN(n)) return "-";
  const abs = Math.abs(n).toFixed(dec);
  if (!signed) return n < 0 ? `−${abs}` : abs;
  if (n === 0) return Number(0).toFixed(dec);
  return `${n < 0 ? "−" : "+"}${abs}`;
}

/** Rentang diterima: standard+min s.d. standard+max (dibulatkan supaya tidak muncul 124.94999). */
export function acceptedRange(p) {
  const dec = pointDecimals(p);
  const f = 10 ** dec;
  const lower = Math.round((p.standard + p.min) * f) / f;
  const upper = Math.round((p.standard + p.max) * f) / f;
  return { lower, upper, dec };
}

/** "2026-11-18T02:54:17Z" → "18 Nov 2026, 10:54" (zona waktu komputer pengguna). */
export function fmtDateTime(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * Posisi nilai ukur pada bar toleransi (0–100%). Bar menampilkan rentang diterima di tengah
 * dengan ruang di kiri-kanan, supaya nilai di luar toleransi tetap terlihat.
 */
export function tolerancePosition(p) {
  const { lower, upper } = acceptedRange(p);
  const span = upper - lower || Math.abs(p.standard) * 0.01 || 1;
  const min = lower - span * 0.5;
  const max = upper + span * 0.5;
  const pct = (v) => Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100));
  return { left: pct(lower), right: pct(upper), value: pct(p.value) };
}
