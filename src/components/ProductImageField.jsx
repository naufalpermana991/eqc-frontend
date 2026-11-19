import UploadDropzone from "./ui/UploadDropzone";
import UploadedFileCard from "./ui/UploadedFileCard";

/**
 * Field "Product image": kotak upload + kartu file (Figma: Add part / product, Edit product).
 * `img` = hasil useProductImage(). `requiredError` = pesan wajib diisi (setelah submit).
 * `compact` = versi rapat untuk modal (dropzone lebih pendek). `label` = judul field
 * (dipakai juga untuk "Measurement tool image").
 */
export default function ProductImageField({
  img,
  requiredError = "",
  compact = false,
  label = "Product image",
}) {
  const message = img.error || (!img.image ? requiredError : "");
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-input-label text-gray-700">{label}</p>
      <UploadDropzone onFile={img.handleFile} label={`Upload ${label.toLowerCase()}`} className={compact ? "py-3" : "py-6"} />
      {message && (
        <p role="alert" className="text-helper-text text-error-600">
          {message}
        </p>
      )}
      {img.image && (
        <div className={compact ? "mt-1.5" : "mt-2.5"}>
          <UploadedFileCard
            name={img.image.name}
            size={img.image.size}
            previewUrl={img.image.previewUrl}
            progress={img.image.progress}
            status={img.image.status}
            error={img.image.error}
            onRemove={img.clear}
          />
        </div>
      )}
    </div>
  );
}
