import { useParams } from "react-router-dom";
import { User, Phone, Mail, MapPin, HeartPulse } from "lucide-react";

const mock = {
  "PT-2035-078": {
    name: "Daniel Wong",
    phone: "+62 812-9012-4477",
    email: "daniel.wong@hospital.com",
    address: "Jakarta, Indonesia",
    age: 42,
    gender: "Male",
    blood: "O+",
    doctor: "Dr. Daniel Obeng",
    condition: "Bone Fracture",
  },
};

function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("");
}

export default function PatientDetails() {
  const { id } = useParams();
  const p = mock[id];

  if (!p) return <div>Not found</div>;

  return (
    <div className="space-y-6">
      {/* TOP PROFILE */}
      <div className="grid grid-cols-4 gap-6">
        {/* LEFT */}
        <div className="col-span-3 bg-white rounded-2xl border p-6 flex gap-6">
          <div className="w-24 h-24 bg-teal-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-teal-600">
            {getInitials(p.name)}
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <h2 className="text-xl font-semibold">{p.name}</h2>
              <p className="text-sm text-gray-400">{id}</p>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Phone size={14} /> {p.phone}
              </div>

              <div className="flex items-center gap-2">
                <Mail size={14} /> {p.email}
              </div>

              <div className="flex items-center gap-2">
                <MapPin size={14} /> {p.address}
              </div>
            </div>

            {/* TAGS */}
            <div className="flex gap-3 flex-wrap text-xs">
              <span className="bg-gray-100 px-3 py-1 rounded-lg">
                {p.age} / {p.gender}
              </span>
              <span className="bg-gray-100 px-3 py-1 rounded-lg">
                {p.blood}
              </span>
              <span className="bg-gray-100 px-3 py-1 rounded-lg">
                {p.condition}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT CARD */}
        <div className="bg-gradient-to-br from-teal-400 to-teal-600 text-white rounded-2xl p-6 flex flex-col justify-between">
          <p className="text-sm opacity-80">Medlink</p>

          <div>
            <h3 className="text-lg font-semibold">{p.name}</h3>
            <p className="text-xs opacity-80">{id}</p>
          </div>

          <p className="text-xs opacity-80">Premium Patient</p>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-4 gap-4">
        {[
          ["Blood Sugar", "171 mg/dL"],
          ["Weight", "62kg"],
          ["Temperature", "37°C"],
        ].map(([title, val]) => (
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-400">{title}</p>
            <p className="font-semibold text-lg">{val}</p>
          </div>
        ))}
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="col-span-2 space-y-6">
          {/* GRAPH */}
          <div className="bg-white border rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <HeartPulse size={16} /> Blood Pressure
            </h3>

            <div className="flex items-end gap-3 h-40">
              {[60, 80, 50, 90, 70, 85, 65].map((v, i) => (
                <div
                  key={i}
                  className="flex-1 bg-teal-500 rounded-t-lg"
                  style={{ height: `${v}%` }}
                />
              ))}
            </div>
          </div>

          {/* APPOINTMENTS */}
          <div className="bg-white border rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-4">Appointments</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>10 Mar • Consultation</span>
                <span className="text-teal-500">Completed</span>
              </div>

              <div className="flex justify-between">
                <span>11 Mar • Surgery</span>
                <span className="text-blue-500">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          {/* MEDICAL */}
          <div className="bg-white border rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-3">Medical Info</h3>

            <div className="text-sm text-gray-600 space-y-2">
              <p>Condition: {p.condition}</p>
              <p>Doctor: {p.doctor}</p>
            </div>
          </div>

          {/* REPORTS */}
          <div className="bg-white border rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-3">Health Reports</h3>

            <div className="space-y-2">
              {["Blood Test", "MRI", "X-Ray"].map((r) => (
                <div className="flex justify-between bg-gray-50 p-3 rounded-lg">
                  <span>{r}.pdf</span>
                  <span>⬇</span>
                </div>
              ))}
            </div>
          </div>

          {/* NOTES */}
          <div className="bg-white border rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-3">Notes</h3>

            <p className="text-sm text-gray-600">
              Patient recovering well. Continue monitoring vitals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
