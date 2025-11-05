import logo from "../assets/logo.png";
import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/auth"; // sesuai path-mu

export default function Sidebar() {
  const navigate = useNavigate();
  const onLogout = () => {
    logout();
    navigate("/auth", { replace: true }); // atau "/login" kalau route-mu itu
  };

  return (
    <div className="h-full w-full text-left bg-white flex flex-col m-0 gap-6 ">
      <img src={logo} alt="" srcSet="" className="w-40 mx-auto" />
      <div
        className="px-3 gap-2 flex hover:bg-gray-50 py-2 rounded-md cursor-pointer select-none
    text-gray-700
    has-[a[aria-current='page']]:bg-red-50
    has-[a[aria-current='page']]:border-r-2
    has-[a[aria-current='page']]:border-red-500
    has-[a[aria-current='page']]:text-red-600"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="size-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
        <NavLink to="/" end className="text-sm pr-12 font-semibold">
          Product Checking
        </NavLink>
      </div>

      <div
        className="px-3 gap-2 flex hover:bg-gray-50 py-2 rounded-md cursor-pointer select-none     text-gray-700
    has-[a[aria-current='page']]:bg-red-50
    has-[a[aria-current='page']]:border-r-2
    has-[a[aria-current='page']]:border-red-500
    has-[a[aria-current='page']]:text-red-600"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="size-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75"
          />
        </svg>
        <NavLink to="/history" className="text-sm pr-12 font-semibold ">
          Checking History
        </NavLink>
      </div>

      <div
        onClick={onLogout}
        className="px-3 gap-2 flex hover:bg-gray-50 py-2 rounded-md cursor-pointer select-none text-gray-700"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="size-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
          />
        </svg>

        <span className="text-sm pr-12 font-semibold">Logout</span>
      </div>
    </div>

    // <>
    //   <nav className="sidebar-nav">
    //     <div className="w-full bg-teal-50">sidebar</div>
    //     <ul className="menu">
    //       <li>
    //         <NavLink to="/" end className="menu-link">
    //           Dashboard
    //         </NavLink>
    //       </li>
    //       <li>
    //         <NavLink to="/history" className="menu-link">
    //           History
    //         </NavLink>
    //       </li>
    //     </ul>
    //   </nav>
    // </>
  );
}
