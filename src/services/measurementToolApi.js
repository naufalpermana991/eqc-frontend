// =====================================================================
// API MEASUREMENT TOOL — backend Go.
//   listMeasurementTools()            → GET    /api/measurement-tools   (urut nama, untuk dropdown)
//   createMeasurementTool(payload)    → POST   /api/measurement-tools
//   updateMeasurementTool(id, data)   → PUT    /api/measurement-tools/:id
//   deleteMeasurementTool(id)         → DELETE /api/measurement-tools/:id  (ditolak kalau dipakai produk)
// Gambar diunggah dulu lewat uploadProductImage (POST /api/uploads), lalu URL-nya dikirim di payload.
// Ganti nama alat ukur otomatis tampil di semua produk (backend JOIN berdasarkan id).
// =====================================================================
import { ApiError, api } from "./api";

export { ApiError };

export const TOOL_NAME_MAX = 60;

const cleanName = (raw) => String(raw ?? "").trim().replace(/\s+/g, " ");

/** Validasi di form (backend memakai aturan yang sama). Return { name?, image? }. */
export function validateMeasurementTool({ name, image }) {
  const e = {};
  const clean = cleanName(name);
  if (!clean) e.name = "Measurement tool name is required.";
  else if (clean.length < 2) e.name = "Measurement tool name is too short.";
  else if (clean.length > TOOL_NAME_MAX) e.name = `Measurement tool name is too long (max ${TOOL_NAME_MAX} characters).`;
  if (!image) e.image = "Measurement tool image is required.";
  return e;
}

const path = (id) => `/measurement-tools/${encodeURIComponent(id)}`;

export const listMeasurementTools = () => api("/measurement-tools");

/** payload: { name, imageUrl, imageName, imageSize } */
export const createMeasurementTool = (payload) => api("/measurement-tools", { method: "POST", body: payload });
export const updateMeasurementTool = (id, payload) => api(path(id), { method: "PUT", body: payload });
export const deleteMeasurementTool = (id) => api(path(id), { method: "DELETE" });
