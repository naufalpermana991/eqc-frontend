import avatar from "../assets/avatar.png";

export default function Header() {
  return (
    <div className="header-inner w-full justify-between flex items-center">
      <label htmlFor="search" className="sr-only">
        Search Anything
      </label>

      <div className="relative w-[320px]">
        {/* icon kiri */}
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-500 pointer-events-none"
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>

        <input
          id="search"
          type="text"
          placeholder="Search anything"
          className="h-10 w-full rounded-md border border-gray-300 bg-white ps-10 pe-3 placeholder:text-gray-500"
        />
      </div>

      <div className="flex gap-4">
        <img src={avatar} alt="" className="w-12" />
        <div className="flex flex-col">
          <p className="text-base font-display font-semibold text-gray-700">
            Wade Warren
          </p>
          <p className="text-gray-700 text-sm">
            <span>OP-2355</span>
            <span className='before:content-["•"] before:mx-2 before:text-slate-400'>
              Operator
            </span>
          </p>
        </div>

        <div className="p-3 rounded-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
