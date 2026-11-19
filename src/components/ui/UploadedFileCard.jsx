import Icon from "../Icon";
import { formatFileSize } from "../../services/image";

/**
 * Kartu file setelah dipilih (Figma: Add part / product → Image uploaded).
 * Thumbnail + nama + ukuran + progress bar, tombol hapus di kanan atas.
 *
 * status: "uploading" | "done" | "error" | "existing" (gambar tersimpan → tanpa progress bar)
 */
export default function UploadedFileCard({ name, size, previewUrl, progress = 0, status, error, onRemove }) {
  const pct = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div
      className={`flex w-full max-w-[480px] items-start gap-4 rounded-xl border bg-white p-4 ${
        status === "error" ? "border-error-300" : "border-gray-200"
      }`}
    >
      <div className="flex h-12 w-[100px] shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-white">
        {previewUrl ? (
          <img src={previewUrl} alt="" className="max-h-full max-w-full object-contain" />
        ) : (
          <Icon name="cloud-arrow-up" className="size-5 text-gray-400" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-700" title={name}>
              {name}
            </p>
            {size ? <p className="text-sm text-gray-600">{formatFileSize(size)}</p> : null}
          </div>
          <button
            type="button"
            onClick={onRemove}
            aria-label={status === "uploading" ? `Cancel upload of ${name}` : `Remove ${name}`}
            className="-mr-1 -mt-1 rounded-lg p-1.5 text-gray-500 hover:bg-gray-50 hover:text-error-600 focus:outline-none focus-visible:shadow-focus-gray"
          >
            <Icon name="trash" className="size-5" />
          </button>
        </div>

        {status === "existing" ? null : status === "error" ? (
          <p role="alert" className="mt-2 text-helper-text text-error-600">
            {error || "Upload failed. Remove the file and try again."}
          </p>
        ) : (
          <div className="mt-2 flex items-center gap-3">
            <div
              role="progressbar"
              aria-label={`Uploading ${name}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100"
            >
              <div
                className="h-full rounded-full bg-checkbox-border transition-[width] duration-150"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-10 text-right text-sm font-medium text-gray-700">{pct}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
