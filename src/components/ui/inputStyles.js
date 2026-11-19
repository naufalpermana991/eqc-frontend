// Style input teks/select (Figma: form Add user, Login). Error → border & ring merah.
// size "md" = 48px (form), "sm" = 40px (input di dalam tabel, mis. checking point).
const base =
  "w-full rounded-lg border bg-white px-3.5 shadow-xs " +
  "placeholder:text-gray-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500";
const SIZES = { md: "h-12 text-body-1", sm: "h-10 text-body-2" };

export function inputClass(hasError, { muted = false, size = "md" } = {}) {
  return `${base} ${SIZES[size]} ${muted ? "text-gray-500" : "text-gray-900"} ${
    hasError
      ? "border-error-300 focus:border-error-300 focus:shadow-focus-error"
      : "border-gray-300 focus:border-focus-border focus:shadow-focus-primary"
  }`;
}
