import Button from "./ui/Button";
import Icon from "./Icon";
import { inputClass } from "./ui/inputStyles";
import { acceptedRange, isRowEmpty, toleranceWarning } from "../services/productSpec";

/**
 * Satu grup "Measurement tool" + tabel Checking point / Standard / Min / Max
 * (Figma: Add part / product → step 2). Dipakai berulang oleh AddProduct.
 *
 * Props:
 * - group: { key, toolId, rows: [{ key, name, standard, min, max }] }
 * - tools: daftar alat ukur; usedToolIds: tool yang sudah dipakai grup lain (dinonaktifkan)
 * - errors: hasil validateTools().groups[i]; showErrors: tampilkan error "wajib diisi"
 * - onToolChange(toolId), onRowChange(rowKey, field, value), onAddRow(), onRemoveRow(rowKey)
 * - onRemove: hapus grup (null = tombol tidak tampil)
 */
export default function MeasurementToolGroup({
  group,
  tools,
  usedToolIds,
  errors,
  showErrors,
  onToolChange,
  onRowChange,
  onAddRow,
  onRemoveRow,
  onRemove,
}) {
  const selectId = `tool-${group.key}`;
  const toolError = showErrors ? errors?.tool || errors?.empty : "";
  const onlyRow = group.rows.length === 1;

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={selectId} className="text-input-label text-gray-700">
          Measurement tool
        </label>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1.5 rounded-lg px-1 text-sm font-semibold text-gray-600 hover:text-error-600 focus:outline-none focus-visible:shadow-focus-gray"
          >
            <Icon name="trash" className="size-4" />
            Remove tool
          </button>
        )}
      </div>

      <span className="relative mt-1.5 block">
        <select
          id={selectId}
          value={group.toolId}
          onChange={(e) => onToolChange(e.target.value)}
          aria-invalid={Boolean(toolError)}
          aria-describedby={toolError ? `${selectId}-error` : undefined}
          className={`${inputClass(toolError, { muted: !group.toolId })} cursor-pointer appearance-none pr-10`}
        >
          <option value="" disabled>
            Select measurement tool
          </option>
          {tools.map((t) => (
            <option
              key={t.id}
              value={t.id}
              disabled={usedToolIds.includes(t.id)}
              className="text-gray-900"
            >
              {t.name}
              {usedToolIds.includes(t.id) ? " (already added)" : ""}
            </option>
          ))}
        </select>
        <Icon
          name="chevron-down"
          className="pointer-events-none absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-gray-500"
        />
      </span>
      {toolError && (
        <p id={`${selectId}-error`} className="mt-1.5 text-helper-text text-error-600">
          {toolError}
        </p>
      )}

      <table className="mt-5 w-full table-fixed border-collapse">
        {/* Proporsi kolom dari Figma: 40 / 17 / 17 / 17 / 9 */}
        <colgroup>
          <col className="w-[40%]" />
          <col className="w-[17%]" />
          <col className="w-[17%]" />
          <col className="w-[17%]" />
          <col className="w-[9%]" />
        </colgroup>
        <thead>
          <tr className="h-11 bg-gray-50 text-left text-table-head text-gray-600 [&>th]:font-medium">
            <th className="rounded-l-md pl-6 pr-3">Checking point</th>
            <th className="px-3">Standard</th>
            <th className="px-3">Min</th>
            <th className="px-3">Max</th>
            <th className="rounded-r-md px-2 text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {group.rows.map((row, i) => {
            const e = errors?.rows?.[i] ?? {};
            const fieldErr = (k) => (showErrors ? e[k] : "");
            const range = acceptedRange(row);
            const warning = toleranceWarning(row);
            const inputId = (k) => `point-${row.key}-${k}`;
            const cell = (k, placeholder, extra = {}) => (
              <>
                <input
                  id={inputId(k)}
                  value={row[k]}
                  onChange={(ev) => onRowChange(row.key, k, ev.target.value)}
                  placeholder={placeholder}
                  autoComplete="off"
                  aria-label={`${extra.label} (row ${i + 1})`}
                  aria-invalid={Boolean(fieldErr(k) || (extra.rowError && e.row))}
                  className={inputClass(fieldErr(k) || (extra.rowError && e.row), { size: "sm" })}
                  {...(extra.numeric ? { inputMode: "decimal" } : {})}
                />
                {fieldErr(k) && <p className="mt-1 text-helper-text text-error-600">{fieldErr(k)}</p>}
              </>
            );

            return (
              <tr key={row.key} className="border-b border-gray-200 align-top">
                <td className="py-3 pl-6 pr-3">
                  {cell("name", "Enter value", { label: "Checking point" })}
                  {e.row ? (
                    <p className="mt-1 text-helper-text text-error-600">{e.row}</p>
                  ) : (
                    range && (
                      <p className="mt-1 text-helper-text text-gray-500">
                        Accepted range: {range.lower} – {range.upper}
                      </p>
                    )
                  )}
                  {/* Peringatan, tidak memblokir simpan (warna amber: belum ada token warning di design system) */}
                  {!e.row && warning && <p className="mt-1 text-helper-text text-amber-700">⚠ {warning}</p>}
                </td>
                <td className="px-3 py-3">{cell("standard", "Enter value", { label: "Standard", numeric: true })}</td>
                <td className="px-3 py-3">
                  {cell("min", "Enter value", { label: "Min tolerance", numeric: true, rowError: true })}
                </td>
                <td className="px-3 py-3">
                  {cell("max", "Enter value", { label: "Max tolerance", numeric: true, rowError: true })}
                </td>
                <td className="px-2 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => onRemoveRow(row.key)}
                    disabled={onlyRow && isRowEmpty(row)}
                    aria-label={onlyRow ? `Clear row ${i + 1}` : `Delete row ${i + 1}`}
                    title={onlyRow ? "Clear row" : "Delete row"}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-50 hover:text-error-600 focus:outline-none focus-visible:shadow-focus-gray disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
                  >
                    <Icon name="trash" className="size-5" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-4 pl-6">
        <Button icon="plus" onClick={onAddRow}>
          Add
        </Button>
      </div>
    </div>
  );
}
