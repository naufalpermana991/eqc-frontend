import { useEffect } from "react";

/**
 * Keyboard untuk pop-up kecil (ConfirmDialog, SuccessDialog):
 * - Escape → onEscape (kecuali `locked`, mis. saat request berjalan)
 * - Tab berputar di dalam panel
 * Ditangani di fase capture lalu dihentikan, supaya modal di bawahnya (mis. Edit user)
 * tidak ikut tertutup / ikut mengatur fokus.
 */
export function useDialogKeys(panelRef, { onEscape, locked = false }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        if (!locked) onEscape?.();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      e.stopPropagation();
      const items = [...panelRef.current.querySelectorAll("button:not([disabled]), a[href]")];
      if (!items.length) return e.preventDefault();
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
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [panelRef, onEscape, locked]);
}
