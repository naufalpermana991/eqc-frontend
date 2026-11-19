// Menu sidebar per role (role dari services/auth.js → getCurrentUser().role).
// Admin: Figma UI Design 1 → Admin. Operator: Figma UI Design 1 → Operator.
// Tambah MANAGER / SUPERVISOR di sini (+ ROLE_HOME di auth.js) saat halamannya dibuat.
export const MENU = {
  admin: [
    { label: "Checking history", icon: "clipboard-check", to: "/history" },
    {
      label: "User",
      icon: "users",
      children: [
        { label: "Add users", to: "/users/new" },
        { label: "User list", to: "/users" },
      ],
    },
    { label: "Customer", icon: "briefcase", to: "/customers" },
    {
      label: "Product",
      icon: "cube",
      children: [
        { label: "Add product", to: "/products/new" },
        { label: "Product list", to: "/products" },
      ],
    },
    { label: "Measurement tool", icon: "wrench", to: "/measurement-tools" },
  ],
  manager: [{ label: "Product approval", icon: "clipboard-check", to: "/manager/approval" }],
  supervisor: [{ label: "Product approval", icon: "clipboard-check", to: "/supervisor/approval" }],
  operator: [
    { label: "Product checking", icon: "check-circle", to: "/operator/checking" },
    { label: "Checking history", icon: "clipboard-check", to: "/operator/history" },
  ],
};
