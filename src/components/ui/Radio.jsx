// Radio 16px — token sama dengan Checkbox (`checkbox`), Figma: Prototype 1 → Filter.
export default function Radio({ name, value, checked, onChange, children }) {
  return (
    <label className="flex w-fit cursor-pointer items-center gap-2 text-body-2 text-gray-700">
      <span className="relative grid size-4 shrink-0 place-items-center">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={() => onChange(value)}
          className="peer size-4 cursor-pointer appearance-none rounded-full border border-gray-300 bg-white checked:border-checkbox-border checked:bg-checkbox-bg focus:outline-none focus-visible:shadow-focus-primary"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute size-1.5 rounded-full bg-checkbox-border opacity-0 peer-checked:opacity-100"
        />
      </span>
      {children}
    </label>
  );
}
