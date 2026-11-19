import Icon from "../Icon";

// Secondary button (Figma: Filter, Export, Previous, Next) — h-9, border gray-300.
export default function Button({ icon, iconRight, children, className = "", ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 text-sm font-semibold text-gray-700 shadow-xs hover:bg-gray-50 focus:outline-none focus-visible:shadow-focus-gray disabled:cursor-not-allowed disabled:hover:bg-white ${className}`}
      {...props}
    >
      {icon && <Icon name={icon} className="size-5" />}
      {children}
      {iconRight && <Icon name={iconRight} className="size-5" />}
    </button>
  );
}
