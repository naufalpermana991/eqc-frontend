import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/PageHeader";
import RowActions from "../../components/RowActions";
import UserFilterPopover from "../../components/UserFilterPopover";
import EditUserModal from "../../components/EditUserModal";
import ConfirmDialog from "../../components/ConfirmDialog";
import Avatar from "../../components/ui/Avatar";
import Button from "../../components/ui/Button";
import SearchInput from "../../components/ui/SearchInput";
import Pagination from "../../components/ui/Pagination";
import { deleteUser, listUsers } from "../../services/userApi";
import { LEVEL_LABEL } from "../../config/userLevels";
import { useToast } from "../../services/toast";

// Figma: UI Design 1 → Admin → User list
// Kolom: User ID | Name (avatar + nama) | User level | Username | Action

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const toast = useToast();

  // Ambil data dari API (sementara: mock API di services/userApi.js)
  useEffect(() => {
    let active = true;
    listUsers()
      .then((list) => active && (setUsers(list), setLoadError("")))
      .catch((err) => active && setLoadError(err.message || "Failed to load users."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [reloadKey]);

  function retryLoad() {
    setLoading(true);
    setReloadKey((k) => k + 1);
  }

  async function confirmDelete() {
    setDeleteBusy(true);
    try {
      await deleteUser(deleting.id);
      setUsers((list) => list.filter((u) => u.id !== deleting.id));
      toast.success(`${deleting.name} (${deleting.id}) has been deleted.`);
    } catch (err) {
      toast.error(err.message || "Failed to delete user.");
    } finally {
      setDeleteBusy(false);
      setDeleting(null);
    }
  }
  const [query, setQuery] = useState("");
  const [levels, setLevels] = useState([]); // [] = semua level
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (levels.length && !levels.includes(u.level)) return false;
      if (!q) return true;
      return [u.id, u.name, u.username, LEVEL_LABEL[u.level]].some((v) =>
        v.toLowerCase().includes(q),
      );
    });
  }, [users, query, levels]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * pageSize, current * pageSize);

  const resetFilters = () => {
    setLevels([]);
    setQuery("");
    setPage(1);
  };

  return (
    <>
      <PageHeader title="User list" description="Manage user manager, supervisor, and operator" />
      <div className="mt-5"></div>
      <section className="rounded-xl bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} />
          <div className="flex gap-2.5">
            <UserFilterPopover value={levels} onChange={(l) => { setLevels(l); setPage(1); }} />
            {/* TODO: aksi Export (belum ada di backend) */}
            <Button icon="export">Export</Button>
          </div>
        </div>

        <table className="w-full table-fixed border-collapse">
          {/* Proporsi kolom dari Figma: 15 / 39 / 19 / 19 / 8 */}
          <colgroup>
            <col className="w-[15%]" />
            <col className="w-[39%]" />
            <col className="w-[19%]" />
            <col className="w-[19%]" />
            <col className="w-[8%]" />
          </colgroup>
          <thead>
            <tr className="h-11 bg-gray-50 text-left text-table-head text-gray-600 [&>th]:font-medium [&>th]:whitespace-nowrap">
              <th className="pl-6 pr-4">User ID</th>
              <th className="px-4">Name</th>
              <th className="px-4">User level</th>
              <th className="px-4">Username</th>
              <th className="px-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="text-table-cell text-gray-900">
            {rows.map((u) => (
              <tr key={u.id} className="h-[72px] border-b border-gray-200">
                <td className="pl-6 pr-4">{u.id}</td>
                <td className="px-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} src={u.photoUrl} size={40} />
                    <span className="truncate">{u.name}</span>
                  </div>
                </td>
                <td className="px-4">{LEVEL_LABEL[u.level]}</td>
                <td className="truncate px-4">{u.username}</td>
                <td className="px-2 text-center">
                  <RowActions
                    items={[
                      { label: "Edit", onClick: () => setEditing(u) },
                      { label: "Delete", danger: true, onClick: () => setDeleting(u) },
                    ]}
                  />
                </td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td colSpan={5} className="h-[72px] text-center text-gray-500" aria-live="polite">
                  Loading users…
                </td>
              </tr>
            )}
            {!loading && loadError && (
              <tr>
                <td colSpan={5} className="h-[72px] text-center text-error-600">
                  {loadError}{" · "}
                  <button type="button" onClick={retryLoad} className="font-semibold underline">
                    Try again
                  </button>
                </td>
              </tr>
            )}
            {!loading && !loadError && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="h-[72px] text-center text-gray-500">
                  No user found
                  {(levels.length > 0 || query) && (
                    <>
                      {" · "}
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="font-semibold text-primary hover:text-primary-hover"
                      >
                        Reset search & filter
                      </button>
                    </>
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
        <EditUserModal
          key={editing.id}
          user={editing}
          onClose={() => setEditing(null)}
          onSave={(updated) => {
            setUsers((list) => list.map((u) => (u.id === updated.id ? updated : u)));
            toast.success(`${updated.name} (${updated.id}) has been updated.`);
            setEditing(null);
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete user"
          message="Are you sure you want to delete this user?"
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
