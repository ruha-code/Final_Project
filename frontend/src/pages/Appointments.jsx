function Appointments() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Appointments</h2>

      <div className="bg-gray-50 p-6 rounded-xl border">
        {/* HEADER */}
        <div className="grid grid-cols-3 text-xs text-gray-400 uppercase mb-3">
          <span>Patient</span>
          <span>Date</span>
          <span>Status</span>
        </div>

        {/* ROW */}
        <div className="grid grid-cols-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition">
          <span className="font-medium text-gray-700">John Doe</span>
          <span className="text-gray-500">10 Apr</span>
          <span className="text-green-600 font-medium">Done</span>
        </div>
      </div>
    </div>
  );
}

export default Appointments;
