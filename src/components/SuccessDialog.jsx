import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon";
import { useDialogKeys } from "../services/useDialogKeys";

/**
 * Pop-up sukses dengan pilihan langkah berikutnya (mis. setelah Add user).
 * Gaya sama dengan ConfirmDialog; ikon centang hijau di atas judul.
 * Tidak hilang sendiri — dipakai untuk info yang perlu dibaca (mis. User id baru).
 *
 *   <SuccessDialog
 *     title="User created"
 *     message="..."
 *     secondaryLabel="Add another user" onSecondary={...}   // juga dipanggil saat Esc / X
 *     primaryLabel="View user list"     onPrimary={...}
 *   >{detail opsional}</SuccessDialog>
 */
export default function SuccessDialog({
  title,
  message,
  children,
  primaryLabel,
  onPrimary,
  secondaryLabel = "Close",
  onSecondary,
}) {
  const panelRef = useRef(null);
  const primaryRef = useRef(null);

  // Fokus ke aksi utama; kembalikan fokus saat ditutup
  useEffect(() => {
    const previous = document.activeElement;
    primaryRef.current?.focus();
    return () => previous?.isConnected && previous.focus?.();
  }, []);

  useDialogKeys(panelRef, { onEscape: onSecondary });

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-700/60 p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="success-title"
        aria-describedby="success-message"
        className="relative w-full max-w-[440px] rounded-xl bg-white p-6 shadow-xl"
      >
        <button
          type="button"
          onClick={onSecondary}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus-visible:shadow-focus-gray"
        >
          <Icon name="x" className="size-5" />
        </button>

        <span className="grid size-12 place-items-center rounded-full bg-success-100 text-success-600 ring-8 ring-success-50">
          <Icon name="check" className="size-6" strokeWidth={2} />
        </span>

        <h2 id="success-title" className="mt-5 text-subtitle-1 text-gray-900">
          {title}
        </h2>
        <p id="success-message" className="mt-1 text-body-2 text-gray-600">
          {message}
        </p>

        {children && <div className="mt-4">{children}</div>}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onSecondary}
            className="h-11 rounded-lg border border-gray-300 bg-white text-base font-semibold text-gray-700 shadow-xs hover:bg-gray-50 focus:outline-none focus-visible:shadow-focus-gray"
          >
            {secondaryLabel}
          </button>
          <button
            ref={primaryRef}
            type="button"
            onClick={onPrimary}
            className="h-11 rounded-lg bg-error-600 text-base font-semibold text-white shadow-xs hover:bg-error-700 focus:outline-none focus-visible:shadow-focus-error"
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
