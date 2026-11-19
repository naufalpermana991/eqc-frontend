import { useEffect, useRef, useState } from "react";
import Button from "./ui/Button";
import Radio from "./ui/Radio";
import Checkbox from "./ui/Checkbox";
import {
  APPROVAL_OPTIONS,
  DATE_OPTIONS,
  DEFAULT_FILTER,
  countActiveFilters,
} from "../services/filter";

/**
 * Tombol Filter + popover (Figma: Prototype 1 → Checking history → Filter).
 * Pilihan disimpan sebagai draft; baru berlaku saat Apply. Reset langsung berlaku.
 *
 *   <FilterPopover value={filter} onChange={setFilter} />
 */
export default function FilterPopover({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef(null);

  const activeCount = countActiveFilters(value);
  const rangeInvalid =
    draft.date === "custom" && draft.dateFrom && draft.dateTo && draft.dateFrom > draft.dateTo;

  // Tutup saat klik di luar atau tekan Escape (pola sama dengan RowActions)
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

  const update = (patch) => setDraft((prev) => ({ ...prev, ...patch }));

  const toggleApproval = (key, on) =>
    setDraft((prev) => ({
      ...prev,
      approvals: on
        ? [...new Set([...prev.approvals, key])]
        : prev.approvals.filter((a) => a !== key),
    }));

  const apply = () => {
    if (rangeInvalid) return;
    onChange(draft);
    setOpen(false);
  };

  const reset = () => {
    setDraft(DEFAULT_FILTER);
    onChange(DEFAULT_FILTER);
  };

  const dateInputClass =
    "h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-input-text text-gray-900 shadow-xs focus:border-focus-border focus:outline-none focus:shadow-focus-primary";

  return (
    <div ref={ref} className="relative inline-block text-left">
      <Button icon="filter" aria-haspopup="dialog" aria-expanded={open} onClick={toggle}>
        Filter
        {activeCount > 0 && (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-xs font-medium text-white">
            {activeCount}
          </span>
        )}
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label="Filter"
          className="absolute right-0 top-full z-20 mt-2 w-[440px] rounded-lg border border-gray-100 bg-white shadow-lg"
        >
          <div className="grid grid-cols-2 gap-6 p-5">
            <fieldset>
              <legend className="mb-3 text-subtitle-1 text-gray-900">Checking date</legend>
              <div className="flex flex-col gap-3">
                {DATE_OPTIONS.map((o) => (
                  <Radio
                    key={o.value}
                    name="filter-date"
                    value={o.value}
                    checked={draft.date === o.value}
                    onChange={(v) => update({ date: v })}
                  >
                    {o.label}
                  </Radio>
                ))}
              </div>

              {draft.date === "custom" && (
                <div className="mt-3 flex flex-col gap-2">
                  <input
                    type="date"
                    aria-label="From date"
                    value={draft.dateFrom}
                    onChange={(e) => update({ dateFrom: e.target.value })}
                    className={dateInputClass}
                  />
                  <input
                    type="date"
                    aria-label="To date"
                    value={draft.dateTo}
                    onChange={(e) => update({ dateTo: e.target.value })}
                    className={dateInputClass}
                  />
                  {rangeInvalid && (
                    <p className="text-helper-text text-error-600">
                      Start date must be before end date.
                    </p>
                  )}
                </div>
              )}
            </fieldset>

            <fieldset>
              <legend className="mb-3 text-subtitle-1 text-gray-900">Approval</legend>
              <div className="flex flex-col gap-3">
                {APPROVAL_OPTIONS.map((o) => (
                  <label
                    key={o.value}
                    className="flex w-fit cursor-pointer items-center gap-2 text-body-2 text-gray-700"
                  >
                    <Checkbox
                      label={o.label}
                      checked={draft.approvals.includes(o.value)}
                      onChange={(on) => toggleApproval(o.value, on)}
                    />
                    {o.label}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="flex justify-end gap-2.5 border-t border-gray-200 px-5 py-4">
            <Button onClick={reset}>Reset</Button>
            {/* Primary: sama dengan tombol Login (Error/600) */}
            <button
              type="button"
              onClick={apply}
              disabled={rangeInvalid}
              className="inline-flex h-9 items-center rounded-lg bg-error-600 px-3.5 text-sm font-semibold text-white shadow-xs focus:outline-none focus-visible:shadow-focus-error enabled:hover:bg-error-700 disabled:cursor-not-allowed disabled:bg-brand-200"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
