import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon";
import RejectDialog from "./RejectDialog";
import ApprovalStatus from "./ui/ApprovalStatus";
import { judge, overallResult, parseDecimal } from "../services/productSpec";

/**
 * Pop-up "Product approval" (Figma: Supervisor & Manager → Approve pop up).
 * Menampilkan semua data hasil cek sebelum diputuskan.
 *
 * role="manager"    : ada info approval Supervisor; nilai hanya dibaca.
 * role="supervisor" : tanpa info Supervisor; nilai bisa DIKOREKSI per baris (ikon pensil → input → ✓).
 *                     Selama mengedit, Reject & Approve nonaktif (Figma: Edit checking point value).
 *                     Nilai yang dikoreksi menampilkan nilai asli operator ("Edited · was X").
 * Reject membuka RejectDialog (pesan wajib: Supervisor → operator, Manager → supervisor).
 * Tambahan di luar Figma: kolom Result (OK/NG), dihitung ulang saat nilai dikoreksi.
 *
 * Props: record, role, productImage, tools, busy ("approved" | "rejected" | null),
 *        onApprove(values), onReject(message, values), onClose()
 *        values = { [indexTitik]: nilaiBaru } — hanya titik yang dikoreksi
 */

const fmtDateTime = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-GB")} ${d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })}`;
};
const signed = (n) => (n > 0 ? `+${n}` : String(n));

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-[200px_minmax(0,1fr)] items-center gap-4">
      <dt className="text-body-2 text-gray-500">{label}</dt>
      <dd className="text-body-2 text-gray-900">{children}</dd>
    </div>
  );
}

function ResultBadge({ result }) {
  if (!result) return <span className="text-gray-400">–</span>;
  const ok = result === "OK";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-medium ${
        ok ? "bg-success-50 text-success-700" : "bg-error-50 text-error-700"
      }`}
    >
      <Icon name={ok ? "check" : "x"} className="size-3.5" strokeWidth={2.5} />
      {result}
    </span>
  );
}

function ImageBox({ label, src, alt }) {
  return (
    <div>
      <p className="text-input-label text-gray-500">{label}</p>
      <div
        className={`mt-2.5 flex h-40 items-center justify-center overflow-hidden rounded-lg border border-gray-200 ${
          src ? "bg-white p-2" : "bg-gray-100"
        }`}
      >
        {src ? (
          <img src={src} alt={alt} className="max-h-full max-w-full object-contain" />
        ) : (
          <Icon name="photo" className="size-12 text-gray-400" strokeWidth={1.25} />
        )}
      </div>
    </div>
  );
}

export default function ApprovalModal({
  record,
  role = "manager",
  productImage,
  tools,
  busy,
  onApprove,
  onReject,
  onClose,
}) {
  const canEdit = role === "supervisor";
  const panelRef = useRef(null);
  const editInputRef = useRef(null);
  const [confirmReject, setConfirmReject] = useState(false);

  // Koreksi nilai (Supervisor)
  const [edits, setEdits] = useState({}); // { index: nilaiBaru (number) }
  const [editing, setEditing] = useState(null); // index yang sedang diedit
  const [draft, setDraft] = useState("");
  const [draftError, setDraftError] = useState("");

  const original = record.points ?? [];
  const points = original.map((p, i) =>
    i in edits && edits[i] !== p.value
      ? { ...p, value: edits[i], result: judge(edits[i], p), originalValue: p.originalValue ?? p.value }
      : p,
  );
  const result = Object.keys(edits).length ? overallResult(points.map((p) => p.result)) : record.result;

  const toolIds = [...new Set(points.map((p) => p.toolId))];
  const toolNames = [...new Set(points.map((p) => tools[p.toolId]?.name ?? p.toolName))].join(", ");
  const firstTool = tools[toolIds[0]];
  const locked = Boolean(busy) || editing !== null;

  function startEdit(i) {
    setEditing(i);
    setDraft(String(points[i].value));
    setDraftError("");
    requestAnimationFrame(() => editInputRef.current?.select());
  }
  function commitEdit() {
    const n = parseDecimal(draft);
    if (n === null) return setDraftError("Required");
    if (Number.isNaN(n)) return setDraftError("Enter a number");
    setEdits((prev) => {
      const next = { ...prev };
      if (n === original[editing].value) delete next[editing];
      else next[editing] = n;
      return next;
    });
    setEditing(null);
  }
  function cancelEdit() {
    setEditing(null);
    setDraftError("");
  }

  // Fokus awal + kembalikan fokus ke tombol pemicu saat ditutup
  useEffect(() => {
    const previous = document.activeElement;
    panelRef.current?.querySelector("[data-autofocus]")?.focus();
    return () => previous?.isConnected && previous.focus?.();
  }, []);

  // Esc & Tab di fase bubble → RejectDialog (capture) yang menumpuk di atas tetap didahulukan
  useEffect(() => {
    const onKey = (e) => {
      if (confirmReject) return;
      if (e.key === "Escape") {
        if (editing !== null) return cancelEdit(); // Esc saat mengedit = batal edit, pop-up tetap
        if (!busy) onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = [...panelRef.current.querySelectorAll("button:not([disabled]), input")];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onClose, confirmReject, editing]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-700/60 p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="approval-title"
        aria-describedby="approval-desc"
        className="flex max-h-full w-full max-w-[760px] flex-col overflow-hidden rounded-xl bg-white shadow-xl"
      >
        {/* header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div>
            <h2 id="approval-title" className="text-h6 text-gray-900">
              Product approval
            </h2>
            <p id="approval-desc" className="mt-1 text-body-1 text-gray-600">
              Check all data before approval
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(busy)}
            aria-label="Close"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus-visible:shadow-focus-gray"
          >
            <Icon name="x" className="size-6" />
          </button>
        </div>

        {/* isi (scroll) */}
        <div className="mt-5 overflow-y-auto px-6">
          {/* Dikembalikan manager → pesan manager untuk supervisor */}
          {role === "supervisor" && record.returned && (
            <div role="note" className="mb-5 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-body-2 text-gray-700">
              <Icon name="arrow-uturn-left" className="mt-0.5 size-5 shrink-0 text-amber-700" />
              <p>
                <span className="font-semibold text-gray-900">Returned by {record.returned.name} (manager)</span>
                <span className="text-gray-500"> · {fmtDateTime(record.returned.at)}</span>
                <span className="mt-1 block italic">“{record.returned.message}”</span>
              </p>
            </div>
          )}
          {record.retestOf && (
            <p className="mb-5 text-body-2 text-gray-600">
              This is a re-check of <span className="font-medium text-gray-900">{record.retestOf}</span>, which was rejected by the supervisor.
            </p>
          )}
          {role === "manager" && (
            <dl className="flex flex-col gap-4 border-t border-gray-200 py-5">
              <Row label="Supervisor approval">
                <ApprovalStatus name={record.supervisor?.name} status={record.supervisor?.status} wide />
              </Row>
              <Row label="Approval date">{fmtDateTime(record.supervisor?.at)}</Row>
            </dl>
          )}

          <dl className="flex flex-col gap-4 border-t border-gray-200 py-5">
            <Row label="Checking date">{fmtDateTime(record.createdAt)}</Row>
            <Row label="Checking by">
              {record.operator?.name}
              <span className="ml-4 text-gray-500">{record.operator?.id}</span>
            </Row>
            <Row label="Customer">{record.customer?.name}</Row>
            <Row label="Product name">{record.product?.name}</Row>
            <Row label="Product number">{record.product?.id}</Row>
            <Row label="Measurement tool">{toolNames || "-"}</Row>
            <Row label="Result">
              <ResultBadge result={result} />
            </Row>
          </dl>

          <div className="grid grid-cols-2 gap-8 border-t border-gray-200 py-5">
            <ImageBox label="Product image" src={productImage} alt={`Product ${record.product?.name ?? ""}`} />
            <ImageBox
              label={toolIds.length > 1 ? `Measurement tool image · ${firstTool?.name ?? ""}` : "Measurement tool image"}
              src={firstTool?.imageUrl}
              alt={firstTool?.name ?? ""}
            />
          </div>

          <div className="border-t border-gray-200 py-5">
            {points.length === 0 ? (
              <p className="text-body-2 text-gray-500">No measurement data recorded.</p>
            ) : (
              <table className="w-full table-fixed border-collapse">
                <colgroup>
                  <col className={canEdit ? "w-[26%]" : "w-[30%]"} />
                  <col className="w-[13%]" />
                  <col className="w-[11%]" />
                  <col className="w-[11%]" />
                  <col className={canEdit ? "w-[16%]" : "w-[17%]"} />
                  <col className={canEdit ? "w-[14%]" : "w-[18%]"} />
                  {canEdit && <col className="w-[9%]" />}
                </colgroup>
                <thead>
                  <tr className="h-11 bg-gray-50 text-left text-table-head text-gray-600 [&>th]:font-medium">
                    <th className="rounded-l-md pl-5 pr-3">Checking point</th>
                    <th className="px-3">Standard</th>
                    <th className="px-3">Min</th>
                    <th className="px-3">Max</th>
                    <th className="px-3">Value</th>
                    <th className={`px-3 ${canEdit ? "" : "rounded-r-md"}`}>Result</th>
                    {canEdit && <th className="rounded-r-md px-3 text-center">Action</th>}
                  </tr>
                </thead>
                <tbody className="text-table-cell text-gray-900">
                  {points.map((p, i) => {
                    const isEditing = editing === i;
                    const changed = p.originalValue !== undefined && p.originalValue !== p.value;
                    return (
                      <tr key={i} className="h-14 border-b border-gray-200">
                        <td className="py-3 pl-5 pr-3">
                          <span className="block break-words">{p.name}</span>
                          {toolIds.length > 1 && (
                            <span className="block text-helper-text text-gray-500">{p.toolName}</span>
                          )}
                        </td>
                        <td className="px-3">{p.standard}</td>
                        <td className="px-3">{signed(p.min)}</td>
                        <td className="px-3">{signed(p.max)}</td>
                        <td className="px-3 py-2">
                          {isEditing ? (
                            <>
                              <label htmlFor="edit-point-value" className="sr-only">
                                New value for {p.name}
                              </label>
                              <input
                                ref={editInputRef}
                                id="edit-point-value"
                                inputMode="decimal"
                                autoComplete="off"
                                value={draft}
                                onChange={(e) => {
                                  setDraft(e.target.value);
                                  setDraftError("");
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    commitEdit();
                                  }
                                }}
                                aria-invalid={Boolean(draftError)}
                                aria-describedby={draftError ? "edit-point-error" : undefined}
                                className={`h-10 w-full max-w-[96px] rounded-lg border bg-white px-3 text-body-2 shadow-xs focus:outline-none ${
                                  draftError
                                    ? "border-error-300 focus:shadow-focus-error"
                                    : "border-gray-300 focus:border-focus-border focus:shadow-focus-primary"
                                }`}
                              />
                              {draftError && (
                                <p id="edit-point-error" className="mt-1 text-helper-text text-error-600">
                                  {draftError}
                                </p>
                              )}
                            </>
                          ) : (
                            <>
                              <span className={p.result === "NG" ? "font-semibold text-error-700" : ""}>
                                {p.value}
                              </span>
                              {changed && (
                                <span className="block text-helper-text text-gray-500">
                                  Edited · was {p.originalValue}
                                </span>
                              )}
                            </>
                          )}
                        </td>
                        <td className="px-3">
                          <ResultBadge result={isEditing ? null : p.result} />
                        </td>
                        {canEdit && (
                          <td className="px-3 text-center">
                            {isEditing ? (
                              <button
                                type="button"
                                onClick={commitEdit}
                                aria-label={`Save value for ${p.name}`}
                                className="rounded-lg p-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:shadow-focus-gray"
                              >
                                <Icon name="check" className="size-5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => startEdit(i)}
                                disabled={locked}
                                aria-label={`Edit value for ${p.name}`}
                                className="rounded-lg p-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:shadow-focus-gray disabled:cursor-not-allowed disabled:text-gray-300"
                              >
                                <Icon name="pencil-square" className="size-5" />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            {Object.keys(edits).length > 0 && (
              <p className="mt-3 text-helper-text text-gray-600" aria-live="polite">
                {Object.keys(edits).length} value{Object.keys(edits).length > 1 ? "s" : ""} corrected. The
                operator&apos;s original values are kept for the record.
              </p>
            )}
          </div>
        </div>

        {/* footer */}
        <div className="flex items-center justify-between gap-4 border-t border-gray-200 px-6 py-5">
          <button
            type="button"
            onClick={() => setConfirmReject(true)}
            disabled={locked}
            aria-haspopup="dialog"
            className="inline-flex h-12 items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 text-base font-semibold text-gray-700 shadow-xs hover:bg-gray-50 focus:outline-none focus-visible:shadow-focus-gray disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300 disabled:hover:bg-white"
          >
            Reject
            <Icon name="x" className="size-5" />
          </button>
          <button
            type="button"
            data-autofocus
            onClick={() => onApprove(edits)}
            disabled={locked}
            className="inline-flex h-12 items-center gap-2 rounded-lg bg-error-600 px-5 text-base font-semibold text-white shadow-xs focus:outline-none focus-visible:shadow-focus-error enabled:hover:bg-error-700 disabled:cursor-not-allowed disabled:bg-brand-200"
          >
            {busy === "approved" ? "Approving…" : "Approve"}
            <Icon name="check" className="size-5" />
          </button>
        </div>
      </div>

      {confirmReject && (
        <RejectDialog
          recipient={role === "supervisor" ? "operator" : "supervisor"}
          busy={busy === "rejected"}
          onCancel={() => setConfirmReject(false)}
          onSubmit={(message) => onReject(message, edits)}
        />
      )}
    </div>,
    document.body,
  );
}
