// AppShell.jsx
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function AppShell() {
  return (
    <>
      <div className="flex flex-row h-screen w-screen overflow-hidden">
        {/* SIDEBAR: HTML biasa, lebar tetap */}
        <aside className="w-fit bg-white border-r border-gray-300">
          <div className="p-4"><Sidebar/></div>
          {/* …isi menu html biasa… */}
        </aside>

        {/* KOLOM KANAN: header + konten scrollable */}
        <div className="flex-1 flex flex-col">
          {/* <header className="h-20 border-b border-gray-300 bg-white px-4">
            <div className="h-full flex items-center"><Header/></div>
          </header> */}

          <main className="flex-1 overflow-auto">
            <div className="p-4 mt-5">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
