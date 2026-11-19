// Label + input + pesan error / hint di bawahnya (Figma: Input field).
export default function FormField({ id, label, error, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-input-label text-gray-700">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-helper-text text-error-600">
          {error}
        </p>
      ) : (
        hint && <p className="text-helper-text text-gray-500">{hint}</p>
      )}
    </div>
  );
}
