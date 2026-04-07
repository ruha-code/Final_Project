import MainLayout from "../layouts/MainLayout";

function Appointments() {
  return (
    <MainLayout>
      <h2 className="text-2xl font-bold mb-6">Appointments</h2>

      <div className="bg-white p-4 rounded-xl shadow">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b">
              <th className="p-2">Patient</th>
              <th className="p-2">Date</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>

          <tbody>
            <tr className="border-b">
              <td className="p-2">John Doe</td>
              <td className="p-2">10 Apr</td>
              <td className="p-2 text-green-500">Done</td>
            </tr>
          </tbody>
        </table>
      </div>
    </MainLayout>
  );
}

export default Appointments;
