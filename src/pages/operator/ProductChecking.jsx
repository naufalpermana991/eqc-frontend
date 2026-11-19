import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import Icon from "../../components/Icon";
import Dropdown from "../../components/ui/Dropdown";
import ConfirmDialog from "../../components/ConfirmDialog";
import { listCustomers } from "../../services/customerApi";
import { listProducts } from "../../services/productApi";
import { listMeasurementTools } from "../../services/measurementToolApi";
import { createInspection, getInspection, validateValues } from "../../services/inspectionApi";
import { acceptedRange, judge, overallResult, parseDecimal } from "../../services/productSpec";
import { getCurrentUser } from "../../services/auth";
import { useToast } from "../../services/toast";

// Figma: UI Design 1 → Operator → Product checking
// (Default, Customer dropdown/filled, Product dropdown/filled, Value filled)
//
// Alur: pilih Customer → pilih Product → tabel checking point muncul → isi Value semua → Save.
// - Clear data: mengosongkan Value saja (customer & produk tetap).
// - Setelah Save: Value dikosongkan, customer & produk tetap → siap cek part berikutnya.
// - Gambar alat ukur mengikuti baris yang sedang diisi (produk bisa memakai >1 alat ukur).
// - OK/NG (tambahan, belum ada di Figma — uji coba): kolom Result per baris, ringkasan di kartu
//   kanan, dan konfirmasi sebelum menyimpan hasil NG. Aturan: services/productSpec.js → judge().
//
// CATATAN: produk belum terhubung ke customer di data admin (form Add product tidak punya
// field Customer) → dropdown Product menampilkan semua produk.

/** Badge OK / NG (ikon + teks, tidak hanya warna). */
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

/** Tampilan angka toleransi: positif diberi "+" (Figma: -0.05 / +0.05 / 0). */
const signed = (n) => (n > 0 ? `+${n}` : String(n));

/** Produk → baris tabel (semua checking point dari semua alat ukur, urut sesuai input admin). */
const rowsOf = (product) =>
  (product?.tools ?? []).flatMap((t, ti) =>
    t.points.map((p, pi) => ({
      key: `${ti}-${pi}`,
      toolId: t.toolId,
      toolName: t.toolName,
      ...p,
      range: acceptedRange({ standard: String(p.standard), min: String(p.min), max: String(p.max) }),
    })),
  );

function ImageBox({ src, alt, emptyLabel }) {
  return (
    <div
      className={`flex h-40 w-full items-center justify-center overflow-hidden rounded-lg border ${
        src ? "border-gray-200 bg-white p-2" : "border-gray-200 bg-gray-100"
      }`}
    >
      {src ? (
        <img src={src} alt={alt} className="max-h-full max-w-full object-contain" />
      ) : (
        <span className="flex flex-col items-center gap-1 text-gray-400">
          <Icon name="photo" className="size-14" strokeWidth={1.25} />
          <span className="sr-only">{emptyLabel}</span>
        </span>
      )}
    </div>
  );
}

export default function ProductChecking() {
  const toast = useToast();
  const operator = getCurrentUser();

  // ---- data master ----
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [tools, setTools] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([listCustomers(), listProducts(), listMeasurementTools()])
      .then(([c, p, t]) => {
        if (!active) return;
        setCustomers([...c].sort((a, b) => a.name.localeCompare(b.name)));
        setProducts([...p].sort((a, b) => a.name.localeCompare(b.name)));
        setTools(t);
        setLoadError("");
      })
      .catch((err) => active && setLoadError(err.message || "Failed to load data."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const toolsById = useMemo(() => Object.fromEntries(tools.map((t) => [t.id, t])), [tools]);

  // ---- ukur ulang (?retest=IC-00014) ----
  // Dibuka dari "Measure again" di Checking history atau dari notifikasi reject.
  // Customer & produk dikunci sama dengan hasil cek yang direject; hasil baru tertaut ke hasil lama.
  const [params, setParams] = useSearchParams();
  const retestId = params.get("retest") ?? "";
  const [retest, setRetest] = useState(null); // { status: "loading"|"ready"|"done"|"error", record?, message? }
  const retestActive = retest?.status === "ready";

  function exitRetest() {
    setParams({}, { replace: true });
  }

  // ---- pilihan & nilai ----
  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [focusedKey, setFocusedKey] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmNg, setConfirmNg] = useState(false);

  const customer = customers.find((c) => c.id === customerId);
  const product = products.find((p) => p.id === productId);
  const rows = useMemo(() => rowsOf(product), [product]);

  const filledCount = rows.filter((r) => String(values[r.key] ?? "").trim()).length;
  const results = rows.map((r) => judge(values[r.key], r));
  const ngCount = results.filter((x) => x === "NG").length;
  const overall = overallResult(results);
  const anyFilled = filledCount > 0;
  const allFilled = rows.length > 0 && filledCount === rows.length;

  // Alat ukur yang ditampilkan: baris yang sedang diisi, atau alat ukur pertama produk
  const shownToolId = rows.find((r) => r.key === focusedKey)?.toolId ?? rows[0]?.toolId;
  const shownTool = toolsById[shownToolId];

  function selectProduct(id) {
    setProductId(id);
    setValues({});
    setErrors({});
    setFocusedKey(null);
  }

  useEffect(() => {
    if (!retestId) {
      setRetest(null);
      return undefined;
    }
    if (loading || loadError) return undefined;
    let active = true;
    setRetest({ status: "loading" });
    getInspection(retestId)
      .then((record) => {
        if (!active) return;
        if (record.supervisor?.status !== "rejected") return setRetest({ status: "error", message: `${record.id} is not rejected by the supervisor, so it can't be measured again.` });
        if (record.retestedBy) return setRetest({ status: "done", record });
        if (!products.some((p) => p.id === record.product?.id))
          return setRetest({ status: "error", message: `The product of ${record.id} no longer exists.` });
        setCustomerId(customers.some((c) => c.id === record.customer?.id) ? record.customer.id : "");
        setProductId(record.product.id);
        setValues({});
        setErrors({});
        setFocusedKey(null);
        setRetest({ status: "ready", record });
      })
      .catch((err) => active && setRetest({ status: "error", message: err.message }));
    return () => {
      active = false;
    };
  }, [retestId, loading, loadError, customers, products]);

  function setValue(key, v) {
    setValues((s) => ({ ...s, [key]: v }));
    if (errors[key])
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
  }

  function clearValues() {
    setValues({});
    setErrors({});
  }

  function onSave(e) {
    e.preventDefault();
    const invalid = validateValues(rows, values);
    if (Object.keys(invalid).length) {
      setErrors(invalid);
      document.getElementById(`value-${Object.keys(invalid)[0]}`)?.focus();
      return;
    }
    // Hasil NG tetap boleh disimpan, tapi minta konfirmasi dulu (cegah salah ketik tersimpan sebagai NG)
    if (ngCount) return setConfirmNg(true);
    save();
  }

  async function save() {
    setConfirmNg(false);
    setSaving(true);
    try {
      await createInspection({
        customer: { id: customer.id, name: customer.name },
        product: { id: product.id, name: product.name },
        operator: { id: operator?.id, name: operator?.name },
        points: rows.map((r) => ({
          toolId: r.toolId,
          toolName: r.toolName,
          name: r.name,
          standard: r.standard,
          min: r.min,
          max: r.max,
          value: parseDecimal(values[r.key]),
        })),
        ...(retestActive ? { retestOf: retest.record.id } : {}),
      });
      clearValues();
      if (retestActive) exitRetest();
      toast.success(`Checking result for ${product.name} has been saved as ${overall}.`);
      document.getElementById(`value-${rows[0]?.key}`)?.focus();
    } catch (err) {
      toast.error(err.message || "Failed to save the checking result.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="Product checking" description="Select customer and product, then input the measurement values" />

      {/* Panel kanan 368px (Figma, layar ≥1536px); di layar laptop lebih ramping supaya tabel lega */}
      <form
        onSubmit={onSave}
        noValidate
        className="grid grid-cols-[minmax(0,1fr)_300px] items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_368px]"
      >
        {/* ---------- kiri ---------- */}
        <div className="flex min-w-0 flex-col gap-6">
          {retest && <RetestBanner retest={retest} onExit={exitRetest} />}
          <section className="grid grid-cols-2 gap-4 rounded-xl bg-white p-6">
            <Dropdown
              id="select-customer"
              label="Customer"
              placeholder={loading ? "Loading…" : "Select customer"}
              value={customerId}
              options={customers.map((c) => ({ value: c.id, label: c.name }))}
              onChange={(id) => {
                setCustomerId(id);
                if (!productId) return;
                // ganti customer → produk direset (nanti produk difilter per customer)
                selectProduct("");
              }}
              disabled={loading || Boolean(loadError) || retestActive}
            />
            <Dropdown
              id="select-product"
              label="Product"
              placeholder="Select product"
              value={productId}
              options={products.map((p) => ({ value: p.id, label: p.name }))}
              onChange={selectProduct}
              disabled={!customerId || retestActive}
            />
            {loadError && (
              <p role="alert" className="col-span-2 text-body-2 text-error-600">
                {loadError}{" · "}
                <button
                  type="button"
                  onClick={() => { setLoading(true); setReloadKey((k) => k + 1); }}
                  className="font-semibold underline"
                >
                  Try again
                </button>
              </p>
            )}
          </section>

          {product && (
            <section className="rounded-xl bg-white p-6" aria-label="Checking points">
              {rows.length === 0 ? (
                <p className="text-body-2 text-gray-500">
                  This product has no checking points yet. Ask the admin to complete the product data.
                </p>
              ) : (
                <table className="w-full table-fixed border-collapse">
                  {/* Figma: 28 / 17 / 17 / 17 / 21 — ditambah kolom Result */}
                  <colgroup>
                    <col className="w-[25%]" />
                    <col className="w-[13%]" />
                    <col className="w-[10%]" />
                    <col className="w-[10%]" />
                    <col className="w-[26%]" />
                    <col className="w-[16%]" />
                  </colgroup>
                  <thead>
                    <tr className="h-11 bg-gray-50 text-left text-table-head text-gray-600 [&>th]:font-medium">
                      <th className="rounded-l-md pl-5 pr-3">Checking point</th>
                      <th className="px-2">Standard</th>
                      <th className="px-2">Min</th>
                      <th className="px-2">Max</th>
                      <th className="px-3">Value</th>
                      <th className="rounded-r-md px-3 pr-5">Result</th>
                    </tr>
                  </thead>
                  <tbody className="text-table-cell text-gray-900">
                    {rows.map((r, i) => {
                      const err = errors[r.key];
                      const result = results[i];
                      return (
                        <tr key={r.key} className="border-b border-gray-200">
                          <td className="py-5 pl-5 pr-3">
                            <span className="block break-words">{r.name}</span>
                            <span className="block truncate text-helper-text text-gray-500">{r.toolName}</span>
                          </td>
                          <td className="px-2 py-5">{r.standard}</td>
                          <td className="px-2 py-5">{signed(r.min)}</td>
                          <td className="px-2 py-5">{signed(r.max)}</td>
                          <td className="px-3 py-4">
                            <label htmlFor={`value-${r.key}`} className="sr-only">
                              Value for {r.name}
                            </label>
                            <input
                              id={`value-${r.key}`}
                              inputMode="decimal"
                              autoComplete="off"
                              value={values[r.key] ?? ""}
                              onChange={(e) => setValue(r.key, e.target.value)}
                              onFocus={() => setFocusedKey(r.key)}
                              aria-invalid={Boolean(err)}
                              aria-describedby={`value-${r.key}-${err ? "error" : "hint"}`}
                              className={`h-10 w-full max-w-[112px] rounded-lg border bg-white px-3 text-body-2 text-gray-900 shadow-xs focus:outline-none ${
                                err || result === "NG"
                                  ? "border-error-300 focus:shadow-focus-error"
                                  : "border-gray-300 focus:border-focus-border focus:shadow-focus-primary"
                              }`}
                            />
                            {err ? (
                              <p id={`value-${r.key}-error`} className="mt-1 text-helper-text text-error-600">
                                {err}
                              </p>
                            ) : (
                              r.range && (
                                <p id={`value-${r.key}-hint`} className="mt-1.5 text-helper-text text-gray-500">
                                  OK: {r.range.lower} – {r.range.upper}
                                </p>
                              )
                            )}
                          </td>
                          <td className="py-5 pl-3 pr-5" aria-live="polite">
                            <ResultBadge result={result} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </section>
          )}
        </div>

        {/* ---------- kanan ---------- */}
        <aside className="flex flex-col rounded-xl bg-white p-6">
          <p className="text-input-label text-gray-500">Product image</p>
          <div className="mt-2.5">
            <ImageBox src={product?.imageUrl} alt={product ? `Product ${product.name}` : ""} emptyLabel="No product selected" />
          </div>

          <p className="mt-8 text-input-label text-gray-500">
            Measurement tool image
            {shownTool && <span className="text-gray-400"> · {shownTool.name}</span>}
          </p>
          <div className="mt-2.5">
            <ImageBox src={shownTool?.imageUrl} alt={shownTool?.name ?? ""} emptyLabel="No measurement tool" />
          </div>

          {/* Ringkasan hasil (tambahan, belum ada di Figma) */}
          {product && rows.length > 0 && (
            <div
              aria-live="polite"
              className={`mt-6 rounded-lg border px-4 py-3 ${
                overall === "OK"
                  ? "border-success-200 bg-success-25"
                  : overall === "NG" || ngCount
                    ? "border-error-200 bg-error-25"
                    : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-input-label text-gray-700">Result</span>
                <ResultBadge result={overall ?? (ngCount ? "NG" : null)} />
              </div>
              <p className="mt-1 text-helper-text text-gray-600">
                {filledCount < rows.length
                  ? `${filledCount} of ${rows.length} points filled${ngCount ? ` · ${ngCount} NG` : ""}`
                  : ngCount
                    ? `${ngCount} of ${rows.length} points NG`
                    : `All ${rows.length} points OK`}
              </p>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={clearValues}
              disabled={!anyFilled || saving}
              className="inline-flex h-12 items-center rounded-lg border border-gray-300 bg-white px-5 text-base font-semibold text-gray-700 shadow-xs hover:bg-gray-50 focus:outline-none focus-visible:shadow-focus-gray disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300 disabled:hover:bg-white"
            >
              Clear data
            </button>
            <button
              type="submit"
              disabled={!allFilled || saving}
              className="inline-flex h-12 min-w-[76px] items-center justify-center rounded-lg bg-error-600 px-5 text-base font-semibold text-white shadow-xs focus:outline-none focus-visible:shadow-focus-error enabled:hover:bg-error-700 disabled:cursor-not-allowed disabled:bg-brand-200"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </aside>
      </form>

      {confirmNg && (
        <ConfirmDialog
          title="Save NG result"
          message={`${ngCount} checking point${ngCount > 1 ? "s are" : " is"} NG. Check the values first — save this result as NG?`}
          confirmLabel="Save as NG"
          onCancel={() => setConfirmNg(false)}
          onConfirm={save}
        />
      )}
    </>
  );
}

/** Info ukur ulang di atas form: pesan reject supervisor + tautan ke hasil yang direject. */
function RetestBanner({ retest, onExit }) {
  const { status, record, message } = retest;
  if (status === "loading")
    return <p className="rounded-xl bg-white px-6 py-4 text-body-2 text-gray-500">Loading the rejected result…</p>;

  const tone =
    status === "ready" ? "border-error-200 bg-error-25" : status === "done" ? "border-gray-200 bg-white" : "border-amber-200 bg-amber-50";
  return (
    <section role="status" className={`flex items-start gap-4 rounded-xl border px-6 py-4 ${tone}`}>
      <Icon
        name={status === "ready" ? "exclamation-circle" : "check-circle"}
        className={`mt-0.5 size-6 shrink-0 ${status === "ready" ? "text-error-600" : "text-gray-500"}`}
      />
      <div className="min-w-0 flex-1 text-body-2 text-gray-700">
        {status === "ready" && (
          <>
            <p className="text-subtitle-2 text-gray-900">
              Measure again · {record.product?.name} ({record.id})
            </p>
            <p className="mt-1">
              Rejected by <span className="font-medium">{record.supervisor?.name}</span>:{" "}
              <span className="italic">“{record.supervisor?.message}”</span>
            </p>
            <p className="mt-1 text-gray-500">Customer and product are locked to the rejected result. The new result will be linked to it.</p>
          </>
        )}
        {status === "done" && (
          <p>
            {record.id} has already been measured again ({record.retestedBy}). You can start a new check below.
          </p>
        )}
        {status === "error" && <p>{message}</p>}
        <div className="mt-2 flex gap-4">
          {record && (
            <Link to={`/report/${encodeURIComponent(record.id)}`} className="text-btn-sm text-primary hover:text-primary-hover">
              View rejected result
            </Link>
          )}
          <button type="button" onClick={onExit} className="text-btn-sm text-gray-600 hover:text-gray-900">
            {status === "ready" ? "Cancel measure again" : "Dismiss"}
          </button>
        </div>
      </div>
    </section>
  );
}
