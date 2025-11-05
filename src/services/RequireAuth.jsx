import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthed } from "./auth";

export default function RequireAuth() {
  const ok = isAuthed();
  const loc = useLocation();
  return ok ? <Outlet /> : <Navigate to="/auth" state={{ from: loc }} replace />;
}
