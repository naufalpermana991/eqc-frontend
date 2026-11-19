import { useEffect, useMemo, useRef, useState } from "react";
import PageHeader from "../../components/PageHeader";
import RowActions from "../../components/RowActions";
import ConfirmDialog from "../../components/ConfirmDialog";
import EditMeasurementToolModal from "../../components/EditMeasurementToolModal";
import ProductImageField from "../../components/ProductImageField";
import Button from "../../components/ui/Button";
import SearchInput from "../../components/ui/SearchInput";
import Pagination from "../../components/ui/Pagination";
import FormField from "../../components/ui/FormField";
import { inputClass } from "../../components/ui/inputStyles";
import {
  createMeasurementTool,
  deleteMeasurementTool,
  listMeasurementTools,
  validateMeasurementTool,
} from "../../services/measurementToolApi";
import { useProductImage } from "../../services/useProductImage";
import { useToast } from "../../services/toast";

// Figma: UI Design 1 → Admin → Measurement tool (Default, Image drop, Image uploaded, Action menu, Delete)
// Atas: form Add measurement tool. Bawah: Measurement list (terbaru di baris paling atas).

const HIGHLIGHT_MS = 2500;
const newestFirst = (a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "");

export default function MeasurementTools() {
  const toast = useToast();

  // ---- data ----
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    listMeasurementTools()
      .then((list) => active && (setTools([...list].sort(newestFirst)), setLoadError("")))
      .catch((err) => active && setLoadError(err.message || "Failed to load measurement tools."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [reloadKey]);

  // ---- add form ----
  const img = useProductImage();
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [highlightId, setHighlightId] = useState(null);
  const nameRef = useRef(null);

  const canSave = name.trim() && img.ready && !saving;

  async function onAdd(e) {
    e.preventDefault();
    setSubmitted(true);
    const invalid = validateMeasurementTool({ name, image: img.image?.url });
    if (invalid.name) return setNameError(invalid.name);
    if (invalid.image || !img.ready) return;

    setSaving(true);
    try {
      const created = await createMeasurementTool({
        name,
        imageUrl: img.image.url,
        imageName: img.image.name,
        imageSize: img.image.size,
      });
      setTools((list) => [created, ...list]);
      setName("");
      img.clear();
      setSubmitted(false);
      // Pastikan tool baru terlihat: kosongkan pencarian, kembali ke halaman 1, sorot sebentar
      setQuery("");
      setPage(1);
      setHighlightId(created.id);
      setTimeout(() => setHighlightId((id) => (id === created.id ? null : id)), HIGHLIGHT_MS);
      toast.success(`${created.name} has been added.`);
    } catch (err) {
      if (err.field === "name") setNameError(err.message);
      else toast.error(err.message || "Failed to add measurement tool.");
    } finally {
      setSaving(false);
    }
  }

  // ---- list ----
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? tools.filter((t) => t.name.toLowerCase().includes(q)) : tools;
  }, [tools, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, totalPages);
  const offset = (current - 1) * pageSize;
  const rows = filtered.slice(offset, offset + pageSize);

  // ---- edit & delete ----
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  async function confirmDelete() {
    setDeleteBusy(true);
    try {
      await deleteMeasurementTool(deleting.id);
      setTools((list) => list.filter((t) => t.id !== deleting.id));
      toast.success(`${deleting.name} has been deleted.`);
    } catch (err) {
      toast.error(err.message || "Failed to delete measurement tool.");
    } finally {
      setDeleteBusy(false);
      setDeleting(null);
    }
  }

  return (
    <>
      <PageHeader title="Measurement tool" description="Add and manage measurement tool" />

      {/* Add measurement tool */}
      <section className="mt-5 rounded-xl bg-white p-6">
        <h2 className="text-h6 text-gray-900">Add measurement tool</h2>
        <form onSubmit={onAdd} noValidate className="mt-5 flex flex-col gap-5">
          <ProductImageField
            img={img}
            label="Measurement tool image"
            requiredError={submitted ? "Measurement tool image is required." : ""}
          />

          <FormField id="tool-name" label="Measurement tool name" error={nameError}>
            <input
              ref={nameRef}
              id="tool-name"
              value={name}
              placeholder="Enter measurement tool name"
              autoComplete="off"
              maxLength={80}
              onChange={(e) => {
                setName(e.target.value);
                setNameError("");
              }}
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? "tool-name-error" : undefined}
              className={inputClass(nameError)}
            />
          </FormField>

          <div className="flex items-center justify-end gap-4">
            {img.uploading && <p className="text-sm text-gray-500">Waiting for the image upload to finish…</p>}
            <button
              type="submit"
              disabled={!canSave}
              className="inline-flex h-12 min-w-[76px] items-center justify-center rounded-lg bg-error-600 px-5 text-base font-semibold text-white shadow-xs focus:outline-none focus-visible:shadow-focus-error enabled:hover:bg-error-700 disabled:cursor-not-allowed disabled:bg-brand-200"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </section>

      {/* Measurement list */}
      <section className="mt-6 rounded-xl bg-white p-6">
        <h2 className="text-h6 text-gray-900">Measurement list</h2>

        <div className="mb-4 mt-5 flex flex-wrap items-center justify-between gap-3">
          <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} />
          {/* TODO: aksi Export (belum ada di backend) */}
          <Button icon="export">Export</Button>
        </div>

        <table className="w-full table-fixed border-collapse">
          {/* Proporsi kolom dari Figma: 12 / 41 / 39 / 8 */}
          <colgroup>
            <col className="w-[12%]" />
            <col className="w-[41%]" />
            <col className="w-[39%]" />
            <col className="w-[8%]" />
          </colgroup>
          <thead>
            <tr className="h-11 bg-gray-50 text-left text-table-head text-gray-600 [&>th]:font-medium [&>th]:whitespace-nowrap">
              <th className="pl-6 pr-4">No</th>
              <th className="px-4">Measurement tool image</th>
              <th className="px-4">Measurement tool name</th>
              <th className="px-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="text-table-cell text-gray-900">
            {rows.map((t, i) => (
              <tr
                key={t.id}
                className={`h-[72px] border-b border-gray-200 transition-colors duration-700 ${
                  t.id === highlightId ? "bg-success-25" : ""
                }`}
              >
                <td className="pl-6 pr-4">{offset + i + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex h-12 w-[100px] items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-white">
                    {t.imageUrl ? (
                      <img src={t.imageUrl} alt={t.name} className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-xs text-gray-400">No image</span>
                    )}
                  </div>
                </td>
                <td className="truncate px-4" title={t.name}>
                  {t.name}
                </td>
                <td className="px-2 text-center">
                  <RowActions
                    items={[
                      { label: "Edit", onClick: () => setEditing(t) },
                      { label: "Delete", danger: true, onClick: () => setDeleting(t) },
                    ]}
                  />
                </td>
              </tr>
            ))}

            {loading && (
              <tr>
                <td colSpan={4} className="h-[72px] text-center text-gray-500" aria-live="polite">
                  Loading measurement tools…
                </td>
              </tr>
            )}
            {!loading && loadError && (
              <tr>
                <td colSpan={4} className="h-[72px] text-center text-error-600">
                  {loadError}{" · "}
                  <button
                    type="button"
                    onClick={() => { setLoading(true); setReloadKey((k) => k + 1); }}
                    className="font-semibold underline"
                  >
                    Try again
                  </button>
                </td>
              </tr>
            )}
            {!loading && !loadError && rows.length === 0 && (
              <tr>
                <td colSpan={4} className="h-[72px] text-center text-gray-500">
                  {query ? (
                    <>
                      No measurement tool found{" · "}
                      <button
                        type="button"
                        onClick={() => { setQuery(""); setPage(1); }}
                        className="font-semibold text-primary hover:text-primary-hover"
                      >
                        Clear search
                      </button>
                    </>
                  ) : (
                    "No measurement tool yet. Add one using the form above."
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="mt-5">
          <Pagination
            page={current}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
          />
        </div>
      </section>

      {editing && (
        <EditMeasurementToolModal
          key={editing.id}
          tool={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setTools((list) => list.map((t) => (t.id === updated.id ? updated : t)));
            toast.success(`${updated.name} has been updated.`);
            setEditing(null);
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete measurement tool"
          message="Are you sure you want to delete this measurement tool?"
          confirmLabel="Delete"
          busy={deleteBusy}
          busyLabel="Deleting…"
          onCancel={() => setDeleting(null)}
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
}
