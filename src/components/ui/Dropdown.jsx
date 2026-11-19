import { useEffect, useId, useRef, useState } from "react";
import Icon from "../Icon";

/**
 * Dropdown (Figma: Select customer / Select product).
 * Tombol 48px seperti input + menu custom (item 44px, hover gray-50).
 * Keyboard: ↓/↑ pindah, Enter/Spasi pilih, Esc/Tab tutup, Home/End.
 *
 * options: [{ value, label }]  · value: nilai terpilih ("" = belum)
 */
export default function Dropdown({ id, value, options, placeholder, onChange, disabled = false, label }) {
  const autoId = useId();
  const baseId = id ?? autoId;
  const listId = `${baseId}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef(null);
  const btnRef = useRef(null);
  const listRef = useRef(null);

  const selected = options.find((o) => o.value === value);

  // Klik di luar → tutup
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => !rootRef.current?.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Item aktif selalu terlihat
  useEffect(() => {
    if (open && active >= 0) listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function openMenu() {
    if (disabled || !options.length) return;
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  }

  function choose(i) {
    const opt = options[i];
    if (!opt) return;
    setOpen(false);
    btnRef.current?.focus();
    if (opt.value !== value) onChange(opt.value);
  }

  function onKeyDown(e) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    const last = options.length - 1;
    const moves = {
      ArrowDown: () => setActive((i) => Math.min(last, i + 1)),
      ArrowUp: () => setActive((i) => Math.max(0, i - 1)),
      Home: () => setActive(0),
      End: () => setActive(last),
      Enter: () => choose(active),
      " ": () => choose(active),
      Escape: () => setOpen(false),
    };
    if (moves[e.key]) {
      e.preventDefault();
      if (e.key === "Escape") e.stopPropagation();
      moves[e.key]();
    } else if (e.key === "Tab") setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={btnRef}
        id={baseId}
        type="button"
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        aria-label={label}
        className={`flex h-12 w-full items-center justify-between gap-3 rounded-lg border bg-white px-3.5 text-left text-body-1 shadow-xs focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50 ${
          open ? "border-focus-border shadow-focus-primary" : "border-gray-300 focus-visible:border-focus-border focus-visible:shadow-focus-primary"
        }`}
      >
        <span className={`truncate ${selected ? "text-gray-900" : "text-gray-500"}`}>
          {selected?.label ?? placeholder}
        </span>
        <Icon
          name="chevron-down"
          className={`size-5 shrink-0 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-labelledby={baseId}
          className="absolute left-0 top-full z-30 mt-1 max-h-72 w-max min-w-[220px] max-w-full overflow-y-auto overflow-x-hidden rounded-lg border border-gray-100 bg-white py-1 shadow-lg"
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={o.value === value}
              onMouseDown={(e) => e.preventDefault()} // fokus tetap di tombol
              onClick={() => choose(i)}
              onMouseEnter={() => setActive(i)}
              className={`flex min-h-11 cursor-pointer items-center whitespace-nowrap py-2.5 pl-3.5 pr-6 text-body-1 text-gray-900 ${
                i === active ? "bg-gray-50" : ""
              } ${o.value === value ? "font-medium" : ""}`}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
