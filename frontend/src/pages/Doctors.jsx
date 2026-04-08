import { useState } from "react";
import { Phone, MessageCircle } from "lucide-react";

const doctorsData = [
  {
    id: 1,
    name: "Dr. Amelia Hart",
    department: "Cardiology",
    schedule: "Mon - Fri (08:00 - 14:00)",
    status: "Available",
  },
  {
    id: 2,
    name: "Dr. Rizky Pratama",
    department: "General Medicine",
    schedule: "Mon - Sat (09:00 - 17:00)",
    status: "Available",
  },
  {
    id: 3,
    name: "Dr. Sophia Liang",
    department: "Pediatrics",
    schedule: "Mon - Fri (10:00 - 18:00)",
    status: "Available",
  },
  {
    id: 4,
    name: "Dr. Daniel Obeng",
    department: "Orthopedics",
    schedule: "Mon - Thu (08:00 - 12:00)",
    status: "Unavailable",
  },
  {
    id: 5,
    name: "Dr. Nina Alvarez",
    department: "Dermatology",
    schedule: "Tue - Sat (13:00 - 20:00)",
    status: "Available",
  },
  {
    id: 6,
    name: "Dr. Arjun Mehta",
    department: "Pulmonology",
    schedule: "Mon - Fri (08:00 - 16:00)",
    status: "Unavailable",
  },
];

const departments = [
  "All",
  "General Medicine",
  "Pediatrics",
  "Cardiology",
  "Orthopedics",
  "Dermatology",
  "Neurology",
];

function StatusBadge({ status }) {
  return (
    <span
      className={`text-xs px-2 py-1 rounded-lg font-medium ${
        status === "Available"
          ? "bg-teal-100 text-teal-600"
          : "bg-red-100 text-red-500"
      }`}
    >
      {status}
    </span>
  );
}

function Doctors() {
  const [activeTab, setActiveTab] = useState("All");

  const filteredDoctors =
    activeTab === "All"
      ? doctorsData
      : doctorsData.filter((d) => d.department === activeTab);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Doctors</h2>

        <div className="flex gap-3">
          <button className="bg-gray-100 px-4 py-2 rounded-xl text-sm hover:bg-gray-200">
            All Status
          </button>

          <button className="bg-teal-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-teal-600">
            + Add New Doctor
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-6 text-sm border-b pb-2">
        {departments.map((dep) => (
          <button
            key={dep}
            onClick={() => setActiveTab(dep)}
            className={`pb-2 transition ${
              activeTab === dep
                ? "text-teal-600 border-b-2 border-teal-500"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {dep}
          </button>
        ))}
      </div>

      {/* GRID */}
      <div className="grid grid-cols-4 gap-6">
        {filteredDoctors.map((doc) => (
          <div
            key={doc.id}
            className="bg-white rounded-2xl border p-5 hover:shadow-md transition group"
          >
            {/* TOP */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-gray-700">{doc.name}</h3>
              <span className="text-gray-300 cursor-pointer">•••</span>
            </div>

            {/* STATUS */}
            <div className="mb-3">
              <StatusBadge status={doc.status} />
            </div>

            {/* AVATAR */}
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 rounded-full bg-teal-100 flex items-center justify-center text-xl font-bold text-teal-600">
                {doc.name.split(" ")[1][0]}
              </div>
            </div>

            {/* INFO */}
            <div className="bg-gray-50 rounded-xl p-4 text-center space-y-1">
              <p className="text-sm font-medium">{doc.department}</p>
              <p className="text-xs text-gray-400">{doc.schedule}</p>

              {/* ACTIONS */}
              <div className="flex justify-between mt-3">
                <div className="flex gap-2">
                  <button className="p-2 bg-white rounded-lg border hover:bg-gray-100">
                    <MessageCircle size={14} />
                  </button>
                  <button className="p-2 bg-white rounded-lg border hover:bg-gray-100">
                    <Phone size={14} />
                  </button>
                </div>

                <button className="text-xs bg-teal-100 text-teal-600 px-3 py-1 rounded-lg hover:bg-teal-200">
                  Assign
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Doctors;
