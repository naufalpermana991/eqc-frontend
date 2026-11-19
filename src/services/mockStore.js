// =====================================================================
// Dasar MOCK API — dipakai userApi.js, customerApi.js, dst. sampai backend Go siap.
// Data disimpan di localStorage browser (hanya di browser & laptop ini, ±5MB).
// =====================================================================

const LATENCY_MS = 400; // simulasi jeda jaringan supaya state loading ikut teruji

// ApiError dipakai bersama dengan klien API sungguhan (services/api.js),
// supaya halaman cukup mengenal satu jenis error.
import { ApiError } from "./api";
export { ApiError };

export const wait = () => new Promise((resolve) => setTimeout(resolve, LATENCY_MS));

/**
 * Koleksi data di localStorage. Kalau kosong / rusak → pakai `seed`.
 *   const store = createStore("eqc_mock_users_v1", SEED_USERS);
 *   store.load() / store.save(list) / store.reset()
 */
export function createStore(key, seed) {
  return {
    load() {
      try {
        const raw = localStorage.getItem(key);
        if (raw) return JSON.parse(raw);
      } catch {
        /* data rusak → pakai data contoh */
      }
      return seed.map((item) => ({ ...item }));
    },
    save(list) {
      try {
        localStorage.setItem(key, JSON.stringify(list));
      } catch {
        throw new ApiError("Browser storage is full. Remove some data or reset the mock data.");
      }
    },
    reset() {
      localStorage.removeItem(key);
    },
  };
}

/** Bandingkan teks tanpa beda huruf besar/kecil & spasi berlebih. */
export const sameText = (a, b) =>
  String(a).trim().replace(/\s+/g, " ").toLowerCase() === String(b).trim().replace(/\s+/g, " ").toLowerCase();
