import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon";
import { useDialogKeys } from "../services/useDialogKeys";

/**
 * Pop-up konfirmasi sederhana (Figma: UI Design 1 → Admin → Delete user).
 * Judul + pesan + 2 tombol sama lebar: Cancel (sekunder) & aksi (merah).
 * Bisa ditumpuk di atas modal lain (mis. konfirmasi Save di Edit user).
 *
 *   {open && (
 *     <ConfirmDialog
 *       title="Delete user"
 *       message="Are you sure you want to delete this user?"
 *       confirmLabel="Delete"
 *       onConfirm={...}
 *       onCancel={...}
 *     />
 *   )}
 */
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  busy = false, // true saat request berjalan → tombol nonaktif, tidak bisa ditutup
  busyLabel = "Please wait…",
  onConfirm,
  onCancel,
}) {
  const panelRef = useRef(null);
  const cancelRef = useRef(null);

  // Fokus awal ke Cancel (pilihan aman), kembalikan fokus saat ditutup
  useEffect(() => {
    const previous = document.activeElement;
    cancelRef.current?.focus();
    return () => previous?.focus?.();
  }, []);

  useDialogKeys(panelRef, { onEscape: onCancel, locked: busy });

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-700/60 p-4">
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        aria-busy={busy}
        className="relative w-full max-w-[360px] rounded-xl bg-white p-6 shadow-xl"
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus-visible:shadow-focus-gray"
        >
          <Icon name="x" className="size-5" />
        </button>

        <h2 id="confirm-title" className="pr-8 text-subtitle-1 text-gray-900">
          {title}
        </h2>
        <p id="confirm-message" className="mt-1 text-body-2 text-gray-600">
          {message}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="h-11 rounded-lg border border-gray-300 bg-white text-base font-semibold text-gray-700 shadow-xs hover:bg-gray-50 focus:outline-none focus-visible:shadow-focus-gray disabled:cursor-not-allowed disabled:text-gray-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="h-11 rounded-lg bg-error-600 text-base font-semibold text-white shadow-xs enabled:hover:bg-error-700 focus:outline-none focus-visible:shadow-focus-error disabled:cursor-wait disabled:bg-brand-200"
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
