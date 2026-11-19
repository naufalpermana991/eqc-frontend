import Button from "./Button";
import Icon from "../Icon";

// 1 2 3 … 8 9 10  (pola Figma: 3 awal + 3 akhir; di tengah: 1 … c-1 c c+1 … n)
function pageItems(page, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (page <= 3 || page >= total - 2) return [1, 2, 3, "…", total - 2, total - 1, total];
  return [1, "…", page - 1, page, page + 1, "…", total];
}

export default function Pagination({ page, totalPages, onPageChange, pageSize, pageSizeOptions = [5, 10, 20], onPageSizeChange }) {
  const total = Math.max(1, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Button icon="arrow-left" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Previous
      </Button>

      <ol className="flex items-center gap-0.5">
        {pageItems(page, total).map((p, i) =>
          p === "…" ? (
            <li key={`gap-${i}`} className="grid size-10 place-items-center text-sm font-medium text-gray-500">…</li>
          ) : (
            <li key={p}>
              <button
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={p === page ? "page" : undefined}
                className={`size-10 rounded-lg text-sm font-medium ${
                  p === page ? "bg-brand-50 text-brand-500" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            </li>
          ),
        )}
      </ol>

      <label className="flex items-center gap-2.5 text-sm text-gray-900">
        Show
        <span className="relative">
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-9 w-20 cursor-pointer appearance-none rounded-lg border border-gray-300 bg-white pl-3.5 pr-8 text-sm text-gray-500 shadow-xs focus:border-focus-border focus:outline-none focus:shadow-focus-primary"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <Icon name="chevron-down" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-500" />
        </span>
        data per page
      </label>

      <Button iconRight="arrow-right" disabled={page >= total} onClick={() => onPageChange(page + 1)}>
        Next
      </Button>
    </div>
  );
}
