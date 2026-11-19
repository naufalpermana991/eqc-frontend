import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";

/**
 * Tombol ⋯ + dropdown aksi per baris tabel.
 * Figma: Prototype 1 → Checking history → "Action menu" (120×88, 2 item @44px)
 *
 * Pemakaian:
 *   <RowActions items={[
 *     { label: "View details",  onClick: () => ... },
 *     { label: "Download file", onClick: () => ... },
 *   ]} />
 *
 * Pilihan sejenis bisa dijadikan satu baris (mis. format unduhan):
 *   { group: "Download as", options: [{ label: "PDF", onClick }, { label: "Excel", onClick }] }
 */
export default function RowActions({ items = [] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const triggerRef = useRef(null);

  // Tutup saat klik di luar menu atau tekan Escape
  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Row actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="rounded-md p-2 text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:shadow-focus-gray"
      >
        <Icon name="dots" className="size-5" />
      </button>

      {open && (
        <div
          role="menu"
          style={{ minWidth: 168 }}
          className="absolute -right-3 top-full z-20 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-lg"
        >
          {items.map((item, i) => {
            const pick = (fn) => {
              setOpen(false);
              triggerRef.current?.focus(); // fokus kembali ke tombol ⋯ (mis. setelah modal ditutup)
              fn?.();
            };
            if (item.group) {
              return (
                <div key={item.group} className={`px-3.5 py-2.5 ${i > 0 ? "border-t border-gray-100" : ""}`}>
                  <p className="mb-1.5 whitespace-nowrap text-xs text-gray-500">{item.group}</p>
                  <div className="flex gap-1.5">
                    {item.options.map((o) => (
                      <button
                        key={o.label}
                        type="button"
                        role="menuitem"
                        onClick={() => pick(o.onClick)}
                        className="h-8 flex-1 rounded-md border border-gray-200 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }
            return (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => pick(item.onClick)}
                className={`flex h-11 w-full items-center whitespace-nowrap px-3.5 text-left text-sm focus:outline-none ${
                  item.danger
                    ? "text-error-600 hover:bg-error-50 focus:bg-error-50"
                    : "text-gray-900 hover:bg-gray-50 focus:bg-gray-50"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
