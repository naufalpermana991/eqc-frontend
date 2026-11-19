import { useRef, useState } from "react";
import Icon from "../Icon";

/**
 * Kotak upload: klik di mana saja atau drag & drop (Figma: File upload).
 * Hanya MEMILIH file → onFile(file). Validasi & proses dilakukan pemanggil.
 *
 *   <UploadDropzone onFile={handleFile} accept="image/jpeg,image/png" hint="JPG, JPEG or PNG (max. 5MB)" />
 */
export default function UploadDropzone({
  onFile,
  accept = "image/jpeg,image/png",
  hint = "JPG, JPEG or PNG (max. 5MB)",
  label = "Upload file",
  disabled = false,
  className = "",
}) {
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);
  const openPicker = () => !disabled && fileRef.current?.click();

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label={`${label}: click or drag and drop. ${hint}`}
      onClick={openPicker}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openPicker();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!disabled) onFile(e.dataTransfer.files?.[0]);
      }}
      className={`flex flex-col items-center gap-3 rounded-xl border px-6 py-4 text-center transition-colors focus:outline-none focus-visible:border-focus-border focus-visible:shadow-focus-primary ${
        disabled
          ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60"
          : dragging
            ? "cursor-pointer border-focus-border bg-checkbox-bg"
            : "cursor-pointer border-gray-200 hover:bg-gray-25"
      } ${className}`}
    >
      <span className="grid size-10 place-items-center rounded-lg border border-gray-200 bg-white shadow-xs">
        <Icon name="cloud-arrow-up" className="size-5 text-gray-600" />
      </span>
      <div className="text-sm text-gray-600">
        <span className="font-semibold text-checkbox-border">Click to upload</span> or drag and drop
        <p className="text-xs">{hint}</p>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        className="hidden"
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = ""; // supaya file yang sama bisa dipilih ulang
        }}
      />
    </div>
  );
}
