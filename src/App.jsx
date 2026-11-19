import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./layout/AppShell";
import CheckingHistory from "./pages/shared/CheckingHistory";
import Login from "./pages/auth/Login";
import AddUser from "./pages/admin/AddUser";
import UserList from "./pages/admin/UserList";
import Customers from "./pages/admin/Customers";
import AddProduct from "./pages/admin/AddProduct";
import ProductList from "./pages/admin/ProductList";
import MeasurementTools from "./pages/admin/MeasurementTools";
import ProductChecking from "./pages/operator/ProductChecking";
import ManagerApproval from "./pages/manager/ManagerApproval";
import SupervisorApproval from "./pages/supervisor/SupervisorApproval";
import InspectionReport from "./pages/shared/InspectionReport";
import RequireAuth, { RoleHome } from "./services/RequireAuth";
import ToastProvider from "./components/ToastProvider";

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          {/* public */}
          <Route path="/login" element={<Login />} />
          <Route path="/auth" element={<Navigate to="/login" replace />} />

          {/* "/" → halaman awal sesuai role user */}
          <Route index element={<RoleHome />} />

          {/* protected — Admin */}
          <Route element={<RequireAuth role="admin" />}>
            <Route element={<AppShell />}>
              <Route path="history" element={<CheckingHistory />} />
              <Route path="users/new" element={<AddUser />} />
              <Route path="users" element={<UserList />} />
              <Route path="customers" element={<Customers />} />
              <Route path="products/new" element={<AddProduct />} />
              <Route path="products" element={<ProductList />} />
              <Route path="measurement-tools" element={<MeasurementTools />} />
            </Route>
          </Route>

          {/* protected — Operator (semua path /operator/...) */}
          <Route path="operator" element={<RequireAuth role="operator" />}>
            <Route element={<AppShell />}>
              <Route index element={<Navigate to="checking" replace />} />
              <Route path="checking" element={<ProductChecking />} />
              <Route path="history" element={<CheckingHistory scope="mine" />} />
            </Route>
          </Route>

          {/* protected — Supervisor (semua path /supervisor/...) */}
          <Route path="supervisor" element={<RequireAuth role="supervisor" />}>
            <Route element={<AppShell />}>
              <Route index element={<Navigate to="approval" replace />} />
              <Route path="approval" element={<SupervisorApproval />} />
            </Route>
          </Route>

          {/* protected — Manager (semua path /manager/...) */}
          <Route path="manager" element={<RequireAuth role="manager" />}>
            <Route element={<AppShell />}>
              <Route index element={<Navigate to="approval" replace />} />
              <Route path="approval" element={<ManagerApproval />} />
            </Route>
          </Route>

          {/* protected — semua role: laporan hasil cek (tanpa sidebar, ukuran A4) */}
          <Route element={<RequireAuth />}>
            <Route path="report/:id" element={<InspectionReport />} />
          </Route>

          {/* alamat tidak dikenal → halaman awal */}
          <Route path="*" element={<RoleHome />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
