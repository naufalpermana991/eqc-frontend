import { useState } from "react";
import Avatar from "./ui/Avatar";
import UploadDropzone from "./ui/UploadDropzone";
import Icon from "./Icon";
import { toSquareJpeg, validatePhoto } from "../services/image";

// Lingkaran pilihan foto (inisial / foto) dengan centang hijau saat terpilih
function PhotoOption({ selected, onSelect, label, disabled = false, title, children }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      title={title}
      disabled={disabled}
      onClick={onSelect}
      className={`relative rounded-full p-0.5 focus:outline-none focus-visible:shadow-focus-primary disabled:cursor-not-allowed ${
        selected ? "ring-2 ring-success-500" : "ring-2 ring-transparent enabled:hover:ring-gray-200"
      }`}
    >
      {children}
      {selected && (
        <span className="absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full border-2 border-white bg-success-500 text-white">
          <Icon name="check" className="size-3" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

/**
 * Photo profile (Figma: Add user / Edit user)
 * - Lingkaran 1: inisial dari nama (default)
 * - Lingkaran 2: hanya MENAMPILKAN & MEMILIH foto; upload lewat kotak di kanan
 */
export default function PhotoPicker({ name, photo, onModeChange, onUpload, onRemove }) {
  const [error, setError] = useState("");
  const hasPhoto = Boolean(photo.url);

  async function handleFile(file) {
    setError("");
    const err = validatePhoto(file);
    if (err) return setError(err);
    try {
      onUpload(await toSquareJpeg(file));
    } catch {
      setError("This image could not be read. Try another file.");
    }
  }

  const choose = (mode) => {
    setError("");
    onModeChange(mode);
  };

  return (
    <div>
      <p className="text-input-label text-gray-700">Photo profile</p>
      <div className="mt-3 flex flex-wrap items-center gap-6">
        <div role="radiogroup" aria-label="Photo profile" className="flex items-center gap-6">
          <PhotoOption
            label="Use initials"
            selected={photo.mode === "initials"}
            onSelect={() => choose("initials")}
          >
            <Avatar name={name} size={56} />
          </PhotoOption>

          <span className="text-body-1 text-gray-500">or</span>

          <PhotoOption
            label={hasPhoto ? "Use uploaded photo" : "No photo uploaded yet"}
            title={hasPhoto ? undefined : "Upload a photo in the box first"}
            disabled={!hasPhoto}
            selected={photo.mode === "upload"}
            onSelect={() => choose("upload")}
          >
            {hasPhoto ? (
              <Avatar name={name} src={photo.url} size={56} />
            ) : (
              <span className="grid size-14 place-items-center rounded-full border border-dashed border-gray-300 bg-gray-50 text-gray-400">
                <Icon name="user" className="size-6" />
              </span>
            )}
          </PhotoOption>
        </div>

        <div className="min-w-[240px] flex-1">
          <UploadDropzone onFile={handleFile} label="Upload photo" />
          {error && (
            <p role="alert" className="mt-1.5 text-helper-text text-error-600">
              {error}
            </p>
          )}
          {hasPhoto && (
            <button
              type="button"
              onClick={() => {
                setError("");
                onRemove();
              }}
              className="mt-1.5 block text-helper-text font-medium text-gray-600 hover:text-error-600"
            >
              Remove photo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
