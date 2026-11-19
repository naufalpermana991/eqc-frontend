// Data awal (seed) untuk mock API di services/userApi.js — dipakai saat localStorage masih kosong.
// photoUrl kosong → tampil avatar inisial (warna dari nama, lihat services/avatar.js).
import avatar from "../assets/avatar.png";

const seed = [
  ["MN-2248", "Darlene Robertson", "manager", "darlene"],
  ["SV-2443", "Darrell Steward", "supervisor", "darrel"],
  ["OP-2355", "Wade Warren", "operator", "warren", avatar],
  ["OP-2482", "Leslie Alexander", "operator", "alexander"],
  ["OP-2483", "Andi Mahendra", "operator", "andi.m"],
  ["SV-2444", "Siti Rahmawati", "supervisor", "siti.r"],
  ["OP-2484", "Budi Santoso", "operator", "budi"],
  ["OP-2485", "Rina Kartika", "operator", "rina.k"],
  ["MN-2249", "Hendra Wijaya", "manager", "hendra"],
  ["OP-2486", "Agus Salim", "operator", "agus"],
  ["OP-2487", "Dewi Lestari", "operator", "dewi.l"],
  ["SV-2445", "Yusuf Pratama", "supervisor", "yusuf"],
  ["OP-2488", "Fajar Nugroho", "operator", "fajar"],
  ["OP-2489", "Maya Sari", "operator", "maya"],
  ["OP-2490", "Rizky Ramadhan", "operator", "rizky"],
  ["OP-2491", "Putri Ayu", "operator", "putri"],
  ["SV-2446", "Eko Prasetyo", "supervisor", "eko"],
  ["OP-2492", "Nanda Saputra", "operator", "nanda"],
  ["OP-2493", "Lina Marlina", "operator", "lina"],
  ["OP-2494", "Taufik Hidayat", "operator", "taufik"],
  ["OP-2495", "Wulan Sari", "operator", "wulan"],
  ["OP-2496", "Irfan Hakim", "operator", "irfan"],
];

export const USERS = seed.map(([id, name, level, username, photoUrl = ""]) => ({
  id,
  name,
  level,
  username,
  photoUrl,
}));
