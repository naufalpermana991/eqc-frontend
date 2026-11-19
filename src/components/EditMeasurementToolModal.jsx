import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon";
import Button from "./ui/Button";
import FormField from "./ui/FormField";
import ProductImageField from "./ProductImageField";
import { inputClass } from "./ui/inputStyles";
import { useDialogKeys } from "../services/useDialogKeys";
import { useProductImage } from "../services/useProductImage";
import { updateMeasurementTool, validateMeasurementTool } from "../services/measurementToolApi";

/**
 * Modal Edit measurement tool. Figma belum punya desainnya → mengikuti Edit customer
 * (header + garis, field, garis + footer: Reset all | Cancel & Save) ditambah field gambar.
 * Render dengan key={tool.id}. onSaved(toolBaru) dipanggil setelah berhasil.
 */
export default function EditMeasurementToolModal({ tool, onClose, onSaved }) {
  const img = useProductImage(tool.imageUrl ? { url: tool.imageUrl, name: tool.imageName, size: tool.imageSize } : null);
  const [name, setName] = useState(tool.name);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const panelRef = useRef(null);
  const inputRef = useRef(null);

  const nameChanged = name.trim().replace(/\s+/g, " ") !== tool.name;
  const dirty = nameChanged || img.changed;
  // Tool lama tanpa gambar boleh disimpan tanpa gambar; yang sudah punya gambar tidak boleh dihapus.
  const imageOk = img.ready || (!img.image && !tool.imageUrl);
  const canSave = dirty && name.trim() && imageOk && !saving;

  useEffect(() => {
    const previous = document.activeElement;
    inputRef.current?.focus();
    return () => previous?.isConnected && previous.focus?.();
  }, []);

  useDialogKeys(panelRef, { onEscape: onClose, locked: saving });

  function resetAll() {
    setName(tool.name);
    img.reset();
    setError("");
    setSubmitted(false);
    inputRef.current?.focus();
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    const invalid = validateMeasurementTool({ name, image: img.image?.url });
    if (invalid.name) return setError(invalid.name);
    if (!imageOk) return;
    setSaving(true);
    try {
      onSaved(
        await updateMeasurementTool(tool.id, {
          name,
          imageUrl: img.image?.url ?? "",
          imageName: img.image?.name ?? "",
          imageSize: img.image?.size ?? null,
        }),
      );
    } catch (err) {
      setError(err.message || "Failed to save changes.");
      setSaving(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-700/60 p-4">
      <form
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-tool-title"
        aria-describedby="edit-tool-desc"
        onSubmit={onSubmit}
        noValidate
        className="flex max-h-full w-full max-w-[560px] flex-col overflow-hidden rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 pb-5 pt-6">
          <div>
            <h2 id="edit-tool-title" className="text-h6 text-gray-900">
              Edit measurement tool
            </h2>
            <p id="edit-tool-desc" className="mt-1 text-body-1 text-gray-600">
              Edit form below to change measurement tool data
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus-visible:shadow-focus-gray"
          >
            <Icon name="x" className="size-6" />
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto px-6 py-5">
          <ProductImageField
            img={img}
            label="Measurement tool image"
            compact
            requiredError={submitted && tool.imageUrl ? "Measurement tool image is required." : ""}
          />
          <FormField id="edit-tool-name" label="Measurement tool name" error={error}>
            <input
              ref={inputRef}
              id="edit-tool-name"
              value={name}
              placeholder="Enter measurement tool name"
              maxLength={80}
              autoComplete="off"
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "edit-tool-name-error" : undefined}
              className={inputClass(error)}
            />
          </FormField>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-gray-200 px-6 py-5">
          <button
            type="button"
            onClick={resetAll}
            disabled={!dirty || saving}
            className="rounded-lg px-1 text-base font-semibold text-error-600 hover:text-error-700 focus:outline-none focus-visible:shadow-focus-error disabled:cursor-not-allowed disabled:text-gray-300"
          >
            Reset all
          </button>
          <div className="flex items-center gap-3">
            {img.uploading && <p className="text-sm text-gray-500">Uploading image…</p>}
            <Button onClick={onClose} disabled={saving} className="h-12 px-5 text-base">
              Cancel
            </Button>
            <button
              type="submit"
              disabled={!canSave}
              className="inline-flex h-12 items-center rounded-lg bg-error-600 px-5 text-base font-semibold text-white shadow-xs focus:outline-none focus-visible:shadow-focus-error enabled:hover:bg-error-700 disabled:cursor-not-allowed disabled:bg-brand-200"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </form>
    </div>,
    document.body,
  );
}
