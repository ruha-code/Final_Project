import { useParams } from "react-router-dom";
import { MapPin, Users } from "lucide-react";

const data = {
  1: {
    name: "Cardiology Department",
    image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3",
    about:
      "Focuses on diagnosis and treatment of heart diseases and cardiovascular conditions.",
    location: "Heart Center - 4th Floor",
    head: {
      name: "Dr. Amelia Hart",
      role: "Head of Department",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    },
    staff: [
      {
        name: "Dr. Kevin Lau",
        role: "Cardiologist",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      },
      {
        name: "Dr. Aisha Farhan",
        role: "Cardiologist",
        avatar: "https://randomuser.me/api/portraits/women/65.jpg",
      },
      {
        name: "Maria Gonzales",
        role: "Nurse",
        avatar: "https://randomuser.me/api/portraits/women/12.jpg",
      },
    ],
  },
};

export default function DepartmentDetails() {
  const { id } = useParams();
  const dep = data[id];

  if (!dep) return <div>Not found</div>;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <h1 className="text-2xl font-semibold">{dep.name}</h1>

      {/* TOP BLOCK */}
      <div className="grid grid-cols-3 gap-6">
        {/* IMAGE */}
        <div className="col-span-2">
          <img
            src={`${dep.image}?auto=format&fit=crop&w=1200`}
            className="w-full h-[300px] object-cover rounded-2xl"
          />
        </div>

        {/* INFO */}
        <div className="bg-white rounded-2xl border p-5 space-y-4">
          <h3 className="font-semibold text-lg">About</h3>
          <p className="text-sm text-gray-500">{dep.about}</p>

          <div className="space-y-2 text-sm text-gray-600">
            <p className="flex items-center gap-2">
              <MapPin size={14} /> {dep.location}
            </p>

            <p className="flex items-center gap-2">
              <Users size={14} /> {dep.staff.length} Staff
            </p>
          </div>

          {/* HEAD */}
          <div className="flex items-center gap-3 pt-3 border-t">
            <img src={dep.head.avatar} className="w-10 h-10 rounded-full" />

            <div>
              <p className="text-sm font-medium">{dep.head.name}</p>
              <p className="text-xs text-gray-400">{dep.head.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* LOWER GRID */}
      <div className="grid grid-cols-3 gap-6">
        {/* TEAM */}
        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-semibold mb-4">Team</h3>

          <div className="space-y-4">
            {dep.staff.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <img src={p.avatar} className="w-8 h-8 rounded-full" />

                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.role}</p>
                </div>

                <span className="ml-auto text-xs bg-teal-100 text-teal-600 px-2 py-1 rounded-lg">
                  {p.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* PERFORMANCE */}
        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-semibold mb-4">Performance</h3>

          <div className="space-y-4">
            <div>
              <p className="text-sm">Patient Satisfaction</p>
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-2 bg-teal-500 w-[90%] rounded-full" />
              </div>
            </div>

            <div>
              <p className="text-sm">Efficiency</p>
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-2 bg-teal-500 w-[80%] rounded-full" />
              </div>
            </div>

            <div>
              <p className="text-sm">Treatment Success</p>
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-2 bg-teal-500 w-[85%] rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* APPOINTMENTS CHART (пока что временно пусть стоит потом измениь) */}
        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-semibold mb-4">Appointments</h3>

          <div className="flex items-end gap-2 h-40">
            {[30, 50, 40, 45, 35, 60, 48].map((v, i) => (
              <div
                key={i}
                className="bg-teal-400 w-full rounded-lg"
                style={{ height: `${v}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
