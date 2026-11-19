import { NavLink } from "react-router-dom";
import logo from "../assets/logo.png";
import Icon from "./Icon";
import { MENU } from "../config/menu";

// Figma: Sidebar 280px, item 40px, gap antar menu 16px, antar sub-menu 8px.
const itemBase =
  "flex h-10 items-center rounded-md text-base font-semibold transition-colors select-none";
const itemState = ({ isActive }) =>
  isActive
    ? "bg-brand-50 text-brand-500 border-r-2 border-brand-500"
    : "text-gray-700 hover:bg-gray-50";

function SubItem({ item }) {
  return (
    <NavLink
      to={item.to}
      end
      className={(s) => `${itemBase} ml-8 gap-3.5 pl-5 ${itemState(s)}`}
    >
      {({ isActive }) => (
        <>
          <span
            className={`size-4 rounded-full border-2 ${isActive ? "border-brand-500" : "border-gray-500"}`}
            aria-hidden="true"
          />
          {item.label}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ role = "admin" }) {
  const items = MENU[role] ?? [];

  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col border-r border-gray-200 bg-white px-4 pt-8">
      <img src={logo} alt="Merah Putih" className="mx-auto h-[78px] w-auto" />

      <nav className="mt-8 flex flex-col gap-4" aria-label="Main menu">
        {items.map((item) =>
          item.children ? (
            <div key={item.label} className="flex flex-col gap-2">
              {/* Parent group: label saja, bukan link */}
              <div className={`${itemBase} gap-2 px-4 text-gray-700`}>
                <Icon name={item.icon} className="size-6 text-gray-500" />
                {item.label}
              </div>
              {item.children.map((child) => (
                <SubItem key={child.to} item={child} />
              ))}
            </div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              className={(s) => `${itemBase} gap-2 px-4 ${itemState(s)}`}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    name={item.icon}
                    className={`size-6 ${isActive ? "text-brand-500" : "text-gray-500"}`}
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          ),
        )}
      </nav>
    </aside>
  );
}
