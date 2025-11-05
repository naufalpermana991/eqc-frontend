import { useEffect, useRef, useState } from "react";

function RowActions() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // tutup saat klik di luar
  useEffect(() => {
    const onDoc = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-md hover:bg-gray-100"
      >
        {/* ikon 3 titik */}
        <svg
          viewBox="0 0 20 20"
          className="h-5 w-5 text-gray-600"
          fill="currentColor"
        >
          <circle cx="4" cy="10" r="1.5" />
          <circle cx="10" cy="10" r="1.5" />
          <circle cx="16" cy="10" r="1.5" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-40 rounded-md border border-gray-200 bg-white shadow-lg z-10"
        >
          <button
            className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm hover:bg-gray-50"
            role="menuitem"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            Download
          </button>
        </div>
      )}
    </div>
  );
}

export default RowActions;
