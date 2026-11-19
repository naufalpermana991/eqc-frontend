// Judul halaman + deskripsi (Figma: Heading 5 + Body 1 gray-600)
export default function PageHeader({ title, description, children }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-h5 text-gray-900">{title}</h1>
        {description && <p className="text-body-1 text-gray-600">{description}</p>}
      </div>
      {children}
    </div>
  );
}
