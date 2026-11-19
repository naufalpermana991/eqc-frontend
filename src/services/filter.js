// Filter Checking history — dipakai FilterPopover & halaman CheckingHistory.
// Field data: checkedAt (ISO), supervisorStatus & managerStatus ("approved" | "rejected" | "pending").

export const DEFAULT_FILTER = {
  date: "all", // all | today | last7 | last30 | custom
  dateFrom: "", // YYYY-MM-DD, hanya untuk custom
  dateTo: "",
  approvals: [], // multi-pilih: "supervisor" | "manager". Kosong = semua data
};

export const DATE_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "last7", label: "Last 7 days" },
  { value: "last30", label: "Last 30 days" },
  { value: "custom", label: "Custom range" },
];

// Figma: checkbox "Supervisor approved" & "Manager approved"
export const APPROVAL_OPTIONS = [
  { value: "supervisor", label: "Supervisor approved", field: "supervisorStatus" },
  { value: "manager", label: "Manager approved", field: "managerStatus" },
];

export function countActiveFilters(filter) {
  return (filter.date !== "all" ? 1 : 0) + filter.approvals.length;
}

// Semua checkbox yang dicentang harus terpenuhi (AND).
// Centang dua-duanya = sudah di-approve Supervisor DAN Manager.
function matchApproval(row, approvals) {
  return APPROVAL_OPTIONS.filter((o) => approvals.includes(o.value)).every(
    (o) => row[o.field] === "approved",
  );
}

function matchDate(row, filter, now = new Date()) {
  const d = new Date(row.checkedAt);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysAgo = (n) => new Date(startOfToday.getTime() - n * 86400000);

  switch (filter.date) {
    case "today":
      return d >= startOfToday;
    case "last7":
      return d >= daysAgo(6);
    case "last30":
      return d >= daysAgo(29);
    case "custom":
      if (filter.dateFrom && d < new Date(`${filter.dateFrom}T00:00:00`)) return false;
      if (filter.dateTo && d > new Date(`${filter.dateTo}T23:59:59.999`)) return false;
      return true;
    default:
      return true;
  }
}

export function filterRows(rows, filter) {
  return rows.filter((r) => matchDate(r, filter) && matchApproval(r, filter.approvals));
}
