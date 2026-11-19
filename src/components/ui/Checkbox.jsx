// Checkbox 16px — style sama dengan Remember me di Login (token `checkbox`).
export default function Checkbox({ checked, onChange, indeterminate = false, label, className = "" }) {
  return (
    <span className={`relative grid size-4 shrink-0 place-items-center ${className}`}>
      <input
        type="checkbox"
        aria-label={label}
        checked={checked}
        ref={(el) => el && (el.indeterminate = indeterminate)}
        onChange={(e) => onChange(e.target.checked)}
        className="peer size-4 cursor-pointer appearance-none rounded border border-gray-300 bg-white checked:border-checkbox-border checked:bg-checkbox-bg indeterminate:border-checkbox-border indeterminate:bg-checkbox-bg focus:outline-none focus-visible:shadow-focus-primary"
      />
      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true"
        className="pointer-events-none absolute size-3 text-checkbox-border opacity-0 peer-checked:opacity-100">
        <path d="M2.5 6.5 5 9l4.5-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true"
        className="pointer-events-none absolute size-3 text-checkbox-border opacity-0 peer-indeterminate:opacity-100">
        <path d="M2.5 6h7" strokeLinecap="round" />
      </svg>
    </span>
  );
}
