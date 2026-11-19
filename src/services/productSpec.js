// =====================================================================
// Aturan Step 2 "Measurement tool details" (Add part / product).
//
// Min & Max = TOLERANSI terhadap Standard (bukan batas absolut):
//   Standard 125, Min -0.05, Max +0.05  → diterima 124.95 – 125.05
//   Standard 6.5, Min 0,     Max 0.5    → diterima 6.5 – 7.0
//
// - Angka boleh pakai koma ("0,05") dan tanda "+" di depan.
// - Baris yang 4 kolomnya kosong & grup yang benar-benar kosong DIABAIKAN saat simpan.
// - Baris yang terisi sebagian = error.
// =====================================================================

// Pembuat grup & baris kosong (key unik untuk React list)
let seq = 0;
const nextKey = () => `k${++seq}`;
export const emptyRow = () => ({ key: nextKey(), name: "", standard: "", min: "", max: "" });
export const emptyGroup = () => ({ key: nextKey(), toolId: "", rows: [emptyRow()] });

const NUMBER_RE = /^[+-]?(\d+([.,]\d*)?|[.,]\d+)$/;

/** "0,05" → 0.05, "+0.05" → 0.05, "" → null, "abc" → NaN */
export function parseDecimal(raw) {
  const s = String(raw ?? "").trim().replace(/\s+/g, "");
  if (!s) return null;
  if (!NUMBER_RE.test(s)) return NaN;
  return Number(s.replace(",", "."));
}

const decimalsOf = (raw) => {
  const m = String(raw ?? "").trim().match(/[.,](\d+)$/);
  return m ? m[1].length : 0;
};

export const isRowEmpty = (r) => [r.name, r.standard, r.min, r.max].every((v) => !String(v ?? "").trim());

/** Rentang diterima untuk baris lengkap, atau null. Contoh: { lower: "124.95", upper: "125.05" } */
export function acceptedRange(row) {
  const std = parseDecimal(row.standard);
  const min = parseDecimal(row.min);
  const max = parseDecimal(row.max);
  if ([std, min, max].some((n) => n === null || Number.isNaN(n)) || min > max) return null;
  const dec = Math.max(decimalsOf(row.standard), decimalsOf(row.min), decimalsOf(row.max));
  return { lower: (std + min).toFixed(dec), upper: (std + max).toFixed(dec) };
}

/** Error satu baris: { name?, standard?, min?, max?, row? }. Baris kosong → {} */
export function validateRow(row) {
  if (isRowEmpty(row)) return {};
  const e = {};
  if (!String(row.name ?? "").trim()) e.name = "Required";
  for (const key of ["standard", "min", "max"]) {
    const n = parseDecimal(row[key]);
    if (n === null) e[key] = "Required";
    else if (Number.isNaN(n)) e[key] = "Enter a number";
  }
  const min = parseDecimal(row.min);
  const max = parseDecimal(row.max);
  if (!e.min && !e.max && min > max) e.row = "Min must be less than or equal to Max.";
  return e;
}

/**
 * Validasi semua grup.
 * Return { groups: [{ tool?, empty?, rows: [rowErrors] }], hasErrors, completeRows }
 */
export function validateTools(groups) {
  let hasErrors = false;
  let completeRows = 0;

  const result = groups.map((g) => {
    const rows = g.rows.map(validateRow);
    const filledRows = g.rows.filter((r) => !isRowEmpty(r));
    const ge = { rows };

    if (filledRows.length && !g.toolId) ge.tool = "Select a measurement tool.";
    if (g.toolId && !filledRows.length) ge.empty = "Add at least one checking point for this tool.";

    const rowsOk = rows.every((r) => !Object.keys(r).length);
    if (ge.tool || ge.empty || !rowsOk) hasErrors = true;
    if (g.toolId && rowsOk) completeRows += filledRows.length;
    return ge;
  });

  return { groups: result, hasErrors, completeRows };
}

/** Bentuk data yang dikirim ke API: grup & baris kosong dibuang, angka jadi Number. */
export function toPayload(groups, toolsById) {
  return groups
    .filter((g) => g.toolId)
    .map((g) => ({
      toolId: g.toolId,
      toolName: toolsById[g.toolId]?.name ?? g.toolId,
      points: g.rows
        .filter((r) => !isRowEmpty(r))
        .map((r) => ({
          name: r.name.trim(),
          standard: parseDecimal(r.standard),
          min: parseDecimal(r.min),
          max: parseDecimal(r.max),
        })),
    }))
    .filter((g) => g.points.length);
}

// ---------- Mode edit ----------

const numToText = (n) => (n === null || n === undefined || Number.isNaN(n) ? "" : String(n));

/** Data produk tersimpan → grup form (angka jadi teks, key baru). */
export function groupsFromProduct(product) {
  const groups = (product?.tools ?? []).map((t) => ({
    key: nextKey(),
    toolId: t.toolId,
    rows: (t.points?.length ? t.points : [{}]).map((p) => ({
      key: nextKey(),
      name: p.name ?? "",
      standard: numToText(p.standard),
      min: numToText(p.min),
      max: numToText(p.max),
    })),
  }));
  return groups.length ? groups : [emptyGroup()];
}

/** Salin grup dengan key baru (untuk Reset all). */
export const cloneGroups = (groups) =>
  groups.map((g) => ({ ...g, key: nextKey(), rows: g.rows.map((r) => ({ ...r, key: nextKey() })) }));

/** Sama isi (abaikan key & spasi di tepi) — untuk tahu ada perubahan atau tidak. */
export function sameGroups(a, b) {
  const norm = (gs) =>
    JSON.stringify(
      gs.map((g) => [g.toolId, g.rows.map((r) => [r.name, r.standard, r.min, r.max].map((v) => String(v ?? "").trim()))]),
    );
  return norm(a) === norm(b);
}

/** Ringkasan untuk tabel Product list. */
export function toolSummary(product) {
  const tools = product?.tools ?? [];
  return {
    toolNames: tools.map((t) => t.toolName).join(", "),
    pointCount: tools.reduce((n, t) => n + (t.points?.length ?? 0), 0),
  };
}

const isNum = (n) => n !== null && !Number.isNaN(n);

// ---------------------------------------------------------------------
// Peringatan spesifikasi (form admin) — TIDAK memblokir simpan.
// Min/Max adalah toleransi yang DITAMBAHKAN ke Standard. Kesalahan umum: admin mengisi
// batas absolut (mis. Standard 135, Max 135 → rentang jadi 135 – 270).
// Diperingatkan kalau |Min| atau |Max| ≥ 50% dari Standard (Standard ≠ 0).
// ---------------------------------------------------------------------
export function toleranceWarning(row) {
  const std = parseDecimal(row.standard);
  const min = parseDecimal(row.min);
  const max = parseDecimal(row.max);
  if (![std, min, max].every(isNum) || std === 0 || min > max) return null;
  const limit = Math.abs(std) * 0.5;
  if (Math.abs(min) >= limit || Math.abs(max) >= limit)
    return "Tolerance looks too large. Min/Max are added to Standard — check they are not absolute values.";
  return null;
}

// ---------------------------------------------------------------------
// Penilaian OK / NG — SATU-SATUNYA tempat aturan ini (halaman operator & mock API).
//   OK = standard + min ≤ nilai ≤ standard + max   (nilai yang pas di batas = OK, sesuai IRD Koza)
// ---------------------------------------------------------------------
/** "OK" | "NG" | null (nilai kosong/bukan angka, atau spesifikasi tidak lengkap). */
export function judge(measured, point) {
  const value = parseDecimal(measured);
  if (!isNum(value)) return null;
  const range = acceptedRange({
    standard: String(point?.standard ?? ""),
    min: String(point?.min ?? ""),
    max: String(point?.max ?? ""),
  });
  if (!range) return null;
  return value >= Number(range.lower) && value <= Number(range.upper) ? "OK" : "NG";
}

/** Hasil keseluruhan: null kalau ada yang belum dinilai, "NG" kalau ada satu saja NG. */
export const overallResult = (results) =>
  results.length && results.every(Boolean) ? (results.includes("NG") ? "NG" : "OK") : null;
