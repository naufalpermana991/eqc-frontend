import { useNavigate } from "react-router-dom";
import avatar from "../assets/avatar.png";
import Icon from "./Icon";
import NotificationBell from "./NotificationBell";
import { ROLE_LABEL, logout } from "../services/auth";

// Nama, ID & role dari sesi login (services/auth.js). Foto: sementara avatar contoh dari Figma.
// Lonceng notifikasi untuk semua role yang terlibat di alur approval (bukan admin).
const HAS_NOTIFICATIONS = ["operator", "supervisor", "manager"];
export default function Header({ user }) {
  const navigate = useNavigate();

  function onLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="flex h-24 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-8">
      <div className="relative w-80">
        <label htmlFor="global-search" className="sr-only">Search anything</label>
        <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-gray-500" />
        <input
          id="global-search"
          type="search"
          placeholder="Search anything"
          className="h-12 w-full rounded-lg border border-gray-300 bg-white pl-[46px] pr-3.5 text-body-1 text-gray-900 shadow-xs placeholder:text-gray-500 focus:border-focus-border focus:outline-none focus:shadow-focus-primary"
        />
      </div>

      <div className="flex items-center gap-4">
        <img src={avatar} alt="" className="size-12 rounded-full object-cover" />
        <div>
          <p className="text-base font-semibold leading-6 text-gray-700">{user?.name}</p>
          <p className="text-sm leading-5 text-gray-500">
            {user?.id}
            <span className="mx-2" aria-hidden="true">•</span>
            {ROLE_LABEL[user?.role] ?? user?.role}
          </p>
        </div>
        {/* Lonceng (operator, supervisor, manager) + logout, berdampingan di ujung kanan */}
        <div className="ml-2 flex items-center gap-1">
          {HAS_NOTIFICATIONS.includes(user?.role) && <NotificationBell />}
          <button
            type="button"
            onClick={onLogout}
            aria-label="Logout"
            className="rounded-lg p-3 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          >
            <Icon name="logout" className="size-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
