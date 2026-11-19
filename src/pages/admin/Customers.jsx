import { useEffect, useMemo, useRef, useState } from "react";
import PageHeader from "../../components/PageHeader";
import RowActions from "../../components/RowActions";
import ConfirmDialog from "../../components/ConfirmDialog";
import EditCustomerModal from "../../components/EditCustomerModal";
import Button from "../../components/ui/Button";
import SearchInput from "../../components/ui/SearchInput";
import Pagination from "../../components/ui/Pagination";
import FormField from "../../components/ui/FormField";
import { inputClass } from "../../components/ui/inputStyles";
import {
  createCustomer,
  deleteCustomer,
  listCustomers,
  validateCustomerName,
} from "../../services/customerApi";
import { useToast } from "../../services/toast";

// Figma: UI Design 1 → Admin → Customer
// Atas: form Add customer. Bawah: Customer list (terbaru di baris paling atas).

const HIGHLIGHT_MS = 2500;

export default function Customers() {
  const toast = useToast();

  // ---- data ----
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    listCustomers()
      .then((list) => active && (setCustomers(list), setLoadError("")))
      .catch((err) => active && setLoadError(err.message || "Failed to load customers."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [reloadKey]);

  // ---- add form ----
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [saving, setSaving] = useState(false);
  const [highlightId, setHighlightId] = useState(null);
  const nameRef = useRef(null);

  async function onAdd(e) {
    e.preventDefault();
    const invalid = validateCustomerName(name);
    if (invalid) return setNameError(invalid);

    setSaving(true);
    try {
      const created = await createCustomer({ name });
      setCustomers((list) => [created, ...list]);
      setName("");
      // Pastikan customer baru terlihat: kosongkan pencarian, kembali ke halaman 1, sorot sebentar
      setQuery("");
      setPage(1);
      setHighlightId(created.id);
      setTimeout(() => setHighlightId((id) => (id === created.id ? null : id)), HIGHLIGHT_MS);
      toast.success(`${created.name} has been added.`);
      nameRef.current?.focus(); // siap input customer berikutnya
    } catch (err) {
      if (err.field === "name") setNameError(err.message);
      else toast.error(err.message || "Failed to add customer.");
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
    return q ? customers.filter((c) => c.name.toLowerCase().includes(q)) : customers;
  }, [customers, query]);

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
      await deleteCustomer(deleting.id);
      setCustomers((list) => list.filter((c) => c.id !== deleting.id));
      toast.success(`${deleting.name} has been deleted.`);
    } catch (err) {
      toast.error(err.message || "Failed to delete customer.");
    } finally {
      setDeleteBusy(false);
      setDeleting(null);
    }
  }

  return (
    <>
      <PageHeader title="Customer" description="Add and manage the customer" />

      {/* Add customer */}
      <section className="mt-5 rounded-xl bg-white p-6">
        <h2 className="text-h6 text-gray-900">Add customer</h2>
        <form onSubmit={onAdd} noValidate className="mt-5 flex items-start gap-4">
          <div className="flex-1">
            <FormField id="customer-name" label="Customer name" error={nameError}>
              <input
                ref={nameRef}
                id="customer-name"
                value={name}
                placeholder="Enter customer name"
                autoComplete="off"
                maxLength={120}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError("");
                }}
                aria-invalid={Boolean(nameError)}
                aria-describedby={nameError ? "customer-name-error" : undefined}
                className={inputClass(nameError)}
              />
            </FormField>
          </div>
          {/* mt-7 = tinggi label + gap, supaya tombol sejajar dengan input */}
          <button
            type="submit"
            disabled={!name.trim() || saving}
            className="mt-7 inline-flex h-12 min-w-[160px] items-center justify-center rounded-lg bg-error-600 px-5 text-base font-semibold text-white shadow-xs focus:outline-none focus-visible:shadow-focus-error enabled:hover:bg-error-700 disabled:cursor-not-allowed disabled:bg-brand-200"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </form>
      </section>

      {/* Customer list */}
      <section className="mt-6 rounded-xl bg-white p-6">
        <h2 className="text-h6 text-gray-900">Customer list</h2>

        <div className="mb-4 mt-5 flex flex-wrap items-center justify-between gap-3">
          <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} />
          {/* TODO: aksi Export (belum ada di backend) */}
          <Button icon="export">Export</Button>
        </div>

        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-[10%]" />
            <col className="w-[82%]" />
            <col className="w-[8%]" />
          </colgroup>
          <thead>
            <tr className="h-11 bg-gray-50 text-left text-table-head text-gray-600 [&>th]:font-medium [&>th]:whitespace-nowrap">
              <th className="pl-6 pr-4">No</th>
              <th className="px-4">Name</th>
              <th className="px-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="text-table-cell text-gray-900">
            {rows.map((c, i) => (
              <tr
                key={c.id}
                className={`h-[72px] border-b border-gray-200 transition-colors duration-700 ${
                  c.id === highlightId ? "bg-success-25" : ""
                }`}
              >
                <td className="pl-6 pr-4">{offset + i + 1}</td>
                <td className="truncate px-4">{c.name}</td>
                <td className="px-2 text-center">
                  <RowActions
                    items={[
                      { label: "Edit", onClick: () => setEditing(c) },
                      { label: "Delete", danger: true, onClick: () => setDeleting(c) },
                    ]}
                  />
                </td>
              </tr>
            ))}

            {loading && (
              <tr>
                <td colSpan={3} className="h-[72px] text-center text-gray-500" aria-live="polite">
                  Loading customers…
                </td>
              </tr>
            )}
            {!loading && loadError && (
              <tr>
                <td colSpan={3} className="h-[72px] text-center text-error-600">
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
                <td colSpan={3} className="h-[72px] text-center text-gray-500">
                  {query ? (
                    <>
                      No customer found{" · "}
                      <button
                        type="button"
                        onClick={() => { setQuery(""); setPage(1); }}
                        className="font-semibold text-primary hover:text-primary-hover"
                      >
                        Clear search
                      </button>
                    </>
                  ) : (
                    "No customer yet. Add one using the form above."
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
        <EditCustomerModal
          key={editing.id}
          customer={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setCustomers((list) => list.map((c) => (c.id === updated.id ? updated : c)));
            toast.success(`Customer renamed to ${updated.name}.`);
            setEditing(null);
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete customer"
          message="Are you sure you want to delete this customer?"
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
