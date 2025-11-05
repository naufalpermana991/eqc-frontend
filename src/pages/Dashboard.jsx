import MeasurementTool from "../assets/measurementtool.png";
import Products from "../assets/product-img.png";

export default function Dashboard() {
  return (
    <>
      <p className="text-xl font-semibold font-display text-gray-900">
        Product Checking
      </p>

      <div className="w-full h-fit bg-white rounded-md p-3 mt-5">
        <table className="font-display mt-5 table-auto w-full border-collapse">
          <colgroup><col className="w-[20%]" /> {/* Checking point */}
            <col className="w-[15%]" /> {/* Standard */}
            <col className="w-[15%]" /> {/* Min */}
            <col className="w-[15%]" /> {/* Max */}
            <col className="w-[15%]" /> {/* Value */}</colgroup>

          <thead>
            <tr className="text-left border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-4 font-semibold rounded-l-md">
                Checking point
              </th>
              <th className="px-4 py-4 font-semibold">Standard</th>
              <th className="px-4 py-4 font-semibold">Min</th>
              <th className="px-4 py-4 font-semibold">Max</th>
              <th className="px-4 py-4 font-semibold rounded-r-md">Value</th>
            </tr>
          </thead>

          <tbody className="align-middle">
            <tr className="border-b border-gray-200">
              <td className="px-4 py-3 whitespace-nowrap">Height joint face</td>
              <td className="px-4 py-3 text-left">125</td>
              <td className="px-4 py-3 text-left">-0.05</td>
              <td className="px-4 py-3 text-left">+0.05</td>
              <td className="px-4 py-3">
                <input
                  type="text"
                  className="w-24 h-9 px-3 rounded-md border border-gray-300 bg-white text-left"
                  placeholder="0.00"
                />
              </td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-4 py-3 whitespace-nowrap">Chambers</td>
              <td className="px-4 py-3 text-left">125</td>
              <td className="px-4 py-3 text-left">-0.05</td>
              <td className="px-4 py-3 text-left">+0.05</td>
              <td className="px-4 py-3">
                <input
                  type="text"
                  className="w-24 h-9 px-3 rounded-md border border-gray-300 bg-white text-left"
                  placeholder="0.00"
                />
              </td>
            </tr>
          </tbody>
        </table>

        <button
          type="button"
          className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-md text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
        >
          Clear Data
        </button>

        <button
          type="button"
          className="text-white mt-5 bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-300 font-medium rounded-md text-sm px-5 py-2.5 text-center me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900"
        >
          Save
        </button>
      </div>
    </>
  );
}
