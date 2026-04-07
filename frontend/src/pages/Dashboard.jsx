import MainLayout from "../layouts/MainLayout";

function Dashboard() {
  return (
    <MainLayout>
      <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="text-gray-500">Appointments</h3>
          <p className="text-2xl font-bold">24</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="text-gray-500">Patients</h3>
          <p className="text-2xl font-bold">120</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="text-gray-500">Doctors</h3>
          <p className="text-2xl font-bold">8</p>
        </div>
      </div>
    </MainLayout>
  );
}

export default Dashboard;
