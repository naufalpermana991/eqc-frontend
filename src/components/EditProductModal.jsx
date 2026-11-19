import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon";
import ConfirmDialog from "./ConfirmDialog";
import ProductImageField from "./ProductImageField";
import ProductToolsForm from "./ProductToolsForm";
import FormField from "./ui/FormField";
import Stepper from "./ui/Stepper";
import { inputClass } from "./ui/inputStyles";
import { updateProduct } from "../services/productApi";
import { groupsFromProduct, sameGroups } from "../services/productSpec";
import { useProductImage } from "../services/useProductImage";

const STEPS = ["Product details", "Checking items"];

/**
 * Modal Edit product, 2 langkah (Figma: Edit product 1 & 2).
 * Render dengan key={product.id}. onSaved(produkBaru) dipanggil setelah berhasil.
 *
 * Beda dari Figma (disengaja):
 * - Product id read-only — jadi rujukan Checking history.
 * - Save memakai konfirmasi (ubah toleransi = ubah aturan OK/NG).
 * - Reset all = kembali ke data awal produk.
 */
export default function EditProductModal({ product, tools, toolsLoading, onClose, onSaved }) {
  const [step, setStep] = useState(0);
  const panelRef = useRef(null);

  // ---- Step 1 ----
  const img = useProductImage({ url: product.imageUrl, name: product.imageName, size: product.imageSize });
  const [name, setName] = useState(product.name);
  const [nameError, setNameError] = useState("");
  const nameChanged = name.trim() !== product.name;
  const step1Dirty = nameChanged || img.changed;
  const canNext = name.trim() && img.ready;

  // ---- Step 2 ----
  const [baseline] = useState(() => groupsFromProduct(product));
  const [groups, setGroups] = useState(() => groupsFromProduct(product));
  const dirty = step1Dirty || !sameGroups(groups, baseline);

  // ---- Save (lewat konfirmasi) ----
  const [pendingTools, setPendingTools] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Fokus ke field nama saat dibuka, kembalikan fokus ke tombol ⋯ saat ditutup
  useEffect(() => {
    const previous = document.activeElement;
    panelRef.current?.querySelector("#edit-product-name")?.focus();
    return () => previous?.isConnected && previous.focus?.();
  }, []);

  // Escape menutup modal; Tab berputar di dalam modal.
  // (ConfirmDialog menangani Esc/Tab-nya sendiri lebih dulu, jadi modal ini tidak ikut tertutup.)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") return !saving && onClose();
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = [
        ...panelRef.current.querySelectorAll(
          'button:not([disabled]), input:not([disabled]):not([type="file"]), select, [tabindex="0"]',
        ),
      ];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  function onNext(e) {
    e.preventDefault();
    if (!name.trim()) return setNameError("Product name is required.");
    if (!img.ready) return;
    setStep(1);
  }

  function resetStep1() {
    setName(product.name);
    setNameError("");
    img.reset();
  }

  async function save() {
    setSaving(true);
    setSaveError("");
    try {
      const updated = await updateProduct(product.id, {
        name: name.trim(),
        imageUrl: img.image?.url,
        imageName: img.image?.name,
        imageSize: img.image?.size,
        tools: pendingTools,
      });
      onSaved(updated); // modal ditutup oleh parent
    } catch (err) {
      setPendingTools(null);
      if (err.field === "name" || err.field === "image") {
        setStep(0);
        if (err.field === "name") setNameError(err.message);
      }
      setSaveError(err.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  const stepper = <Stepper steps={STEPS} current={step} />;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-700/60 p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-product-title"
        aria-describedby="edit-product-desc"
        className="flex max-h-full w-full max-w-[880px] flex-col overflow-hidden rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 pb-4 pt-5">
          <div>
            <h2 id="edit-product-title" className="text-h6 text-gray-900">
              Edit product
            </h2>
            <p id="edit-product-desc" className="mt-0.5 text-body-2 text-gray-600">
              Edit form below to change product data
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus-visible:shadow-focus-gray"
          >
            <Icon name="x" className="size-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 pb-5 pt-4">
          {saveError && (
            <p role="alert" className="mb-4 rounded-lg border border-error-300 bg-error-25 px-4 py-3 text-sm text-error-700">
              {saveError}
            </p>
          )}

          {step === 0 ? (
            <form onSubmit={onNext} noValidate>
              {stepper}
              <div className="mt-4 flex flex-col gap-4">
                <ProductImageField img={img} requiredError="Product image is required." compact />

                <FormField id="edit-product-id" label="Product id" hint="Product id cannot be changed.">
                  <input id="edit-product-id" value={product.id} disabled className={inputClass(false, { size: "sm" })} />
                </FormField>

                <FormField id="edit-product-name" label="Product name" error={nameError}>
                  <input
                    id="edit-product-name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setNameError("");
                    }}
                    placeholder="Enter product name"
                    autoComplete="off"
                    aria-invalid={Boolean(nameError)}
                    aria-describedby={nameError ? "edit-product-name-error" : undefined}
                    className={inputClass(nameError, { size: "sm" })}
                  />
                </FormField>
              </div>

              <div className="sticky -bottom-5 z-10 -mx-6 -mb-5 mt-5 flex items-center justify-between gap-4 border-t border-gray-200 bg-white px-6 pb-5 pt-4">
                <button
                  type="button"
                  onClick={resetStep1}
                  disabled={!step1Dirty}
                  className="rounded-lg px-1 text-base font-semibold text-error-600 hover:text-error-700 focus:outline-none focus-visible:shadow-focus-error disabled:cursor-not-allowed disabled:text-gray-300"
                >
                  Reset all
                </button>
                <div className="flex items-center gap-4">
                  {img.uploading && <p className="text-sm text-gray-500">Waiting for the image upload to finish…</p>}
                  <button
                    type="submit"
                    disabled={!canNext}
                    className="inline-flex h-11 min-w-[100px] items-center justify-center rounded-lg bg-error-600 px-5 text-base font-semibold text-white shadow-xs focus:outline-none focus-visible:shadow-focus-error enabled:hover:bg-error-700 disabled:cursor-not-allowed disabled:bg-brand-200"
                  >
                    Next
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <ProductToolsForm
              bare
              headerLeft={stepper}
              baseline={baseline}
              groups={groups}
              setGroups={setGroups}
              tools={tools}
              toolsLoading={toolsLoading}
              saving={saving}
              extraDisabled={!dirty}
              onPrevious={() => setStep(0)}
              onSave={(toolsPayload) => {
                setSaveError("");
                setPendingTools(toolsPayload);
              }}
            />
          )}
        </div>
      </div>

      {pendingTools && (
        <ConfirmDialog
          title="Save changes"
          message="Are you sure you want to save changes to this product?"
          confirmLabel="Save"
          busy={saving}
          busyLabel="Saving…"
          onConfirm={save}
          onCancel={() => setPendingTools(null)}
        />
      )}
    </div>,
    document.body,
  );
}
