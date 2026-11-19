// =====================================================================
// API CUSTOMER — backend Go.
//   listCustomers()               → GET    /api/customers   (terbaru dulu)
//   createCustomer({ name })      → POST   /api/customers
//   updateCustomer(id, { name })  → PUT    /api/customers/:id
//   deleteCustomer(id)            → DELETE /api/customers/:id
// =====================================================================
import { ApiError, api } from "./api";

export { ApiError };

export const CUSTOMER_NAME_MAX = 100;

/** Validasi nama di form (backend memakai aturan yang sama). Return pesan error atau "". */
export function validateCustomerName(raw) {
  const name = String(raw ?? "").trim().replace(/\s+/g, " ");
  if (!name) return "Customer name is required.";
  if (name.length < 2) return "Customer name is too short.";
  if (name.length > CUSTOMER_NAME_MAX) return `Customer name is too long (max ${CUSTOMER_NAME_MAX} characters).`;
  return "";
}

const path = (id) => `/customers/${encodeURIComponent(id)}`;

export const listCustomers = () => api("/customers");
export const createCustomer = ({ name }) => api("/customers", { method: "POST", body: { name } });
export const updateCustomer = (id, { name }) => api(path(id), { method: "PUT", body: { name } });
export const deleteCustomer = (id) => api(path(id), { method: "DELETE" });
