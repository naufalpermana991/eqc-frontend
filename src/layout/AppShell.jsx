import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { getCurrentUser } from "../services/auth";

// Figma: sidebar 280px | header 96px | konten bg gray-50, padding 32 (x) / 24 (top)
// Satu layout untuk semua role: menu sidebar & data header mengikuti user yang login.
export default function AppShell() {
  const user = getCurrentUser();
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">
      <Sidebar role={user?.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header user={user} />
        <main className="relative flex-1 overflow-auto px-8 pb-8 pt-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
