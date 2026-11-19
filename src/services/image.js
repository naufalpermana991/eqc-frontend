// Validasi & kompres foto profil di browser sebelum dikirim ke backend.
// Backend tetap WAJIB validasi ulang (tipe file asli & ukuran).

export const PHOTO_TYPES = ["image/jpeg", "image/png"];
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024; // 5MB, sesuai Figma

export function validatePhoto(file) {
  if (!file) return "No file selected.";
  if (!PHOTO_TYPES.includes(file.type)) return "Only JPG, JPEG or PNG files are allowed.";
  if (file.size > PHOTO_MAX_BYTES) return "File is larger than 5MB.";
  return null;
}

/**
 * Crop tengah jadi persegi lalu resize (default 256×256), hasil JPEG.
 * Foto 5MB dari HP jadi ±20–40KB — cukup untuk avatar.
 */
export async function toSquareJpeg(file, size = 256, quality = 0.85) {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#FFFFFF"; // PNG transparan → latar putih
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
  bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to process image"))),
      "image/jpeg",
      quality,
    ),
  );
}

/**
 * Perkecil gambar TANPA crop (sisi terpanjang ≤ maxSide), hasil JPEG.
 * Dipakai untuk gambar produk/part — bentuk asli harus utuh.
 */
export async function toScaledJpeg(file, maxSide = 1024, quality = 0.82) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#FFFFFF"; // PNG transparan → latar putih
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to process image"))),
      "image/jpeg",
      quality,
    ),
  );
}

/** 204800 → "200 KB", 1572864 → "1.5 MB" */
export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
