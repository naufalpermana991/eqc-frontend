import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import ApprovalStatus from "../../components/ui/ApprovalStatus";
import ApprovalModal from "../../components/ApprovalModal";
import CheckingHistory from "./CheckingHistory";
import { decide, listPending } from "../../services/inspectionApi";
import { listProducts } from "../../services/productApi";
import { listMeasurementTools } from "../../services/measurementToolApi";
import { getCurrentUser } from "../../services/auth";
import { useToast } from "../../services/toast";

// Figma: UI Design 1 → Supervisor & Manager → Product approval. Satu halaman untuk dua role:
//   role="supervisor" : antre = belum diproses Supervisor. Pop-up bisa mengoreksi nilai ukur.
//   role="manager"    : antre = sudah di-approve Supervisor, menunggu Manager. Ada kolom Supervisor approval.
// Atas : "Need to approve" (terlama dulu). Bawah: Checking history (semua hasil cek).
// Tombol Approve di tabel membuka pop-up "Product approval" (cek data dulu → Approve / Reject).

const TITLE = {
  supervisor: "Supervisor product checking approval",
  manager: "Manager product checking approval",
};

const fmtDateTime = (iso) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-GB")} ${d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })}`;
};

export default function ApprovalPage({ role }) {
  const toast = useToast();
  const me = getCurrentUser();
  const isManager = role === "manager";
  const COLUMNS = ["Checking date", "Operator name", "Customer", "Product name", "Product number"].concat(
    isManager ? ["Supervisor approval"] : [],
  );

  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [openRecord, setOpenRecord] = useState(null);
  const [busy, setBusy] = useState(null); // "approved" | "rejected" | null
  const [master, setMaster] = useState({ products: {}, tools: {} }); // gambar produk & alat ukur
  const [historyKey, setHistoryKey] = useState(0); // muat ulang Checking history setelah approve
  const [params, setParams] = useSearchParams();
  const openId = params.get("open"); // dari notifikasi: langsung buka pop-up hasil cek ini

  useEffect(() => {
    let active = true;
    listPending(role)
      .then((list) => active && (setPending(list), setLoadError("")))
      .catch((err) => active && setLoadError(err.message || "Failed to load approvals."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [role, reloadKey]);

  // ?open=IC-00015 → buka pop-up kalau hasil cek itu ada di antrean, lalu hapus parameternya
  useEffect(() => {
    if (!openId || loading) return;
    const record = pending.find((r) => r.id === openId);
    if (record) setOpenRecord(record);
    else if (!loadError) toast.error(`${openId} is no longer waiting for your approval.`);
    setParams({}, { replace: true });
  }, [openId, loading, pending, loadError, setParams, toast]);

  useEffect(() => {
    let active = true;
    Promise.all([listProducts(), listMeasurementTools()])
      .then(([p, t]) => {
        if (!active) return;
        setMaster({
          products: Object.fromEntries(p.map((x) => [x.id, x])),
          tools: Object.fromEntries(t.map((x) => [x.id, x])),
        });
      })
      .catch(() => {}); // gambar opsional — pop-up tetap bisa dipakai tanpa gambar
    return () => {
      active = false;
    };
  }, []);

  async function submitDecision(status, message, values) {
    const r = openRecord;
    setBusy(status);
    try {
      await decide(r.id, { role, who: { id: me?.id, name: me?.name }, status, message, values });
      setPending((list) => list.filter((x) => x.id !== r.id));
      setHistoryKey((k) => k + 1);
      setOpenRecord(null);
      // Reject manager = dikembalikan ke supervisor (bukan ditolak final)
      const msg =
        isManager && status === "rejected"
          ? `${r.product?.name} checked by ${r.operator?.name} has been returned to the supervisor.`
          : `${r.product?.name} checked by ${r.operator?.name} has been ${status}.`;
      toast.success(msg);
    } catch (err) {
      toast.error(err.message || "Failed to save the decision.");
      setOpenRecord(null);
      setReloadKey((k) => k + 1);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <PageHeader title={TITLE[role]} description="Review and approve checking product data" />

      <section className="mt-5 rounded-xl bg-white p-6">
        <h2 className="mb-5 text-h6 text-gray-900">Need to approve</h2>

        <table className="w-full table-fixed border-collapse">
          {/* Proporsi kolom dari Figma (Manager: + Supervisor approval) */}
          {isManager ? (
            <colgroup>
              <col className="w-[20%]" />
              <col className="w-[13%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[15%]" />
              <col className="w-[10%]" />
            </colgroup>
          ) : (
            <colgroup>
              <col className="w-[20%]" />
              <col className="w-[17%]" />
              <col className="w-[17%]" />
              <col className="w-[17%]" />
              <col className="w-[17%]" />
              <col className="w-[12%]" />
            </colgroup>
          )}
          <thead>
            <tr className="h-11 bg-gray-50 text-left text-table-head text-gray-600 [&>th]:font-medium [&>th]:whitespace-nowrap">
              <th className="pl-6 pr-3">{COLUMNS[0]}</th>
              {COLUMNS.slice(1).map((c) => (
                <th key={c} className="px-3">{c}</th>
              ))}
              <th className="px-3">Action</th>
            </tr>
          </thead>
          <tbody className="text-table-cell text-gray-900">
            {pending.map((r) => (
              <tr key={r.id} className="h-[72px] border-b border-gray-200">
                <td className="py-3 pl-6 pr-3">
                  {fmtDateTime(r.createdAt)}
                  {!isManager && r.returned && (
                    <span className="mt-1 block w-fit rounded-full bg-amber-50 px-2 py-0.5 text-helper-text font-medium text-amber-700">
                      Returned by manager
                    </span>
                  )}
                  {r.retestOf && (
                    <span className="mt-1 block text-helper-text text-gray-500">Re-check of {r.retestOf}</span>
                  )}
                </td>
                <td className="px-3 py-3">{r.operator?.name}</td>
                <td className="px-3 py-3">{r.customer?.name}</td>
                <td className="px-3 py-3">{r.product?.name}</td>
                <td className="break-words px-3 py-3">{r.product?.id}</td>
                {isManager && (
                  <td className="px-3 py-3">
                    <ApprovalStatus name={r.supervisor?.name} status={r.supervisor?.status} />
                  </td>
                )}
                <td className="px-3 py-3">
                  <button
                    type="button"
                    onClick={() => setOpenRecord(r)}
                    aria-label={`Review and approve ${r.product?.name} checked by ${r.operator?.name} on ${fmtDateTime(r.createdAt)}`}
                    aria-haspopup="dialog"
                    className="inline-flex h-9 items-center rounded-lg bg-gray-900 px-3.5 text-sm font-semibold text-white shadow-xs hover:bg-gray-800 focus:outline-none focus-visible:shadow-focus-gray"
                  >
                    Approve
                  </button>
                </td>
              </tr>
            ))}

            {loading && (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="h-[72px] text-center text-gray-500" aria-live="polite">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && loadError && (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="h-[72px] text-center text-error-600">
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
            {!loading && !loadError && pending.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="h-[72px] text-center text-gray-500">
                  {isManager
                    ? "Nothing to approve. Results approved by a supervisor will appear here."
                    : "Nothing to approve. New results from operators will appear here."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <div className="mt-6">
        <CheckingHistory asSection refreshKey={historyKey} />
      </div>

      {openRecord && (
        <ApprovalModal
          key={openRecord.id}
          record={openRecord}
          role={role}
          productImage={master.products[openRecord.product?.id]?.imageUrl}
          tools={master.tools}
          busy={busy}
          onApprove={(values) => submitDecision("approved", "", values)}
          onReject={(message, values) => submitDecision("rejected", message, values)}
          onClose={() => setOpenRecord(null)}
        />
      )}
    </>
  );
}
