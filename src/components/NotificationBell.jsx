import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "./Icon";
import {
  NOTIFICATION_STYLE,
  clearAll,
  listNotifications,
  markAllRead,
  markRead,
  notificationTarget,
  notificationTitle,
} from "../services/notificationApi";

// Lonceng notifikasi di header.
// - Diperbarui saat halaman dibuka, setiap 60 detik, dan saat tab browser aktif kembali.
// - Klik notifikasi → ditandai dibaca, lalu ke halaman tindak lanjut
//   (operator: ukur ulang; supervisor & manager: pop-up approval hasil cek tersebut).

const POLL_MS = 60_000;

const fmtTime = (iso) =>
  new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export default function NotificationBell() {
  const navigate = useNavigate();
  const [data, setData] = useState({ unread: 0, items: [] });
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const refresh = useCallback(() => {
    listNotifications()
      .then(setData)
      .catch(() => {}); // lonceng tidak boleh mengganggu halaman kalau gagal dimuat
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  // Tutup saat klik di luar panel atau tekan Esc
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => wrapRef.current && !wrapRef.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle() {
    if (!open) refresh();
    setOpen((v) => !v);
  }

  async function openItem(n) {
    setOpen(false);
    if (!n.read) {
      setData((d) => ({
        unread: Math.max(0, d.unread - 1),
        items: d.items.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
      }));
      markRead([n.id]).catch(() => {});
    }
    navigate(notificationTarget(n));
  }

  async function readAll() {
    setData((d) => ({ unread: 0, items: d.items.map((x) => ({ ...x, read: true })) }));
    markAllRead().catch(refresh);
  }

  // Kosongkan panel. Hasil cek & pesan reject tetap ada di Checking history.
  async function clear() {
    setData({ unread: 0, items: [] });
    clearAll().catch(refresh);
  }

  const badge = data.unread > 9 ? "9+" : String(data.unread);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={data.unread ? `Notifications, ${data.unread} unread` : "Notifications"}
        className="relative rounded-lg p-3 text-gray-500 hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus-visible:shadow-focus-gray"
      >
        <Icon name="bell" className="size-6" />
        {data.unread > 0 && (
          <span className="absolute right-1.5 top-1.5 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-semibold leading-5 text-white">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          // Lebar dipasang inline supaya tidak bergantung pada kelas Tailwind baru
          style={{ width: 380, maxWidth: "calc(100vw - 32px)" }}
          className="absolute right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <p className="text-subtitle-2 text-gray-900">Notifications</p>
            <div className="flex items-center gap-4">
              {data.unread > 0 && (
                <button type="button" onClick={readAll} className="text-btn-sm text-primary hover:text-primary-hover">
                  Mark all as read
                </button>
              )}
              {data.items.length > 0 && (
                <button type="button" onClick={clear} className="text-btn-sm text-gray-500 hover:text-gray-700">
                  Clear all
                </button>
              )}
            </div>
          </div>

          {data.items.length === 0 ? (
            <p className="whitespace-nowrap px-4 py-6 text-center text-body-2 text-gray-500">No notifications yet.</p>
          ) : (
            <ul className="max-h-[420px] divide-y divide-gray-100 overflow-y-auto">
              {data.items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => openItem(n)}
                    className={`flex w-full gap-3 px-4 py-3 text-left hover:bg-gray-50 ${n.read ? "" : "bg-primary-soft/40"}`}
                  >
                    <span
                      className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full ${
                        (NOTIFICATION_STYLE[n.kind] ?? NOTIFICATION_STYLE.rejected_by_supervisor).cls
                      }`}
                    >
                      <Icon
                        name={(NOTIFICATION_STYLE[n.kind] ?? NOTIFICATION_STYLE.rejected_by_supervisor).icon}
                        className="size-4"
                        strokeWidth={2}
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-body-2 text-gray-900">
                        <span className={n.read ? "" : "font-semibold"}>{notificationTitle(n)}</span>
                      </span>
                      {n.message && (
                        <span className="mt-0.5 line-clamp-2 block text-caption text-gray-600">“{n.message}”</span>
                      )}
                      <span className="mt-1 block text-caption text-gray-400">
                        {n.inspectionId} · {fmtTime(n.createdAt)}
                      </span>
                    </span>
                    {!n.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
