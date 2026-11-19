import Icon from "../Icon";

// Search kecil di toolbar tabel (Figma: 200×36).
export default function SearchInput({ value, onChange, placeholder = "Search", className = "w-[200px]" }) {
  return (
    <div className={`relative ${className}`}>
      <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-500" />
      <input
        type="search"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 text-sm text-gray-900 shadow-xs placeholder:text-gray-500 focus:border-focus-border focus:outline-none focus:shadow-focus-primary"
      />
    </div>
  );
}
