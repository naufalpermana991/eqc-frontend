import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppShell from "./layout/AppShell";
import Dashboard from "./pages/Dashboard";
import CheckingHistory from "./pages/CheckingHistory";
import AuthSimple from "./pages/AuthSimple";
import RequireAuth from "./services/RequireAuth";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* public */}
        <Route path="/auth" element={<AuthSimple />} />

        {/* protected */}
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="history" element={<CheckingHistory />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
