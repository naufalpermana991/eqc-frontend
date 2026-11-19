import Icon from "../Icon";

// Nama approver + badge status (Figma: ✓ hijau / ✕ merah, 24px).
const BADGE = {
  approved: { icon: "check", cls: "bg-success-50 text-success-500", label: "Approved" },
  rejected: { icon: "x", cls: "bg-error-50 text-error-500", label: "Rejected" },
};

// wide: nama satu baris tanpa batas lebar (dipakai di pop-up, bukan di kolom tabel)
export default function ApprovalStatus({ name, status, wide = false }) {
  // Belum diproses → "-" (Figma: Operator → Checking history)
  if (!status || status === "pending") {
    return (
      <span className="text-table-cell text-gray-900">
        -<span className="sr-only">Waiting for approval</span>
      </span>
    );
  }
  const b = BADGE[status];
  return (
    <div className="flex items-center gap-2 xl:gap-4">
      {/* Nama mengisi sisa lebar kolom, maksimal 72px seperti Figma, terpotong di baris ke-2 */}
      <span
        className={wide ? "whitespace-nowrap" : "line-clamp-2 min-w-0 max-w-[72px] flex-1 break-words"}
        title={name}
      >
        {name}
      </span>
      <span className={`grid size-6 shrink-0 place-items-center rounded-full ${b.cls}`} title={b.label}>
        <Icon name={b.icon} className="size-3.5" strokeWidth={2.5} />
        <span className="sr-only">{b.label}</span>
      </span>
    </div>
  );
}
