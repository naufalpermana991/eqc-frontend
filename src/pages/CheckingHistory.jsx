import RowActions from "../components/RowActions";

export default function History() {
  return (
    <>
      <p className="text-xl font-semibold font-display text-gray-900">
        Checking history
      </p>

      <div className="w-full h-fit bg-white rounded-md p-3 mt-5">
        <table className="font-display mt-5 table-auto w-full border-collapse">
          <colgroup>
            <col className="w-[50%]" />
            <col className="w-[50%]" />
            <col className="w-[50%]" />
          </colgroup>

          <thead>
            <tr className="text-left border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-4 font-semibold rounded-l-md">
                Checking date
              </th>
              <th className="px-4 py-4 font-semibold ">Customer</th>
              <th className="px-4 py-4 font-semibold ">Action</th>
            </tr>
          </thead>

          <tbody className="align-middle">
            <tr className="border-b border-gray-200">
              <td className="px-4 py-3">09/06/2024 08:30:20 AM</td>
              <td className="px-4 py-3 text-left">PT Sinar Alumsarana</td>
              <td className="px-4 py-3 text-left">
                <RowActions />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
