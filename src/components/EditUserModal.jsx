import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon";
import UserFormFields from "./UserFormFields";
import ConfirmDialog from "./ConfirmDialog";
import Button from "./ui/Button";
import { useUserForm } from "../services/useUserForm";
import { buildUserFormData } from "../services/userForm";
import { updateUser } from "../services/userApi";

/**
 * Modal Edit user (Figma: UI Design 1 → Admin → Edit user).
 * Dibuka dari menu ⋯ → Edit user di User list. Render dengan key={user.id}.
 *
 * Beda dari Figma (disengaja):
 * - Password TIDAK diisi data lama (password disimpan sebagai hash, tidak bisa/boleh ditampilkan).
 *   Kosong = password tidak diubah.
 * - User id read-only.
 * - Reset all = kembalikan ke data awal user, bukan mengosongkan form.
 */
export default function EditUserModal({ user, onClose, onSave }) {
  const form = useUserForm(
    { fullName: user.name, level: user.level, username: user.username, photoUrl: user.photoUrl },
    { passwordRequired: false },
  );
  const panelRef = useRef(null);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Fokus ke field pertama saat dibuka, kembalikan fokus ke tombol ⋯ saat ditutup
  useEffect(() => {
    const previous = document.activeElement;
    panelRef.current?.querySelector("#edit-fullName")?.focus();
    return () => previous?.focus?.();
  }, []);

  // Escape menutup modal; Tab berputar di dalam modal (tidak lari ke halaman di belakang)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") return onClose();
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
  }, [onClose]);

  // Save → validasi dulu, kalau valid tampilkan pop-up konfirmasi
  function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.submit()) setConfirming(true);
  }

  // Dipanggil dari tombol Save di pop-up konfirmasi
  async function save() {
    setSaving(true);
    try {
      const updated = await updateUser(user.id, buildUserFormData(form.values, form.photo));
      onSave(updated); // modal ditutup oleh parent
    } catch (err) {
      setConfirming(false);
      if (err.field) form.setServerError(err.field, err.message);
      else setError(err.message || "Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-700/60 p-4">
      <form
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-user-title"
        aria-describedby="edit-user-desc"
        onSubmit={onSubmit}
        noValidate
        className="flex max-h-full w-full max-w-[560px] flex-col overflow-hidden rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 pb-5 pt-6">
          <div>
            <h2 id="edit-user-title" className="text-h6 text-gray-900">
              Edit user
            </h2>
            <p id="edit-user-desc" className="mt-1 text-body-1 text-gray-600">
              Edit form below to change user data
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus-visible:shadow-focus-gray"
          >
            <Icon name="x" className="size-6" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <UserFormFields
            form={form}
            userId={user.id}
            idPrefix="edit"
            passwordPlaceholder="Enter new password"
            passwordHint="Leave blank to keep the current password."
          />
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-gray-200 px-6 py-5">
          <button
            type="button"
            onClick={form.reset}
            disabled={!form.dirty}
            className="rounded-lg px-1 text-base font-semibold text-error-600 hover:text-error-700 focus:outline-none focus-visible:shadow-focus-error disabled:cursor-not-allowed disabled:text-gray-300"
          >
            Reset all
          </button>
          <div className="flex items-center gap-3">
            {error && (
              <p role="alert" className="max-w-[200px] text-sm text-error-600">
                {error}
              </p>
            )}
            <Button onClick={onClose} className="h-12 px-5 text-base">
              Cancel
            </Button>
            <button
              type="submit"
              disabled={!form.dirty || !form.filledRequired}
              className="inline-flex h-12 items-center rounded-lg bg-error-600 px-5 text-base font-semibold text-white shadow-xs focus:outline-none focus-visible:shadow-focus-error enabled:hover:bg-error-700 disabled:cursor-not-allowed disabled:bg-brand-200"
            >
              Save
            </button>
          </div>
        </div>
      </form>
      {confirming && (
        <ConfirmDialog
          title="Save changes"
          message="Are you sure you want to save changes to this user?"
          confirmLabel="Save"
          busy={saving}
          busyLabel="Saving…"
          onConfirm={save}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>,
    document.body,
  );
}
