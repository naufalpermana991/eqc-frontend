import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon";
import { ToastContext } from "../services/toast";

const DURATION_MS = 5000;
const MAX_VISIBLE = 3;

const VARIANTS = {
  success: { icon: "check", iconClass: "bg-success-100 text-success-600", role: "status" },
  error: { icon: "x", iconClass: "bg-error-100 text-error-600", role: "alert" },
};

// Satu toast: hilang sendiri setelah DURATION_MS, timer berhenti saat di-hover / difokus
function Toast({ toast, onDismiss }) {
  const v = VARIANTS[toast.type] ?? VARIANTS.success;
  const [paused, setPaused] = useState(false);
  const remaining = useRef(DURATION_MS);
  const startedAt = useRef(0);

  useEffect(() => {
    if (paused) return;
    startedAt.current = Date.now();
    const timer = setTimeout(() => onDismiss(toast.id), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - startedAt.current;
    };
  }, [paused, toast.id, onDismiss]);

  return (
    <div
      role={v.role}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="pointer-events-auto flex w-[360px] max-w-[calc(100vw-2rem)] items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-lg motion-safe:animate-[toast-in_160ms_ease-out]"
    >
      <span className={`grid size-8 shrink-0 place-items-center rounded-full ${v.iconClass}`}>
        <Icon name={v.icon} className="size-4" strokeWidth={2.5} />
      </span>
      <p className="flex-1 pt-1 text-sm text-gray-900">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="rounded-lg p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600 focus:outline-none focus-visible:shadow-focus-gray"
      >
        <Icon name="x" className="size-4" />
      </button>
    </div>
  );
}

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const show = useCallback((type, message) => {
    const id = nextId.current++;
    setToasts((list) => [...list, { id, type, message }].slice(-MAX_VISIBLE));
    return id;
  }, []);

  const api = useMemo(
    () => ({
      success: (message) => show("success", message),
      error: (message) => show("error", message),
      dismiss,
    }),
    [show, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div
          aria-label="Notifications"
          className="pointer-events-none fixed right-6 top-28 z-[70] flex flex-col items-end gap-3"
        >
          {toasts.map((t) => (
            <Toast key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
