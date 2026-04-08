import { useState } from "react";
import { useNavigate } from "react-router-dom";

const data = [
  {
    id: "PT-2035-001",
    name: "Alicia Perth",
    age: 34,
    gender: "♀",
    condition: "Hypertension",
    doctor: "Dr. Amelia Hart",
    department: "Cardiology",
    type: "Outpatient",
    date: "-",
    location: "-",
    status: "Discharged",
  },
  {
    id: "PT-2035-078",
    name: "Daniel Wong",
    age: 42,
    gender: "♂",
    condition: "Bone Fracture",
    doctor: "Dr. Daniel Obeng",
    department: "Orthopedics",
    type: "Inpatient",
    date: "11 March 2035",
    location: "Room 402B – 4th Floor",
    status: "Admitted",
  },
];

function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("");
}

function Status({ status }) {
  const styles = {
    Discharged: "bg-gray-100 text-gray-500",
    "In Treatment": "bg-teal-100 text-teal-600",
    Admitted: "bg-blue-100 text-blue-600",
  };

  return (
    <span
      className={`px-3 py-1 text-xs rounded-full font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function Patients() {
  const [selected, setSelected] = useState([]);
  const navigate = useNavigate();

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Patients</h2>

        <div className="flex gap-2">
          {["Gender", "Age", "Patient Type", "Condition"].map((f) => (
            <button
              key={f}
              className="px-3 py-1.5 bg-gray-100 text-sm rounded-lg hover:bg-gray-200 flex items-center gap-1"
            >
              {f} <span className="text-xs">▾</span>
            </button>
          ))}
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="grid grid-cols-9 px-6 py-3 text-xs text-gray-400 bg-gray-50">
          <span></span>
          <span>Name</span>
          <span>Gender / Age</span>
          <span>Condition</span>
          <span>Doctor</span>
          <span>Patient Type</span>
          <span>Admission Date</span>
          <span>Location</span>
          <span>Status</span>
        </div>

        {data.map((p) => (
          <div
            key={p.id}
            onClick={() => navigate(`/patients/${p.id}`)}
            className={`grid grid-cols-9 px-6 py-4 border-t items-center cursor-pointer transition
              hover:bg-gray-50 ${selected.includes(p.id) ? "bg-teal-50" : ""}`}
          >
            {/* CHECKBOX */}
            <input
              type="checkbox"
              onClick={(e) => e.stopPropagation()}
              checked={selected.includes(p.id)}
              onChange={() => toggleSelect(p.id)}
            />

            {/* NAME */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-sm font-semibold">
                {getInitials(p.name)}
              </div>

              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-gray-400">{p.id}</p>
              </div>
            </div>

            <span className="text-sm text-gray-500">
              {p.gender} / {p.age}
            </span>

            <span className="text-sm text-gray-600">{p.condition}</span>

            <div>
              <p className="text-sm text-gray-600">{p.doctor}</p>
              <p className="text-xs text-gray-400">{p.department}</p>
            </div>

            <span className="text-sm text-gray-500">{p.type}</span>

            <span className="text-sm text-gray-500">{p.date}</span>

            <span className="text-sm text-gray-500">{p.location}</span>

            <Status status={p.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default Patients;
