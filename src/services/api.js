// =====================================================================
// Klien API ke backend Go.
//   api("/customers")                                   → GET
//   api("/customers", { method: "POST", body: {...} })  → POST JSON
//   api("/users", { method: "POST", body: formData })   → POST multipart (FormData apa adanya)
//
// - Token login otomatis disisipkan (Authorization: Bearer ...).
// - Error dari server {error, field} → dilempar sebagai ApiError(message, field),
//   bentuk yang sama dengan mock API, jadi halaman tidak perlu diubah.
// - 401 (token kedaluwarsa/tidak valid) → sesi dihapus, kembali ke halaman login.
//
// Alamat backend: VITE_API_URL di file .env.local frontend
// (default http://localhost:8080/api).
// =====================================================================
import { getToken, logout } from "./auth";

const BASE_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8080/api").replace(/\/$/, "");

/** Error dari server. `field` diisi kalau error milik satu field form (mis. name). */
export class ApiError extends Error {
  constructor(message, field, status) {
    super(message);
    this.name = "ApiError";
    this.field = field;
    this.status = status;
  }
}

export async function api(path, { method = "GET", body, auth = true } = {}) {
  const isForm = body instanceof FormData; // browser mengisi Content-Type multipart sendiri
  const headers = {};
  if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";
  const token = auth ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined || isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Can't reach the server. Check your connection and try again.");
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401 && auth) {
      logout();
      window.location.assign("/login");
    }
    throw new ApiError(data?.error ?? `Request failed (${res.status}).`, data?.field, res.status);
  }
  return data;
}

/**
 * Upload file dengan progres 0–100. fetch() tidak bisa melaporkan progres upload,
 * jadi di sini memakai XMLHttpRequest. `signal` (AbortController) membatalkan upload.
 */
export function uploadFile(path, form, { onProgress = () => {}, signal } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE_URL}${path}`);
    const token = getToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.min(99, Math.round((e.loaded / e.total) * 100)));
    };
    xhr.onload = () => {
      let data = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        /* respons bukan JSON */
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        return resolve(data);
      }
      if (xhr.status === 401) {
        logout();
        window.location.assign("/login");
      }
      reject(new ApiError(data?.error ?? `Upload failed (${xhr.status}).`, data?.field, xhr.status));
    };
    xhr.onerror = () => reject(new ApiError("Can't reach the server. Check your connection and try again."));
    xhr.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"));
    signal?.addEventListener("abort", () => xhr.abort(), { once: true });

    xhr.send(form);
  });
}

/**
 * Unduh file dari backend (mis. Excel). Token ikut terkirim — karena itu tidak bisa
 * memakai <a href> biasa. Nama file diambil dari header Content-Disposition server.
 */
export async function downloadFile(path, { method = "POST", body, fallbackName = "download" } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError("Can't reach the server. Check your connection and try again.");
  }
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    if (res.status === 401) {
      logout();
      window.location.assign("/login");
    }
    throw new ApiError(data?.error ?? `Download failed (${res.status}).`, data?.field, res.status);
  }

  const name = /filename="?([^";]+)"?/i.exec(res.headers.get("Content-Disposition") ?? "")?.[1] ?? fallbackName;
  const url = URL.createObjectURL(await res.blob());
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return name;
}
