// Data awal (seed) alat ukur untuk mock API di services/measurementToolApi.js.
// Hanya Dial gauge yang punya gambar contoh (assets/measurementtool.png = foto dial gauge),
// dan dibuat paling baru supaya muncul di baris paling atas.
import dialGaugeImg from "../assets/measurementtool.png";

const day = (n) => new Date(Date.UTC(2026, 9, n)).toISOString();

export const MEASUREMENT_TOOLS = [
  { id: "MT-001", name: "Caliper", imageUrl: "", createdAt: day(7) },
  { id: "MT-002", name: "Micrometer", imageUrl: "", createdAt: day(6) },
  { id: "MT-003", name: "Height gauge", imageUrl: "", createdAt: day(5) },
  { id: "MT-004", name: "Dial gauge", imageUrl: dialGaugeImg, imageName: "dial-gauge.png", imageSize: 40133, createdAt: day(8) },
  { id: "MT-005", name: "Pin gauge", imageUrl: "", createdAt: day(4) },
  { id: "MT-006", name: "Thread gauge", imageUrl: "", createdAt: day(3) },
  { id: "MT-007", name: "Bore gauge", imageUrl: "", createdAt: day(2) },
  { id: "MT-008", name: "CMM", imageUrl: "", createdAt: day(1) },
];
