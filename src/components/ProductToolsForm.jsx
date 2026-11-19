import { useState } from "react";
import Button from "./ui/Button";
import Icon from "./Icon";
import MeasurementToolGroup from "./MeasurementToolGroup";
import {
  cloneGroups,
  emptyGroup,
  emptyRow,
  isRowEmpty,
  sameGroups,
  toPayload,
  validateTools,
} from "../services/productSpec";

const focusLater = (id) => requestAnimationFrame(() => document.getElementById(id)?.focus());

/**
 * Step 2 "Add measurement tool details" (Figma: Add part / product → step 2).
 * State `groups` dipegang halaman (AddProduct) supaya tetap ada saat kembali ke step 1.
 *
 * - Tombol hitam "Add" (kanan atas) → tambah grup measurement tool
 * - Tombol "Add" di bawah tabel → tambah baris checking point
 * - Save → onSave(toolsPayload); grup/baris kosong diabaikan
 *
 * Opsi untuk mode Edit (modal):
 * - baseline: grup awal → Reset all kembali ke sini (default: 1 grup kosong)
 * - bare: tanpa kartu & judul (dipakai di dalam modal); headerLeft: isi kiri header (mis. Stepper)
 * - extraDisabled: tahan tombol Save (mis. belum ada perubahan)
 */
export default function ProductToolsForm({
  groups,
  setGroups,
  tools,
  toolsLoading,
  saving,
  onPrevious,
  onSave,
  baseline = null,
  bare = false,
  headerLeft = null,
  extraDisabled = false,
}) {
  const [submitted, setSubmitted] = useState(false);

  const validation = validateTools(groups);
  const toolsById = Object.fromEntries(tools.map((t) => [t.id, t]));
  const pristine = baseline
    ? sameGroups(groups, baseline)
    : groups.length === 1 && !groups[0].toolId && groups[0].rows.every(isRowEmpty);
  const canSave = validation.completeRows > 0 && !saving && !extraDisabled;

  const updateGroup = (key, fn) => setGroups((gs) => gs.map((g) => (g.key === key ? fn(g) : g)));

  function addGroup() {
    const g = emptyGroup();
    setGroups((gs) => [...gs, g]);
    focusLater(`tool-${g.key}`);
  }

  function removeGroup(key) {
    const idx = groups.findIndex((g) => g.key === key);
    const neighbour = groups[idx - 1] ?? groups[idx + 1];
    setGroups((gs) => gs.filter((g) => g.key !== key));
    if (neighbour) focusLater(`tool-${neighbour.key}`);
  }

  function addRow(groupKey) {
    const r = emptyRow();
    updateGroup(groupKey, (g) => ({ ...g, rows: [...g.rows, r] }));
    focusLater(`point-${r.key}-name`);
  }

  function removeRow(groupKey, rowKey) {
    updateGroup(groupKey, (g) =>
      g.rows.length === 1
        ? { ...g, rows: [emptyRow()] } // baris terakhir → dikosongkan, bukan dihapus
        : { ...g, rows: g.rows.filter((r) => r.key !== rowKey) },
    );
  }

  function onSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    if (validation.hasErrors || !validation.completeRows) {
      // fokus ke isian bermasalah yang pertama
      requestAnimationFrame(() => document.querySelector("form [aria-invalid='true']")?.focus());
      return;
    }
    onSave(toPayload(groups, toolsById));
  }

  return (
    <form onSubmit={onSubmit} noValidate className={bare ? "" : "rounded-xl bg-white p-6"}>
      <div className={`flex justify-between gap-4 ${bare ? "items-center" : "items-start"}`}>
        {headerLeft ?? (!bare && <h2 className="text-h6 text-gray-900">Add measurement tool details</h2>)}
        <button
          type="button"
          onClick={addGroup}
          disabled={saving || groups.length >= tools.length}
          title={groups.length >= tools.length ? "All measurement tools have been added" : undefined}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white shadow-xs hover:bg-gray-800 focus:outline-none focus-visible:shadow-focus-gray disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <Icon name="plus" className="size-5" />
          Add
        </button>
      </div>

      {toolsLoading ? (
        <p className="mt-6 text-sm text-gray-500" aria-live="polite">
          Loading measurement tools…
        </p>
      ) : (
        <div className="mt-6 flex flex-col">
          {groups.map((g, i) => (
            <div key={g.key} className={i > 0 ? "mt-8 border-t border-gray-200 pt-8" : ""}>
              <MeasurementToolGroup
                group={g}
                tools={tools}
                usedToolIds={groups.filter((o) => o.key !== g.key && o.toolId).map((o) => o.toolId)}
                errors={validation.groups[i]}
                showErrors={submitted}
                onToolChange={(toolId) => updateGroup(g.key, (x) => ({ ...x, toolId }))}
                onRowChange={(rowKey, field, value) =>
                  updateGroup(g.key, (x) => ({
                    ...x,
                    rows: x.rows.map((r) => (r.key === rowKey ? { ...r, [field]: value } : r)),
                  }))
                }
                onAddRow={() => addRow(g.key)}
                onRemoveRow={(rowKey) => removeRow(g.key, rowKey)}
                onRemove={groups.length > 1 ? () => removeGroup(g.key) : null}
              />
            </div>
          ))}
        </div>
      )}

      {submitted && !validation.completeRows && !validation.hasErrors && (
        <p role="alert" className="mt-4 text-helper-text text-error-600">
          Add at least one measurement tool with a checking point.
        </p>
      )}

      {/* Di modal (bare), footer menempel di bawah area scroll supaya Save selalu terlihat */}
      <div
        className={`flex items-center justify-between gap-4 border-t border-gray-200 ${
          bare ? "sticky -bottom-5 z-10 -mx-6 -mb-5 mt-6 bg-white px-6 pb-5 pt-4" : "mt-8 pt-6"
        }`}
      >
        <button
          type="button"
          onClick={() => {
            setGroups(baseline ? cloneGroups(baseline) : [emptyGroup()]);
            setSubmitted(false);
          }}
          disabled={pristine || saving}
          className="rounded-lg px-1 text-base font-semibold text-error-600 hover:text-error-700 focus:outline-none focus-visible:shadow-focus-error disabled:cursor-not-allowed disabled:text-gray-300"
        >
          Reset all
        </button>
        <div className="flex gap-3">
          <Button onClick={onPrevious} disabled={saving} className="h-12 px-5 text-base">
            Previous
          </Button>
          <button
            type="submit"
            disabled={!canSave}
            className="inline-flex h-12 min-w-[100px] items-center justify-center rounded-lg bg-error-600 px-5 text-base font-semibold text-white shadow-xs focus:outline-none focus-visible:shadow-focus-error enabled:hover:bg-error-700 disabled:cursor-not-allowed disabled:bg-brand-200"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </form>
  );
}
