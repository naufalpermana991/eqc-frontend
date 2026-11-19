import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon";
import { useDialogKeys } from "../services/useDialogKeys";

/**
 * Pop-up "Reject product checking data" (Figma: Manager → Reject pop up / Type message).
 * Ditumpuk di atas pop-up Product approval. Pesan untuk Supervisor WAJIB diisi supaya
 * yang memperbaiki tahu apa yang salah.
 *
 * Props: busy, onSubmit(message), onCancel(), recipient ("supervisor")
 */
const REJECT_MESSAGE_MAX = 500;

export default function RejectDialog({ busy = false, onSubmit, onCancel, recipient = "supervisor" }) {
  const panelRef = useRef(null);
  const textRef = useRef(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Fokus langsung ke kolom pesan; kembalikan fokus saat ditutup
  useEffect(() => {
    const previous = document.activeElement;
    textRef.current?.focus();
    return () => previous?.isConnected && previous.focus?.();
  }, []);

  useDialogKeys(panelRef, { onEscape: onCancel, locked: busy });

  function submit(e) {
    e.preventDefault();
    const text = message.trim();
    if (!text) {
      setError(`Please leave a message so the ${recipient} knows what to fix.`);
      textRef.current?.focus();
      return;
    }
    onSubmit(text);
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-700/60 p-4">
      <form
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="reject-title"
        aria-describedby="reject-desc"
        aria-busy={busy}
        onSubmit={submit}
        noValidate
        className="w-full max-w-[560px] rounded-xl bg-white p-6 shadow-xl"
      >
        <span className="grid size-16 place-items-center rounded-full bg-error-50" aria-hidden="true">
          <Icon name="exclamation-circle" className="size-7 text-error-500" />
        </span>

        <h2 id="reject-title" className="mt-5 text-h6 text-gray-900">
          Reject product checking data
        </h2>
        <p id="reject-desc" className="mt-1 text-body-1 text-gray-600">
          Are you sure you want to reject this product checking data?
        </p>

        <label htmlFor="reject-message" className="mt-6 block text-input-label text-gray-700">
          Leave message to {recipient}
        </label>
        <textarea
          ref={textRef}
          id="reject-message"
          rows={5}
          value={message}
          maxLength={REJECT_MESSAGE_MAX}
          placeholder="Type a message..."
          onChange={(e) => {
            setMessage(e.target.value);
            setError("");
          }}
          disabled={busy}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "reject-message-error" : undefined}
          className={`mt-1.5 block w-full resize-none rounded-lg border bg-white px-3.5 py-3 text-body-1 text-gray-900 shadow-xs placeholder:text-gray-500 focus:outline-none disabled:bg-gray-50 ${
            error
              ? "border-error-300 focus:shadow-focus-error"
              : "border-gray-300 focus:border-focus-border focus:shadow-focus-primary"
          }`}
        />
        <div className="mt-1.5 flex justify-between gap-3 text-helper-text">
          <span id="reject-message-error" className="text-error-600" role={error ? "alert" : undefined}>
            {error}
          </span>
          <span className="shrink-0 text-gray-500">
            {message.length}/{REJECT_MESSAGE_MAX}
          </span>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="inline-flex h-12 items-center rounded-lg border border-gray-300 bg-white px-5 text-base font-semibold text-gray-700 shadow-xs hover:bg-gray-50 focus:outline-none focus-visible:shadow-focus-gray disabled:cursor-not-allowed disabled:text-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-12 items-center rounded-lg bg-error-600 px-5 text-base font-semibold text-white shadow-xs focus:outline-none focus-visible:shadow-focus-error enabled:hover:bg-error-700 disabled:cursor-wait disabled:bg-brand-200"
          >
            {busy ? "Submitting…" : "Reject and Submit"}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
