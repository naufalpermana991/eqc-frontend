// Data awal (seed) hasil cek untuk mock API di services/inspectionApi.js.
// Bentuk = record inspection (lihat createInspection). Tanggal dibuat relatif ke hari ini
// supaya filter Today / Last 7 days / Last 30 days bisa dicoba.
//
// Operator: sebagian milik Wade Warren (OP-2355, akun "operator") supaya halaman
// Checking history operator ikut berisi; sisanya operator lain (hanya terlihat oleh admin).

import { PRODUCTS } from "./mockProducts";

const PRODUCT = PRODUCTS[0]; // Case Comp, Mission

/** Nilai ukur contoh: di dalam toleransi; kalau ng=true, titik ke-3 dibuat di luar toleransi. */
function samplePoints(i, ng) {
  const all = PRODUCT.tools.flatMap((t) => t.points.map((p) => ({ ...p, toolId: t.toolId, toolName: t.toolName })));
  return all.map((p, k) => {
    const span = p.max - p.min;
    const ratio = ((i * 7 + k * 3) % 10) / 10; // 0.0 – 0.9, deterministik
    let value = +(p.standard + p.min + span * ratio).toFixed(3);
    if (ng && k === 2) value = +(p.standard + p.max + span * 0.4).toFixed(3);
    const ok = value >= +(p.standard + p.min).toFixed(3) && value <= +(p.standard + p.max).toFixed(3);
    return { ...p, value, result: ok ? "OK" : "NG" };
  });
}

const OPERATORS = [
  { id: "OP-2355", name: "Wade Warren" },
  { id: "OP-2482", name: "Leslie Alexander" },
  { id: "OP-2483", name: "Andi Mahendra" },
];
const SUPERVISOR = "Darrell Steward"; // = akun "spv"
const MANAGER = "Darlene Robertson"; // = akun "manager"
const HOUR = 3600000;

export const INSPECTION_SEED = Array.from({ length: 48 }, (_, i) => {
  // i = 0 paling baru; tiap record mundur ±18 jam → 48 record ≈ 36 hari ke belakang
  const createdAt = new Date(Date.now() - (i * 18 + 2) * HOUR).toISOString();
  // i 0–3: belum diproses Supervisor (Figma: "-")
  // i 4–6: sudah di-approve Supervisor, menunggu Manager (Figma Manager: "Need to approve")
  const waiting = i < 4;
  const waitingManager = i >= 4 && i <= 6;
  const supRejected = !waiting && i % 11 === 7;
  const mgrRejected = !waiting && !supRejected && i % 9 === 4;
  return {
    id: `IC-${String(48 - i).padStart(5, "0")}`,
    customer: { id: "CS-012", name: "PT Sinar Alumsarana" },
    product: { id: PRODUCT.id, name: PRODUCT.name },
    operator: OPERATORS[i % 3 === 1 ? 1 : i % 3 === 2 ? 2 : 0],
    points: samplePoints(i, i % 13 === 5),
    result: i % 13 === 5 ? "NG" : "OK",
    supervisor: waiting
      ? null
      : {
          name: SUPERVISOR,
          status: supRejected ? "rejected" : "approved",
          at: new Date(Date.parse(createdAt) + HOUR).toISOString(), // 1 jam setelah dicek
        },
    manager:
      waiting || waitingManager || supRejected ? null : { name: MANAGER, status: mgrRejected ? "rejected" : "approved" },
    createdAt,
  };
});
