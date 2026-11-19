import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getCurrentUser, homeFor } from "./auth";

/**
 * Penjaga route.
 * - Belum login → ke /login (lalu kembali ke halaman semula setelah login).
 * - `role` diisi & role user berbeda → ke halaman awal role-nya sendiri
 *   (mis. Operator membuka /users → dikembalikan ke /operator/checking).
 */
export default function RequireAuth({ role }) {
  const user = getCurrentUser();
  const loc = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: loc }} replace />;
  if (role && user.role !== role) return <Navigate to={homeFor(user.role)} replace />;
  return <Outlet />;
}

/** Route "/" → halaman awal sesuai role. */
export function RoleHome() {
  const user = getCurrentUser();
  return <Navigate to={user ? homeFor(user.role) : "/login"} replace />;
}
