import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/PageHeader";
import RowActions from "../../components/RowActions";
import ConfirmDialog from "../../components/ConfirmDialog";
import EditProductModal from "../../components/EditProductModal";
import Button from "../../components/ui/Button";
import SearchInput from "../../components/ui/SearchInput";
import Pagination from "../../components/ui/Pagination";
import { deleteProduct, listProducts } from "../../services/productApi";
import { listMeasurementTools } from "../../services/measurementToolApi";
import { toolSummary } from "../../services/productSpec";
import { useToast } from "../../services/toast";

// Figma: UI Design 1 → Admin → Product list (Default, Action menu, Delete product, Edit product 1 & 2)
export default function ProductList() {
  const toast = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [tools, setTools] = useState([]);
  const [toolsLoading, setToolsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listProducts()
      .then((list) => active && (setProducts(list), setLoadError("")))
      .catch((err) => active && setLoadError(err.message || "Failed to load products."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [reloadKey]);

  // Daftar alat ukur untuk modal Edit
  useEffect(() => {
    let active = true;
    listMeasurementTools()
      .then((list) => active && setTools(list))
      .finally(() => active && setToolsLoading(false));
    return () => {
      active = false;
    };
  }, []);

  // ---- search & pagination ----
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      [p.id, p.name, toolSummary(p).toolNames].some((v) => v.toLowerCase().includes(q)),
    );
  }, [products, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * pageSize, current * pageSize);

  // ---- edit & delete ----
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  async function confirmDelete() {
    setDeleteBusy(true);
    try {
      await deleteProduct(deleting.id);
      setProducts((list) => list.filter((p) => p.id !== deleting.id));
      toast.success(`${deleting.name} (${deleting.id}) has been deleted.`);
    } catch (err) {
      toast.error(err.message || "Failed to delete product.");
    } finally {
      setDeleteBusy(false);
      setDeleting(null);
    }
  }

  return (
    <>
      <PageHeader title="Product list" description="Manage product list" />

      <section className="rounded-xl bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} />
          {/* TODO: aksi Export (belum ada di backend) */}
          <Button icon="export">Export</Button>
        </div>

        <table className="w-full table-fixed border-collapse">
          {/* Proporsi kolom dari Figma: 17 / 14 / 29 / 19 / 12 / 9 */}
          <colgroup>
            <col className="w-[17%]" />
            <col className="w-[14%]" />
            <col className="w-[29%]" />
            <col className="w-[19%]" />
            <col className="w-[12%]" />
            <col className="w-[9%]" />
          </colgroup>
          <thead>
            <tr className="h-11 bg-gray-50 text-left text-table-head text-gray-600 [&>th]:font-medium [&>th]:whitespace-nowrap">
              <th className="pl-6 pr-4">Product number</th>
              <th className="px-4">Product image</th>
              <th className="px-4">Product name</th>
              <th className="px-4">Measurement tool</th>
              <th className="px-4">Checking point</th>
              <th className="px-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="text-table-cell text-gray-900">
            {rows.map((p) => {
              const { toolNames, pointCount } = toolSummary(p);
              return (
                <tr key={p.id} className="h-[72px] border-b border-gray-200">
                  <td className="truncate pl-6 pr-4" title={p.id}>
                    {p.id}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex h-12 w-[100px] items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-white">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={`Product ${p.name}`} className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-xs text-gray-400">No image</span>
                      )}
                    </div>
                  </td>
                  <td className="truncate px-4" title={p.name}>
                    {p.name}
                  </td>
                  <td className="truncate px-4" title={toolNames}>
                    {toolNames || <span className="text-gray-400">–</span>}
                  </td>
                  <td className="px-4">{pointCount}</td>
                  <td className="px-2 text-center">
                    <RowActions
                      items={[
                        { label: "Edit", onClick: () => setEditing(p) },
                        { label: "Delete", danger: true, onClick: () => setDeleting(p) },
                      ]}
                    />
                  </td>
                </tr>
              );
            })}

            {loading && (
              <tr>
                <td colSpan={6} className="h-[72px] text-center text-gray-500" aria-live="polite">
                  Loading products…
                </td>
              </tr>
            )}
            {!loading && loadError && (
              <tr>
                <td colSpan={6} className="h-[72px] text-center text-error-600">
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
                <td colSpan={6} className="h-[72px] text-center text-gray-500">
                  {query ? (
                    <>
                      No product found{" · "}
                      <button
                        type="button"
                        onClick={() => { setQuery(""); setPage(1); }}
                        className="font-semibold text-primary hover:text-primary-hover"
                      >
                        Clear search
                      </button>
                    </>
                  ) : (
                    "No product yet."
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
        <EditProductModal
          key={editing.id}
          product={editing}
          tools={tools}
          toolsLoading={toolsLoading}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setProducts((list) => list.map((p) => (p.id === updated.id ? updated : p)));
            toast.success(`${updated.name} (${updated.id}) has been updated.`);
            setEditing(null);
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete product"
          message="Are you sure you want to delete this product?"
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
