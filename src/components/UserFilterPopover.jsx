import { useEffect, useRef, useState } from "react";
import Button from "./ui/Button";
import Checkbox from "./ui/Checkbox";
import { USER_LEVELS } from "../config/userLevels";

/**
 * Tombol Filter + popover untuk User list: filter berdasarkan User level.
 * Pola & style sama dengan FilterPopover (Checking history): draft → Apply, Reset langsung berlaku.
 * Satu user hanya punya satu level, jadi beberapa centang = tampilkan SEMUA level yang dicentang (OR).
 *
 *   <UserFilterPopover value={levels} onChange={setLevels} />   // levels: ["manager", ...]
 */
export default function UserFilterPopover({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef(null);

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

  const toggle = () => {
    if (!open) setDraft(value); // buang draft lama yang belum di-Apply
    setOpen((v) => !v);
  };

  const toggleLevel = (level, on) =>
    setDraft((prev) => (on ? [...new Set([...prev, level])] : prev.filter((l) => l !== level)));

  const apply = () => {
    onChange(draft);
    setOpen(false);
  };

  const reset = () => {
    setDraft([]);
    onChange([]);
  };

  return (
    <div ref={ref} className="relative inline-block text-left">
      <Button icon="filter" aria-haspopup="dialog" aria-expanded={open} onClick={toggle}>
        Filter
        {value.length > 0 && (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-xs font-medium text-white">
            {value.length}
          </span>
        )}
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label="Filter users"
          className="absolute right-0 top-full z-20 mt-2 w-[260px] rounded-lg border border-gray-100 bg-white shadow-lg"
        >
          <div className="p-5">
          <fieldset>
            <legend className="mb-3 text-subtitle-1 text-gray-900">User level</legend>
            <div className="flex flex-col gap-3">
              {USER_LEVELS.map((l) => (
                <label
                  key={l.value}
                  className="flex w-fit cursor-pointer items-center gap-2 text-body-2 text-gray-700"
                >
                  <Checkbox
                    label={l.label}
                    checked={draft.includes(l.value)}
                    onChange={(on) => toggleLevel(l.value, on)}
                  />
                  {l.label}
                </label>
              ))}
            </div>
          </fieldset>
          </div>

          <div className="flex justify-end gap-2.5 border-t border-gray-200 px-5 py-4">
            <Button onClick={reset}>Reset</Button>
            <button
              type="button"
              onClick={apply}
              className="inline-flex h-9 items-center rounded-lg bg-error-600 px-3.5 text-sm font-semibold text-white shadow-xs hover:bg-error-700 focus:outline-none focus-visible:shadow-focus-error"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
