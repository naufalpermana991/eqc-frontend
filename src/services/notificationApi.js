// =====================================================================
// API NOTIFIKASI (lonceng di header) — backend Go.
//   listNotifications()   → GET  /api/notifications       { unread, items: [...] }
//   markRead(ids)         → POST /api/notifications/read  { ids }
//   markAllRead()         → POST /api/notifications/read  { all: true }
//   clearAll()            → DELETE /api/notifications     (hapus semua notifikasi milik sendiri)
//
// kind:
//   rejected_by_supervisor → untuk operator: hasil ceknya direject, perlu ukur ulang
//   returned_by_manager    → untuk supervisor: hasil cek yang dia approve dikembalikan manager
//   waiting_manager        → untuk manager: hasil cek disetujui supervisor, menunggu approval manager
// =====================================================================
import { api } from "./api";

export const listNotifications = () => api("/notifications");
export const markRead = (ids) => api("/notifications/read", { method: "POST", body: { ids } });
export const markAllRead = () => api("/notifications/read", { method: "POST", body: { all: true } });
export const clearAll = () => api("/notifications", { method: "DELETE" });

/** Halaman tujuan saat notifikasi diklik. */
export function notificationTarget(n) {
  const id = encodeURIComponent(n.inspectionId);
  if (n.kind === "returned_by_manager") return `/supervisor/approval?open=${id}`;
  if (n.kind === "waiting_manager") return `/manager/approval?open=${id}`;
  return `/operator/checking?retest=${id}`;
}

/** Kalimat judul notifikasi. */
export function notificationTitle(n) {
  if (n.kind === "returned_by_manager") return `${n.actorName} returned ${n.productName} to you`;
  if (n.kind === "waiting_manager") return `${n.actorName} approved ${n.productName} — waiting for your approval`;
  return `${n.actorName} rejected your check of ${n.productName}`;
}

/** Ikon & warna per jenis notifikasi. */
export const NOTIFICATION_STYLE = {
  rejected_by_supervisor: { icon: "x", cls: "bg-error-50 text-error-600" },
  returned_by_manager: { icon: "arrow-uturn-left", cls: "bg-amber-50 text-amber-700" },
  waiting_manager: { icon: "check", cls: "bg-success-50 text-success-600" },
};
