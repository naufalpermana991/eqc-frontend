import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import ProductImageField from "../../components/ProductImageField";
import ProductToolsForm from "../../components/ProductToolsForm";
import SuccessDialog from "../../components/SuccessDialog";
import FormField from "../../components/ui/FormField";
import Stepper from "../../components/ui/Stepper";
import { inputClass } from "../../components/ui/inputStyles";
import { createProduct, isProductIdTaken, validateProductDetails } from "../../services/productApi";
import { listMeasurementTools } from "../../services/measurementToolApi";
import { emptyGroup } from "../../services/productSpec";
import { useProductImage } from "../../services/useProductImage";
import { useToast } from "../../services/toast";

// Figma: UI Design 1 → Admin → Add part / product (Default & Image uploaded)
// Step 1: detail produk (gambar, id, nama). Step 2: measurement tool + checking point (min/max = toleransi).
const STEPS = ["Product details", "Checking items"];
const EMPTY = { id: "", name: "" };

export default function AddProduct() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const toast = useToast();

  // ---- Step 1 (tetap tersimpan saat pindah ke Step 2 dan kembali) ----
  const img = useProductImage();
  const [values, setValues] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [checking, setChecking] = useState(false);

  const errors = validateProductDetails({ ...values, image: img.ready });
  const showError = (name) => serverErrors[name] || ((touched[name] || submitted) && errors[name]) || "";
  const canNext = values.id.trim() && values.name.trim() && img.ready && !checking;
  const dirty = values.id || values.name || img.image;

  const setField = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }));
    setServerErrors((s) => ({ ...s, [name]: "" }));
  };
  const blur = (name) => () => setTouched((t) => ({ ...t, [name]: true }));

  function resetAll() {
    img.clear();
    setValues(EMPTY);
    setTouched({});
    setSubmitted(false);
    setServerErrors({});
  }

  async function onNext(e) {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) return;

    setChecking(true);
    try {
      if (await isProductIdTaken(values.id.trim())) {
        setServerErrors((s) => ({ ...s, id: "This product id is already registered." }));
        document.getElementById("product-id")?.focus();
        return;
      }
      setStep(1);
    } finally {
      setChecking(false);
    }
  }

  // ---- Step 2 ----
  const [groups, setGroups] = useState(() => [emptyGroup()]);
  const [tools, setTools] = useState([]);
  const [toolsLoading, setToolsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);

  useEffect(() => {
    let active = true;
    listMeasurementTools()
      .then((list) => active && setTools(list))
      .catch(() => active && toast.error("Failed to load measurement tools."))
      .finally(() => active && setToolsLoading(false));
    return () => {
      active = false;
    };
  }, [toast]);

  async function saveProduct(toolsPayload) {
    setSaving(true);
    try {
      const product = await createProduct({
        id: values.id.trim(),
        name: values.name.trim(),
        imageUrl: img.image?.url,
        imageName: img.image?.name,
        imageSize: img.image?.size,
        tools: toolsPayload,
      });
      setCreated(product);
    } catch (err) {
      if (err.field === "id" || err.field === "name" || err.field === "image") {
        // masalah di step 1 (mis. id keburu dipakai) → kembali ke step 1
        setStep(0);
        setServerErrors((s) => ({ ...s, [err.field]: err.message }));
      } else {
        toast.error(err.message || "Failed to save product.");
      }
    } finally {
      setSaving(false);
    }
  }

  // "Add another product": kosongkan step 1 & 2, kembali ke step 1
  function startOver() {
    setCreated(null);
    resetAll();
    setGroups([emptyGroup()]);
    setStep(0);
    requestAnimationFrame(() => document.getElementById("product-id")?.focus());
  }

  return (
    <>
      <PageHeader title="Add part / product" description="Input form below to add a product">
        <Stepper steps={STEPS} current={step} />
      </PageHeader>

      {step === 0 ? (
        <form onSubmit={onNext} noValidate className="rounded-xl bg-white p-6">
          <h2 className="text-h6 text-gray-900">Add product details</h2>

          <div className="mt-6 flex flex-col gap-5">
            <ProductImageField img={img} requiredError={submitted ? errors.image : ""} />

            <FormField id="product-id" label="Product id" error={showError("id")}>
              <input
                id="product-id"
                value={values.id}
                onChange={setField("id")}
                onBlur={blur("id")}
                placeholder="Enter product id"
                autoComplete="off"
                aria-invalid={Boolean(showError("id"))}
                aria-describedby={showError("id") ? "product-id-error" : undefined}
                className={inputClass(showError("id"))}
              />
            </FormField>

            <FormField id="product-name" label="Product name" error={showError("name")}>
              <input
                id="product-name"
                value={values.name}
                onChange={setField("name")}
                onBlur={blur("name")}
                placeholder="Enter product name"
                autoComplete="off"
                aria-invalid={Boolean(showError("name"))}
                aria-describedby={showError("name") ? "product-name-error" : undefined}
                className={inputClass(showError("name"))}
              />
            </FormField>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4 border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={resetAll}
              disabled={!dirty || checking}
              className="rounded-lg px-1 text-base font-semibold text-error-600 hover:text-error-700 focus:outline-none focus-visible:shadow-focus-error disabled:cursor-not-allowed disabled:text-gray-300"
            >
              Reset all
            </button>
            <div className="flex items-center gap-4">
              {img.uploading && <p className="text-sm text-gray-500">Waiting for the image upload to finish…</p>}
              <button
                type="submit"
                disabled={!canNext}
                className="inline-flex h-12 min-w-[124px] items-center justify-center rounded-lg bg-error-600 px-5 text-base font-semibold text-white shadow-xs focus:outline-none focus-visible:shadow-focus-error enabled:hover:bg-error-700 disabled:cursor-not-allowed disabled:bg-brand-200"
              >
                {checking ? "Checking…" : "Next"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <ProductToolsForm
          groups={groups}
          setGroups={setGroups}
          tools={tools}
          toolsLoading={toolsLoading}
          saving={saving}
          onPrevious={() => setStep(0)}
          onSave={saveProduct}
        />
      )}

      {created && (
        <SuccessDialog
          title="Product created"
          message={`${created.name} has been added successfully.`}
          secondaryLabel="Add another product"
          onSecondary={startOver}
          primaryLabel="View product list"
          onPrimary={() => navigate("/products")}
        >
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-lg bg-gray-50 px-4 py-3 text-sm">
            <dt className="text-gray-500">Product id</dt>
            <dd className="font-semibold text-gray-900">{created.id}</dd>
            <dt className="text-gray-500">Measurement tools</dt>
            <dd className="text-gray-900">{created.tools.map((t) => t.toolName).join(", ")}</dd>
            <dt className="text-gray-500">Checking points</dt>
            <dd className="text-gray-900">{created.tools.reduce((n, t) => n + t.points.length, 0)}</dd>
          </dl>
        </SuccessDialog>
      )}
    </>
  );
}
