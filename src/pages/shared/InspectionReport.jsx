// =====================================================================
// INSPECTION RECORD — laporan hasil cek, ukuran A4, siap dicetak / disimpan PDF.
//   /report/IC-00011                 satu hasil cek
//   /report/IC-00011,IC-00012        beberapa hasil cek → satu PDF, satu halaman per hasil cek
//   ?format=formal | visual          Formal (tabel bergaris, aman dicetak hitam-putih)
//                                    Visual (bar toleransi per titik ukur)
//   ?print=1                         langsung membuka dialog cetak (tombol Download di Checking history)
//
// Semua role yang login boleh membuka; operator hanya hasil ceknya sendiri (dijaga backend).
// "Download PDF" memakai dialog cetak browser → pilih "Save as PDF".
// Laporan dibuat dari SNAPSHOT spesifikasi di hasil cek, jadi tetap benar walau
// spesifikasi produk diubah kemudian.
// =====================================================================
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import logo from "../../assets/logo.png";
import Icon from "../../components/Icon";
import { getCurrentUser, homeFor } from "../../services/auth";
import { downloadInspectionPdf, exportInspections, getInspection } from "../../services/inspectionApi";
import { listMeasurementTools } from "../../services/measurementToolApi";
import { listProducts } from "../../services/productApi";
import {
  acceptedRange,
  fmtDate,
  fmtDateTime,
  fmtNum,
  pointDecimals,
  tolerancePosition,
} from "../../services/report";

const FORMATS = [
  { key: "formal", label: "Formal" },
  { key: "visual", label: "Visual" },
];

export default function InspectionReport() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const format = params.get("format") === "visual" ? "visual" : "formal";
  const autoPrint = params.get("print") === "1";
  const [state, setState] = useState({ status: "loading" });
  // busy: "pdf" | "excel" | "" — file dibuat di server lalu langsung terunduh
  const [dl, setDl] = useState({ busy: "", error: "" });

  async function download(kind) {
    setDl({ busy: kind, error: "" });
    try {
      const ids = state.records.map((r) => r.id);
      await (kind === "pdf" ? downloadInspectionPdf(ids) : exportInspections(ids));
      setDl({ busy: "", error: "" });
    } catch (err) {
      setDl({ busy: "", error: err.message || "Failed to download." });
    }
  }

  useEffect(() => {
    let alive = true;
    const ids = [...new Set(String(id).split(",").map((x) => x.trim()).filter(Boolean))];
    Promise.all([Promise.all(ids.map(getInspection)), listProducts().catch(() => []), listMeasurementTools().catch(() => [])])
      .then(([records, products, tools]) => {
        if (!alive) return;
        const productImages = Object.fromEntries(products.map((p) => [p.id, p.imageUrl]));
        const toolImages = Object.fromEntries(tools.map((t) => [t.id, t.imageUrl]));
        setState({ status: "ready", records, productImages, toolImages });
      })
      .catch((err) => alive && setState({ status: "error", message: err.message }));
    return () => {
      alive = false;
    };
  }, [id]);

  // Judul tab = nama file default saat "Save as PDF"
  useEffect(() => {
    if (state.status !== "ready") return undefined;
    const r = state.records;
    document.title = r.length === 1 ? `Inspection Record ${r[0].id}` : `Inspection Records (${r.length})`;
    return () => {
      document.title = "eqc-frontend";
    };
  }, [state]);

  // ?print=1 → buka dialog cetak setelah gambar & font selesai dimuat
  useEffect(() => {
    if (state.status !== "ready" || !autoPrint) return undefined;
    let cancelled = false;
    const images = [...document.querySelectorAll("article img")]
      .filter((img) => !img.complete)
      .map(
        (img) =>
          new Promise((done) => {
            img.addEventListener("load", done, { once: true });
            img.addEventListener("error", done, { once: true });
          }),
      );
    Promise.all([document.fonts?.ready, ...images]).then(() => {
      if (cancelled) return;
      const next = new URLSearchParams(params);
      next.delete("print"); // supaya refresh tidak membuka dialog cetak lagi
      setParams(next, { replace: true });
      window.print();
    });
    return () => {
      cancelled = true;
    };
  }, [state, autoPrint, params, setParams]);

  const back = homeFor(getCurrentUser()?.role);
  const setFormat = (key) => {
    const next = new URLSearchParams(params);
    next.set("format", key);
    setParams(next, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <style>{`@page { size: A4; margin: 12mm 14mm } @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact } }`}</style>

      {/* Toolbar — tidak ikut tercetak */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white print:hidden">
        <div className="mx-auto flex max-w-[210mm] flex-wrap items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? window.history.back() : window.location.assign(back))}
            className="flex items-center gap-2 text-subtitle-2 text-gray-700 hover:text-gray-900"
          >
            <Icon name="arrow-left" className="size-5" />
            Back
          </button>
          <div className="ml-auto flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1" role="tablist" aria-label="Report format">
            {FORMATS.map((f) => (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={format === f.key}
                onClick={() => setFormat(f.key)}
                className={`rounded-md px-3 py-1.5 text-btn-sm ${
                  format === f.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {dl.error && <p className="text-caption text-error-600">{dl.error}</p>}
          <button
            type="button"
            onClick={() => download("excel")}
            disabled={state.status !== "ready" || dl.busy !== ""}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-btn-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Icon name="download" className="size-5" />
            {dl.busy === "excel" ? "Preparing…" : "Excel"}
          </button>
          {/* Formal → file PDF dari server. Visual → dialog cetak browser (Save as PDF),
              karena tampilan Visual hanya ada di halaman ini. */}
          <button
            type="button"
            onClick={() => (format === "formal" ? download("pdf") : window.print())}
            disabled={state.status !== "ready" || dl.busy !== ""}
            title={format === "formal" ? undefined : "Opens the print dialog — choose “Save as PDF”"}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-btn-md text-white hover:bg-primary-hover disabled:opacity-50"
          >
            <Icon name="download" className="size-5" />
            {dl.busy === "pdf" ? "Preparing…" : "Download PDF"}
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center gap-8 py-8 print:block print:py-0">
        {state.status === "loading" && <p className="text-body-2 text-gray-500">Loading report…</p>}
        {state.status === "error" && <p className="text-body-2 text-error-600">{state.message}</p>}
        {state.status === "ready" &&
          state.records.map((record) => {
            const props = {
              record,
              productImage: state.productImages[record.product?.id] ?? "",
              toolImages: state.toolImages,
            };
            return (
              <article
                key={record.id}
                className="min-h-[297mm] w-[210mm] bg-white text-ink shadow-lg print:min-h-0 print:w-auto print:shadow-none print:[&:not(:last-child)]:break-after-page"
              >
                {format === "formal" ? <ConceptFormal {...props} /> : <ConceptVisual {...props} />}
              </article>
            );
          })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Data bersama
// ---------------------------------------------------------------------

function useSummary(record) {
  return useMemo(() => {
    const points = record.points ?? [];
    const ng = points.filter((p) => p.result === "NG").length;
    const edited = points.filter((p) => p.originalValue !== undefined).length;
    const tools = [...new Map(points.map((p) => [p.toolId, p.toolName])).entries()];
    const approved = record.supervisor?.status === "approved" && record.manager?.status === "approved";
    const rejected = record.supervisor?.status === "rejected" || record.manager?.status === "rejected";
    const status = approved ? "Approved" : rejected ? "Rejected" : "Waiting for approval";
    return { points, ng, ok: points.length - ng, edited, tools, status, approved, rejected };
  }, [record]);
}

/** Langkah approval dalam urutan: operator → supervisor → manager. */
function approvalSteps(record) {
  return [
    { role: "Checked by", title: "Operator", name: record.operator?.name, code: record.operator?.id, status: "submitted", at: record.createdAt },
    {
      role: "Reviewed by",
      title: "Supervisor",
      name: record.supervisor?.name,
      code: record.supervisor?.id,
      status: record.supervisor?.status ?? "pending",
      at: record.supervisor?.at,
      message: record.supervisor?.message,
    },
    {
      role: "Approved by",
      title: "Manager",
      name: record.manager?.name,
      code: record.manager?.id,
      status: record.manager?.status ?? "pending",
      at: record.manager?.at,
      message: record.manager?.message,
    },
  ];
}

const STATUS_TEXT = { submitted: "Submitted", approved: "Approved", rejected: "Rejected", pending: "Waiting" };

function ResultText({ result, className = "" }) {
  return <span className={`${result === "NG" ? "text-error-600" : "text-success-700"} ${className}`}>{result}</span>;
}

function Footer({ record, className = "" }) {
  return (
    <footer className={`flex items-center justify-between gap-4 text-[10px] text-gray-500 ${className}`}>
      <span>Generated by E-QC · PT Merah Putih Tekindo · Approved digitally, no wet signature required</span>
      <span className="whitespace-nowrap">
        {record.id} · Printed {fmtDateTime(new Date().toISOString())}
      </span>
    </footer>
  );
}

function Img({ src, alt, className }) {
  return (
    <div className={`flex items-center justify-center overflow-hidden ${className}`}>
      {src ? (
        <img src={src} alt={alt} className="max-h-full max-w-full object-contain" />
      ) : (
        <span className="text-caption text-gray-400">No image</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// FORMAL — : tabel bergaris seperti dokumen IRD konvensional.
// Hampir hitam-putih → tetap jelas di printer laser biasa pabrik.
// ---------------------------------------------------------------------

function ConceptFormal({ record, productImage }) {
  const s = useSummary(record);
  const cell = "border border-gray-700 px-2 py-1.5";
  return (
    <div className="flex min-h-[297mm] flex-col px-[14mm] py-[12mm] text-[12px] leading-snug print:min-h-0 print:p-0">
      <header className="grid grid-cols-[38mm_1fr_44mm] border border-gray-700">
        <div className="flex items-center justify-center border-r border-gray-700 p-2">
          <img src={logo} alt="Merah Putih" className="h-[16mm] object-contain" />
        </div>
        <div className="flex flex-col items-center justify-center border-r border-gray-700 p-2 text-center">
          <h1 className="text-[18px] font-bold uppercase tracking-wide">Inspection Record</h1>
          <p className="text-[11px] text-gray-600">Dimensional Quality Check</p>
        </div>
        <dl className="grid grid-cols-[auto_1fr] text-[11px]">
          <dt className="border-b border-r border-gray-700 px-2 py-1">Doc. no</dt>
          <dd className="border-b border-gray-700 px-2 py-1 font-semibold">{record.id}</dd>
          <dt className="border-b border-r border-gray-700 px-2 py-1">Date</dt>
          <dd className="border-b border-gray-700 px-2 py-1">{fmtDate(record.createdAt)}</dd>
          <dt className="border-r border-gray-700 px-2 py-1">Status</dt>
          <dd className="px-2 py-1">{s.status}</dd>
        </dl>
      </header>

      <section className="mt-[4mm] grid grid-cols-[1fr_46mm] border border-gray-700">
        <table className="w-full border-collapse text-[11.5px]">
          <tbody>
            {[
              ["Customer", record.customer?.name],
              ["Part name", record.product?.name],
              ["Part number", record.product?.id],
              ["Measuring tools", s.tools.map(([, n]) => n).join(", ")],
              ["Checked at", fmtDateTime(record.createdAt)],
              ["Operator", `${record.operator?.name} (${record.operator?.id})`],
              ...(record.retestOf ? [["Re-check of", record.retestOf]] : []),
            ].map(([k, v], i, arr) => (
              <tr key={k} className={i < arr.length - 1 ? "border-b border-gray-700" : ""}>
                <th className="w-[34mm] border-r border-gray-700 bg-gray-100 px-2 py-1.5 text-left font-medium">{k}</th>
                <td className="px-2 py-1.5">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex flex-col border-l border-gray-700">
          <Img src={productImage} alt={`Product ${record.product?.name}`} className="flex-1 p-2" />
          <p className="border-t border-gray-700 px-2 py-1 text-center text-[10px] text-gray-600">Product image</p>
        </div>
      </section>

      <table className="mt-[4mm] w-full border-collapse text-[11.5px]">
        <thead>
          <tr className="bg-gray-100 text-center font-medium">
            <th className={`${cell} w-[8mm]`}>No</th>
            <th className={`${cell} text-left`}>Checking point</th>
            <th className={`${cell} text-left`}>Tool</th>
            <th className={cell}>Standard</th>
            <th className={cell}>Tolerance</th>
            <th className={cell}>Accepted range</th>
            <th className={cell}>Measured</th>
            <th className={`${cell} w-[12mm]`}>Judge</th>
          </tr>
        </thead>
        <tbody>
          {s.points.map((p, i) => {
            const dec = pointDecimals(p);
            const r = acceptedRange(p);
            return (
              <tr key={i} className="text-center print:break-inside-avoid">
                <td className={cell}>{i + 1}</td>
                <td className={`${cell} text-left`}>{p.name}</td>
                <td className={`${cell} text-left`}>{p.toolName}</td>
                <td className={cell}>{fmtNum(p.standard, dec)}</td>
                <td className={cell}>
                  {fmtNum(p.min, dec, { signed: true })} / {fmtNum(p.max, dec, { signed: true })}
                </td>
                <td className={cell}>
                  {fmtNum(r.lower, r.dec)} – {fmtNum(r.upper, r.dec)}
                </td>
                <td className={cell}>
                  <span className="font-semibold">{fmtNum(p.value, dec)}</span>
                  {p.originalValue !== undefined && <sup className="ml-0.5">*</sup>}
                </td>
                <td className={`${cell} font-bold`}>
                  <ResultText result={p.result} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {s.edited > 0 && (
        <p className="mt-1 text-[10.5px] text-gray-600">
          * Corrected by supervisor. Original operator value:{" "}
          {s.points
            .filter((p) => p.originalValue !== undefined)
            .map((p) => `${p.name} ${fmtNum(p.originalValue, pointDecimals(p))}`)
            .join(", ")}
          .
        </p>
      )}

      <section className="mt-[4mm] grid grid-cols-[1fr_52mm] border border-gray-700 print:break-inside-avoid">
        <div className="grid grid-cols-3 text-center text-[11.5px]">
          <div className="border-r border-gray-700 py-2">
            <p className="text-gray-600">Checking points</p>
            <p className="text-[16px] font-bold">{s.points.length}</p>
          </div>
          <div className="border-r border-gray-700 py-2">
            <p className="text-gray-600">OK</p>
            <p className="text-[16px] font-bold">{s.ok}</p>
          </div>
          <div className="py-2">
            <p className="text-gray-600">NG</p>
            <p className="text-[16px] font-bold">{s.ng}</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center border-l border-gray-700 py-2">
          <p className="text-[11px] uppercase tracking-wide text-gray-600">Final judgement</p>
          <ResultText result={record.result} className="text-[26px] font-black leading-none" />
        </div>
      </section>

      <section className="mt-[4mm] grid grid-cols-3 border border-gray-700 text-center print:break-inside-avoid">
        {approvalSteps(record).map((st, i) => (
          <div key={st.title} className={`flex flex-col ${i < 2 ? "border-r border-gray-700" : ""}`}>
            <p className="border-b border-gray-700 bg-gray-100 py-1.5 text-[11px] font-medium">
              {st.role} ({st.title})
            </p>
            <div className="flex h-[24mm] flex-col items-center justify-center gap-0.5 px-2">
              {st.status === "pending" ? (
                <p className="text-[11px] italic text-gray-400">Waiting for approval</p>
              ) : (
                <>
                  <p
                    className={`rounded border-2 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                      st.status === "rejected" ? "border-error-600 text-error-600" : "border-gray-800 text-gray-800"
                    }`}
                  >
                    {STATUS_TEXT[st.status]}
                  </p>
                  <p className="text-[10px] text-gray-500">{fmtDateTime(st.at)}</p>
                  {st.message && <p className="line-clamp-2 text-[10px] italic text-gray-600">“{st.message}”</p>}
                </>
              )}
            </div>
            <p className="border-t border-gray-700 py-1.5 text-[11.5px] font-semibold">{st.name ?? "-"}</p>
          </div>
        ))}
      </section>

      <Footer record={record} className="mt-auto pt-[6mm]" />
    </div>
  );
}

// ---------------------------------------------------------------------
// VISUAL — : setiap titik ukur punya bar toleransi; posisi nilai ukur
// terlihat sekilas (dekat batas = perlu perhatian walau masih OK).
// ---------------------------------------------------------------------

function ConceptVisual({ record, productImage }) {
  const s = useSummary(record);
  const isNG = record.result === "NG";
  return (
    <div className="flex min-h-[297mm] flex-col px-[14mm] py-[11mm] text-[12px] print:min-h-0 print:p-0">
      <header className="flex items-start justify-between border-b-2 border-brand-500 pb-4">
        <div className="flex items-center gap-4">
          <img src={logo} alt="Merah Putih" className="h-[13mm] object-contain" />
          <div className="border-l border-gray-200 pl-4">
            <h1 className="text-h6 text-gray-900">Inspection Record</h1>
            <p className="text-[11px] text-gray-500">
              {record.id} · {fmtDateTime(record.createdAt)}
            </p>
          </div>
        </div>
        <div
          className={`flex items-center gap-3 rounded-xl border-2 px-4 py-2 ${
            isNG ? "border-error-500 text-error-600" : "border-success-500 text-success-700"
          }`}
        >
          <span className="text-[32px] font-black leading-none">{record.result}</span>
          <span className="text-[10.5px] leading-tight text-gray-600">
            {s.ok}/{s.points.length} points OK
            <br />
            {s.status}
          </span>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-[1fr_58mm] gap-5">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
          {[
            ["Customer", record.customer?.name],
            ["Part number", record.product?.id],
            ["Part name", record.product?.name],
            ["Measuring tools", s.tools.map(([, n]) => n).join(", ")],
            ["Operator", record.operator?.name],
            ["Operator ID", record.operator?.id],
            ...(record.retestOf ? [["Re-check of", record.retestOf]] : []),
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-[10.5px] uppercase tracking-wider text-gray-400">{k}</dt>
              <dd className="font-medium text-gray-900">{v}</dd>
            </div>
          ))}
        </dl>
        <Img
          src={productImage}
          alt={`Product ${record.product?.name}`}
          className="h-[36mm] rounded-xl border border-gray-200 bg-gray-25 p-2"
        />
      </section>

      <section className="mt-6">
        <div className="mb-2 flex items-end justify-between">
          <h2 className="text-subtitle-2 text-gray-900">Measurement results</h2>
          <p className="flex items-center gap-3 text-[10px] text-gray-500">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-5 rounded-sm bg-success-100" /> accepted range
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block size-2 rounded-full bg-gray-900" /> measured
            </span>
          </p>
        </div>
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
          {s.points.map((p, i) => {
            const dec = pointDecimals(p);
            const r = acceptedRange(p);
            const pos = tolerancePosition(p);
            const bad = p.result === "NG";
            return (
              <li key={i} className="grid grid-cols-[46mm_1fr_26mm_12mm] items-center gap-4 px-4 py-2.5 print:break-inside-avoid">
                <div>
                  <p className="font-medium text-gray-900">
                    <span className="mr-1.5 text-gray-400">{i + 1}.</span>
                    {p.name}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {p.toolName} · Std {fmtNum(p.standard, dec)} ({fmtNum(p.min, dec, { signed: true })} /{" "}
                    {fmtNum(p.max, dec, { signed: true })})
                  </p>
                </div>
                <div>
                  <div className="relative h-3 rounded-full bg-gray-100">
                    <div
                      className={`absolute inset-y-0 rounded-full ${bad ? "bg-error-100" : "bg-success-100"}`}
                      style={{ left: `${pos.left}%`, right: `${100 - pos.right}%` }}
                    />
                    <div
                      className={`absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ${
                        bad ? "bg-error-600" : "bg-gray-900"
                      }`}
                      style={{ left: `${pos.value}%` }}
                    />
                  </div>
                  <div className="relative mt-0.5 h-3 text-[9px] text-gray-400">
                    <span className="absolute -translate-x-1/2 tabular-nums" style={{ left: `${pos.left}%` }}>
                      {fmtNum(r.lower, r.dec)}
                    </span>
                    <span className="absolute -translate-x-1/2 tabular-nums" style={{ left: `${pos.right}%` }}>
                      {fmtNum(r.upper, r.dec)}
                    </span>
                  </div>
                </div>
                <div className="text-right tabular-nums">
                  <p className={`text-[14px] font-semibold ${bad ? "text-error-600" : "text-gray-900"}`}>
                    {fmtNum(p.value, dec)}
                  </p>
                  {p.originalValue !== undefined && (
                    <p className="text-[9.5px] text-amber-700">corrected · was {fmtNum(p.originalValue, dec)}</p>
                  )}
                </div>
                <ResultText result={p.result} className="text-center text-[12px] font-bold" />
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-6 grid grid-cols-3 gap-3 print:break-inside-avoid">
        {approvalSteps(record).map((st) => {
          const bad = st.status === "rejected";
          const pending = st.status === "pending";
          return (
            <div
              key={st.title}
              className={`rounded-xl border px-4 py-3 ${
                bad ? "border-error-200 bg-error-25" : pending ? "border-dashed border-gray-300" : "border-gray-200"
              }`}
            >
              <p className="text-[10.5px] uppercase tracking-wider text-gray-400">{st.role}</p>
              <p className="mt-1 font-semibold text-gray-900">{st.name ?? "—"}</p>
              <p className="text-[10.5px] text-gray-500">{st.title}</p>
              <p className={`mt-2 text-[11px] font-medium ${bad ? "text-error-700" : pending ? "text-gray-400" : "text-success-700"}`}>
                {STATUS_TEXT[st.status]}
                {!pending && st.at ? ` · ${fmtDateTime(st.at)}` : ""}
              </p>
              {st.message && <p className="mt-1 text-[10.5px] italic text-gray-600">“{st.message}”</p>}
            </div>
          );
        })}
      </section>

      <Footer record={record} className="mt-auto pt-[6mm]" />
    </div>
  );
}
