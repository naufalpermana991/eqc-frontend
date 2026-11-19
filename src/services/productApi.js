// =====================================================================
// API PRODUCT — backend Go.
//   uploadProductImage(file, onProgress) → POST   /api/uploads         (dengan progres upload)
//   isProductIdTaken(id)                 → GET    /api/products/:id    (404 = belum dipakai)
//   listProducts()                       → GET    /api/products
//   createProduct(payload)               → POST   /api/products
//   updateProduct(id, payload)           → PUT    /api/products/:id   (id tidak bisa diganti)
//   deleteProduct(id)                    → DELETE /api/products/:id   (ditolak kalau sudah punya hasil cek)
//
// Upload gambar dipakai juga oleh alat ukur (lihat useProductImage.js).
// =====================================================================
import { ApiError, api, uploadFile } from "./api";
import { toScaledJpeg } from "./image";

export { ApiError };

export const PRODUCT_ID_MAX = 50;

/** Validasi Step 1 di form (backend memakai aturan yang sama). Return { field: pesan }. */
export function validateProductDetails({ id, name, image }) {
  const e = {};
  const cleanId = String(id ?? "").trim();
  if (!cleanId) e.id = "Product id is required.";
  else if (cleanId.length > PRODUCT_ID_MAX) e.id = `Product id is too long (max ${PRODUCT_ID_MAX} characters).`;
  else if (!/^[A-Za-z0-9][A-Za-z0-9\-_./ ]*$/.test(cleanId))
    e.id = "Use letters, numbers, dash (-), underscore (_), dot (.) or slash (/).";

  if (!String(name ?? "").trim()) e.name = "Product name is required.";
  if (!image) e.image = "Product image is required.";
  return e;
}

const path = (id) => `/products/${encodeURIComponent(id)}`;

/**
 * Upload gambar dengan progres 0–100. Gambar diperkecil dulu (maks 1024px, JPEG)
 * supaya upload cepat dan hemat penyimpanan. Return { url, name, size }.
 */
export async function uploadProductImage(file, onProgress = () => {}, { signal } = {}) {
  const blob = await toScaledJpeg(file, 1024);
  if (signal?.aborted) throw new DOMException("Upload cancelled", "AbortError");
  const form = new FormData();
  form.append("file", blob, file.name.replace(/\.[^.]+$/, "") + ".jpg");
  const res = await uploadFile("/uploads", form, { onProgress, signal });
  return { url: res.url, name: file.name, size: file.size };
}

export async function isProductIdTaken(id) {
  try {
    await api(path(id));
    return true;
  } catch (err) {
    if (err.status === 404) return false;
    throw err;
  }
}

export const listProducts = () => api("/products");

/**
 * payload: { id, name, imageUrl, imageName, imageSize,
 *            tools: [{ toolId, toolName, points: [{ name, standard, min, max }] }] }
 */
export const createProduct = (payload) => api("/products", { method: "POST", body: payload });

/**
 * Ubah produk. Product id TIDAK bisa diganti. Hasil cek lama tidak terpengaruh,
 * karena setiap hasil cek menyimpan salinan spesifikasi saat diukur.
 */
export const updateProduct = (id, payload) => api(path(id), { method: "PUT", body: { ...payload, id } });

export const deleteProduct = (id) => api(path(id), { method: "DELETE" });
