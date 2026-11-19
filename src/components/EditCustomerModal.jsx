import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon";
import Button from "./ui/Button";
import FormField from "./ui/FormField";
import { inputClass } from "./ui/inputStyles";
import { useDialogKeys } from "../services/useDialogKeys";
import { updateCustomer, validateCustomerName } from "../services/customerApi";

/**
 * Modal Edit customer (Figma: UI Design 1 → Admin → Edit customer).
 * Layout sama dengan Edit user: header + garis, field, garis + footer
 * (Reset all di kiri, Cancel & Save di kanan).
 * Render dengan key={customer.id}. onSaved(customerBaru) dipanggil setelah berhasil.
 */
export default function EditCustomerModal({ customer, onClose, onSaved }) {
  const [name, setName] = useState(customer.name);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const panelRef = useRef(null);
  const inputRef = useRef(null);

  const changed = name.trim().replace(/\s+/g, " ") !== customer.name;

  // Fokus ke field saat dibuka, kembalikan fokus ke tombol ⋯ saat ditutup
  useEffect(() => {
    const previous = document.activeElement;
    inputRef.current?.focus();
    return () => previous?.isConnected && previous.focus?.();
  }, []);

  useDialogKeys(panelRef, { onEscape: onClose, locked: saving });

  // Reset all = kembali ke nama awal customer
  function resetAll() {
    setName(customer.name);
    setError("");
    inputRef.current?.focus();
  }

  async function onSubmit(e) {
    e.preventDefault();
    const invalid = validateCustomerName(name);
    if (invalid) return setError(invalid);
    setSaving(true);
    try {
      onSaved(await updateCustomer(customer.id, { name }));
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
        aria-labelledby="edit-customer-title"
        aria-describedby="edit-customer-desc"
        onSubmit={onSubmit}
        noValidate
        className="flex max-h-full w-full max-w-[560px] flex-col overflow-hidden rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 pb-5 pt-6">
          <div>
            <h2 id="edit-customer-title" className="text-h6 text-gray-900">
              Edit customer
            </h2>
            <p id="edit-customer-desc" className="mt-1 text-body-1 text-gray-600">
              Edit form below to change customer data
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

        <div className="px-6 py-5">
          <FormField id="edit-customer-name" label="Customer name" error={error}>
            <input
              ref={inputRef}
              id="edit-customer-name"
              value={name}
              placeholder="Enter customer name"
              maxLength={120}
              autoComplete="off"
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "edit-customer-name-error" : undefined}
              className={inputClass(error)}
            />
          </FormField>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-gray-200 px-6 py-5">
          <button
            type="button"
            onClick={resetAll}
            disabled={!changed || saving}
            className="rounded-lg px-1 text-base font-semibold text-error-600 hover:text-error-700 focus:outline-none focus-visible:shadow-focus-error disabled:cursor-not-allowed disabled:text-gray-300"
          >
            Reset all
          </button>
          <div className="flex gap-3">
            <Button onClick={onClose} disabled={saving} className="h-12 px-5 text-base">
              Cancel
            </Button>
            <button
              type="submit"
              disabled={!changed || !name.trim() || saving}
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
