import { useEffect, useRef, useState } from "react";
import { validatePhoto } from "./image";
import { uploadProductImage } from "./productApi";

/**
 * State gambar + upload dengan progres (Add/Edit product, Add/Edit measurement tool).
 * `initial` (opsional) = gambar yang sudah tersimpan: { url, name, size } → status "existing".
 *
 * image: { name, size, previewUrl, url, progress, status: "uploading"|"done"|"error"|"existing", error }
 */
export function useProductImage(initial = null) {
  const [start] = useState(() =>
    initial?.url
      ? { name: initial.name || "Image", size: initial.size ?? null, previewUrl: initial.url, url: initial.url, progress: 100, status: "existing" }
      : null,
  );
  const [image, setImage] = useState(start);
  const [error, setError] = useState("");
  const ctrl = useRef(null); // AbortController upload yang sedang berjalan
  const preview = useRef(""); // object URL preview lokal

  const release = () => {
    ctrl.current?.abort();
    ctrl.current = null;
    if (preview.current) URL.revokeObjectURL(preview.current);
    preview.current = "";
  };

  useEffect(() => release, []);

  async function handleFile(file) {
    setError("");
    const invalid = validatePhoto(file);
    if (invalid) return setError(invalid);

    release(); // file baru menggantikan file lama
    const previewUrl = URL.createObjectURL(file);
    preview.current = previewUrl;
    const controller = new AbortController();
    ctrl.current = controller;
    const mine = (fn) => setImage((img) => (img?.previewUrl === previewUrl ? fn(img) : img));
    setImage({ name: file.name, size: file.size, previewUrl, url: "", progress: 0, status: "uploading" });

    try {
      const res = await uploadProductImage(file, (progress) => mine((img) => ({ ...img, progress })), {
        signal: controller.signal,
      });
      mine((img) => ({ ...img, url: res.url, progress: 100, status: "done" }));
    } catch (err) {
      if (err.name === "AbortError") return; // dibatalkan user / diganti file lain
      mine((img) => ({ ...img, status: "error", error: err.message }));
    } finally {
      if (ctrl.current === controller) ctrl.current = null;
    }
  }

  return {
    image,
    error,
    handleFile,
    uploading: image?.status === "uploading",
    ready: image?.status === "done" || image?.status === "existing",
    changed: (image?.url ?? "") !== (start?.url ?? "") || (!image) !== (!start),
    clear() {
      release();
      setImage(null);
      setError("");
    },
    /** Kembali ke gambar awal (Add: kosong, Edit: gambar tersimpan). */
    reset() {
      release();
      setImage(start);
      setError("");
    },
  };
}
