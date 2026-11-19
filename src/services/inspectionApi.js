// =====================================================================
// API HASIL CEK (inspection) — backend Go.
//   createInspection(payload)        → POST /api/inspections                 (operator)
//   listInspections()                → GET  /api/inspections                 (Checking history;
//                                       operator otomatis hanya melihat miliknya sendiri)
//   listPending(role)                → GET  /api/inspections?pending=supervisor|manager
//   decide(id, { role, status, ... }) → POST /api/inspections/:id/{supervisor|manager}-approval
//                                       { status, message?, values? }
//
// Spesifikasi (standard/min/max) DISALIN ke setiap hasil cek (snapshot) di server, supaya
// hasil lama tetap benar walau admin mengubah produknya kemudian.
// OK/NG dihitung ULANG di server — tampilan operator & supervisor hanya pratinjau.
// =====================================================================
import { ApiError, api, downloadFile } from "./api";
import { parseDecimal } from "./productSpec";

export { ApiError };

/** Isi nilai: "" → "Required", bukan angka → "Enter a number". Return { [rowKey]: pesan }. */
export function validateValues(rows, values) {
  const errors = {};
  for (const r of rows) {
    const n = parseDecimal(values[r.key]);
    if (n === null) errors[r.key] = "Required";
    else if (Number.isNaN(n)) errors[r.key] = "Enter a number";
  }
  return errors;
}

/**
 * payload: { customer: {id,name}, product: {id,name}, operator: {id,name},
 *            points: [{ toolId, toolName, name, standard, min, max, value }] }
 * Server memakai operator dari sesi login dan spesifikasi dari database; kalau spesifikasi
 * produk sudah diubah admin, server menolak (409) supaya nilai tidak masuk ke titik yang salah.
 */
export const createInspection = (payload) => api("/inspections", { method: "POST", body: payload });

/** Terbaru dulu. Untuk operator, server hanya mengembalikan hasil cek miliknya. */
export const listInspections = () => api("/inspections");

/** Satu hasil cek (halaman Inspection Record). Operator hanya bisa membuka miliknya. */
/** Inspection Record sebagai Excel (satu sheet per record). Mengembalikan nama file. */
export const exportInspections = (ids) =>
  downloadFile("/inspections/export", { body: { ids }, fallbackName: "Inspection Record.xlsx" });

/** Inspection Record sebagai PDF (format Formal, dibuat di server). Mengembalikan nama file. */
export const downloadInspectionPdf = (ids) =>
  downloadFile("/inspections/pdf", { body: { ids }, fallbackName: "Inspection Record.pdf" });

export const getInspection = (id) => api(`/inspections/${encodeURIComponent(id)}`);

/** Antrean approval untuk role ("supervisor" | "manager"). Terlama dulu. */
export const listPending = (role) => api(`/inspections?pending=${encodeURIComponent(role)}`);

/**
 * Keputusan approval.
 *   role    : "supervisor" | "manager"
 *   status  : "approved" | "rejected"
 *   message : wajib saat rejected (Supervisor → operator, Manager → supervisor)
 *   values  : (hanya Supervisor, opsional) { [indexTitik]: nilaiBaru } — koreksi nilai ukur.
 *             Nilai asli operator disimpan server di `originalValue`, OK/NG dihitung ulang.
 * Penyetuju diambil dari sesi login di server.
 */
export function decide(id, { role, status, message = "", values = {} }) {
  const body = { status, message };
  if (role === "supervisor" && Object.keys(values).length)
    body.values = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, String(v)]));
  return api(`/inspections/${encodeURIComponent(id)}/${role}-approval`, { method: "POST", body });
}

/** Record → baris tabel Checking history (bentuk yang dipakai services/filter.js). */
export const toHistoryRow = (r) => ({
  id: r.id,
  checkedAt: r.createdAt,
  customer: r.customer?.name ?? "-",
  productName: r.product?.name ?? "-",
  productNumber: r.product?.id ?? "-",
  operator: r.operator?.name ?? "-",
  result: r.result ?? null,
  supervisor: r.supervisor?.name ?? "",
  supervisorStatus: r.supervisor?.status ?? "pending",
  manager: r.manager?.name ?? "",
  managerStatus: r.manager?.status ?? "pending",
  supervisorMessage: r.supervisor?.message ?? "",
  retestOf: r.retestOf ?? "",
  retestedBy: r.retestedBy ?? "",
});
