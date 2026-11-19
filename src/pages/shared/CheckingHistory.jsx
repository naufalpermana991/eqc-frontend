import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import RowActions from "../../components/RowActions";
import Button from "../../components/ui/Button";
import Checkbox from "../../components/ui/Checkbox";
import SearchInput from "../../components/ui/SearchInput";
import Pagination from "../../components/ui/Pagination";
import ApprovalStatus from "../../components/ui/ApprovalStatus";
import FilterPopover from "../../components/FilterPopover";
import { DEFAULT_FILTER, countActiveFilters, filterRows } from "../../services/filter";
import { downloadInspectionPdf, exportInspections, listInspections, toHistoryRow } from "../../services/inspectionApi";
import { useToast } from "../../services/toast";
import { getCurrentUser } from "../../services/auth";

// Figma: UI Design 1 → Admin → Checking history (127:14254) & Operator → Checking history.
// Satu halaman untuk dua role:
//   scope="all"  (Admin)    → semua hasil cek
//   scope="mine" (Operator) → hanya hasil cek milik operator yang login
// asSection: dipakai sebagai kartu di halaman lain (Manager approval) → judul "Checking history"
//   di dalam kartu, tanpa PageHeader. refreshKey: ganti nilainya untuk memuat ulang data.
// Format tanggal di Figma: 09/06/2024 + 08:30:20 AM (DD/MM/YYYY — konfirmasi ke desainer)
const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-GB");
const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

const COLUMNS = [
  "Checking date",
  "Customer",
  "Product name",
  "Product number",
  "Supervisor approval",
  "Manager approval",
];

export default function CheckingHistory({ scope = "all", asSection = false, refreshKey = 0 }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    const operatorId = scope === "mine" ? getCurrentUser()?.id ?? "-" : undefined;
    listInspections({ operatorId })
      .then((list) => active && (setData(list.map(toHistoryRow)), setLoadError("")))
      .catch((err) => active && setLoadError(err.message || "Failed to load checking history."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [scope, reloadKey, refreshKey]);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(DEFAULT_FILTER);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [selected, setSelected] = useState(() => new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const byFilter = filterRows(data, filter);
    if (!q) return byFilter;
    return byFilter.filter((r) =>
      [r.customer, r.productName, r.productNumber, r.supervisor, r.manager, r.operator]
        .some((v) => v.toLowerCase().includes(q)),
    );
  }, [data, query, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * pageSize, current * pageSize);

  // Hanya hitung baris terpilih yang masih lolos search/filter,
  // supaya file yang tersembunyi tidak ikut ter-download diam-diam.
  const selectedRows = filtered.filter((r) => selected.has(r.id));
  const selectedCount = selectedRows.length;

  // Laporan (Inspection Record) dibuka di tab baru dan langsung masuk dialog cetak → "Save as PDF".
  // Beberapa baris terpilih → satu PDF, satu halaman per hasil cek.
  const reportUrl = (ids) => `/report/${ids.map(encodeURIComponent).join(",")}`;


  // Unduh Inspection Record (PDF / Excel) untuk id yang diberikan — file dibuat di server.
  // Tombol Export → semua baris yang lolos search/filter (semua halaman).
  // Download → baris terpilih / satu baris.
  async function download(fn, ids) {
    if (ids.length === 0 || exporting) return;
    setExporting(true);
    try {
      await fn(ids);
    } catch (err) {
      toast.error(err.message || "Failed to download.");
    } finally {
      setExporting(false);
    }
  }
  const downloadPdf = (ids) => download(downloadInspectionPdf, ids);
  const downloadExcel = (ids) => download(exportInspections, ids);

  const allOnPage = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const someOnPage = rows.some((r) => selected.has(r.id));

  function toggleRow(id, on) {
    setSelected((prev) => {
      const next = new Set(prev);
      on ? next.add(id) : next.delete(id);
      return next;
    });
  }
  function toggleAll(on) {
    setSelected((prev) => {
      const next = new Set(prev);
      rows.forEach((r) => (on ? next.add(r.id) : next.delete(r.id)));
      return next;
    });
  }

  return (
    <>
      {!asSection && (
        <>
          <PageHeader
            title="Checking history"
            description="Track product checking by operator and approval by supervisor & manager"
          />
          <div className="mt-5"></div>
        </>
      )}
      <section className="rounded-xl bg-white p-6">
        {asSection && <h2 className="mb-5 text-h6 text-gray-900">Checking history</h2>}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} />
            {selectedCount > 0 && (
              <DownloadMenu
                label={exporting ? "Preparing…" : `Download ${selectedCount} ${selectedCount === 1 ? "file" : "files"}`}
                disabled={exporting}
                onPdf={() => downloadPdf(selectedRows.map((r) => r.id))}
                onExcel={() => downloadExcel(selectedRows.map((r) => r.id))}
              />
            )}
          </div>
          <div className="flex gap-2.5">
            <FilterPopover value={filter} onChange={(f) => { setFilter(f); setPage(1); }} />
            <Button
              icon="export"
              onClick={() => downloadExcel(filtered.map((r) => r.id))}
              disabled={loading || exporting || filtered.length === 0}
              title={`Export ${filtered.length} ${filtered.length === 1 ? "record" : "records"} to Excel (one sheet per record)`}
            >
              {exporting ? "Exporting…" : "Export"}
            </Button>
          </div>
        </div>

        <table className="w-full table-fixed border-collapse">
          {/* Lebar kolom dalam % (proporsi Figma 1440px: 169 / 161×5 / 75) → tabel selalu muat di card */}
          <colgroup>
            <col className="w-[16%]" />
            {COLUMNS.slice(1).map((c) => <col key={c} className="w-[15.4%]" />)}
            <col className="w-[7%]" />
          </colgroup>
          <thead>
            <tr className="h-11 bg-gray-50 text-left text-table-head text-gray-600 [&>th]:font-medium [&>th]:whitespace-nowrap">
              <th className="pl-6 pr-2">
                <div className="flex items-center gap-2">
                  <Checkbox label="Select all on this page" checked={allOnPage}
                    indeterminate={someOnPage && !allOnPage} onChange={toggleAll} />
                  {COLUMNS[0]}
                </div>
              </th>
              {COLUMNS.slice(1).map((c) => <th key={c} className="px-4">{c}</th>)}
              <th className="px-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="text-table-cell text-gray-900">
            {rows.map((r) => (
              <tr
                key={r.id}
                className={`h-[72px] border-b border-gray-200 ${selected.has(r.id) ? "bg-gray-50" : ""}`}
              >
                <td className="pl-6 pr-2">
                  <div className="flex items-center gap-2">
                    <Checkbox label={`Select row ${r.id}`} checked={selected.has(r.id)}
                      onChange={(on) => toggleRow(r.id, on)} />
                    <span>{fmtDate(r.checkedAt)}<br />{fmtTime(r.checkedAt)}</span>
                  </div>
                </td>
                <td className="px-4">{r.customer}</td>
                <td className="px-4">{r.productName}</td>
                <td className="break-words px-4">{r.productNumber}</td>
                <td className="px-4 py-3">
                  <ApprovalStatus name={r.supervisor} status={r.supervisorStatus} />
                  {/* Operator: pesan reject supervisor & status ukur ulang */}
                  {scope === "mine" && r.supervisorStatus === "rejected" && (
                    <p className="mt-1 line-clamp-2 text-helper-text text-gray-600" title={r.supervisorMessage}>
                      {r.retestedBy ? `Measured again · ${r.retestedBy}` : `“${r.supervisorMessage}”`}
                    </p>
                  )}
                </td>
                <td className="px-4"><ApprovalStatus name={r.manager} status={r.managerStatus} /></td>
                <td className="px-2 text-center">
                  <RowActions
                    items={[
                      { label: "View details", onClick: () => navigate(reportUrl([r.id])) },
                      // Operator: hasil cek yang direject supervisor & belum diukur ulang
                      ...(scope === "mine" && r.supervisorStatus === "rejected" && !r.retestedBy
                        ? [{ label: "Measure again", onClick: () => navigate(`/operator/checking?retest=${encodeURIComponent(r.id)}`) }]
                        : []),
                      {
                        group: "Download as",
                        options: [
                          { label: "PDF", onClick: () => downloadPdf([r.id]) },
                          { label: "Excel", onClick: () => downloadExcel([r.id]) },
                        ],
                      },
                    ]}
                  />
                </td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="h-[72px] text-center text-gray-500" aria-live="polite">
                  Loading checking history…
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
            {!loading && !loadError && data.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="h-[72px] text-center text-gray-500">
                  {scope === "mine"
                    ? "No checking yet. Results you save in Product checking will appear here."
                    : "No checking yet."}
                </td>
              </tr>
            )}
            {!loading && !loadError && data.length > 0 && rows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="h-[72px] text-center text-gray-500">
                  No data found
                  {countActiveFilters(filter) > 0 && (
                    <>
                      {" · "}
                      <button
                        type="button"
                        onClick={() => { setFilter(DEFAULT_FILTER); setPage(1); }}
                        className="font-semibold text-primary hover:text-primary-hover"
                      >
                        Reset filter
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
    </>
  );
}

/** Tombol "Download N files" dengan pilihan format: PDF (Inspection Record) atau Excel. */
function DownloadMenu({ label, disabled, onPdf, onExcel }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onEsc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const options = [
    { label: "PDF", hint: "Inspection Record, one page per record", onClick: onPdf },
    { label: "Excel (.xlsx)", hint: "Same layout, one sheet per record", onClick: onExcel },
  ];

  return (
    <div ref={ref} className="relative">
      <Button
        icon="download"
        iconRight="chevron-down"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-gray-100 bg-white py-1 shadow-lg"
          style={{ width: 240 }}
        >
          {options.map((o) => (
            <button
              key={o.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                o.onClick();
              }}
              className="flex w-full flex-col items-start px-3.5 py-2.5 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
            >
              <span className="text-sm font-medium text-gray-900">{o.label}</span>
              <span className="text-xs text-gray-500">{o.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
