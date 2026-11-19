// Avatar inisial: huruf diambil dari nama, warna dipilih dari palet tetap
// berdasarkan hash nama. Nama yang sama → warna yang sama di semua halaman,
// jadi warna tidak perlu disimpan di database.

// Semua warna lolos WCAG AA untuk teks putih (kontras ≥ 5.4:1).
export const AVATAR_COLORS = [
  "#B42318", // red
  "#C4320A", // orange
  "#B54708", // amber
  "#027A48", // green
  "#0E7090", // cyan
  "#175CD3", // blue
  "#3538CD", // indigo
  "#6927DA", // purple
  "#C11574", // pink
  "#475467", // slate
];

export function getInitials(name = "") {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : words[0][1] ?? "";
  return (first + last).toUpperCase();
}

export function getAvatarColor(name = "") {
  const key = name.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
