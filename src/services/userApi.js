// =====================================================================
// API USER — backend Go. Halaman ini hanya mengelola Manager, Supervisor,
// dan Operator; akun admin dibuat lewat `go run ./cmd/createadmin` di backend.
//   listUsers()              → GET    /api/users
//   createUser(formData)     → POST   /api/users        (multipart/form-data)
//   updateUser(id, formData) → PUT    /api/users/:id    (multipart/form-data)
//   deleteUser(id)           → DELETE /api/users/:id
// formData dibuat oleh buildUserFormData() di services/userForm.js.
// =====================================================================
import { ApiError, api } from "./api";

export { ApiError };

const path = (id) => `/users/${encodeURIComponent(id)}`;

export const listUsers = () => api("/users");
export const createUser = (form) => api("/users", { method: "POST", body: form });
export const updateUser = (id, form) => api(path(id), { method: "PUT", body: form });
export const deleteUser = (id) => api(path(id), { method: "DELETE" });
