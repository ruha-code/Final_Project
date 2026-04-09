import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, MessageCircle, MoreVertical, X } from "lucide-react";
import { api } from "../services/api";

function StatusBadge({ isAvailable }) {
  return (
    <span
      className={`text-xs px-2 py-1 rounded-lg font-medium ${
        isAvailable ? "bg-teal-100 text-teal-600" : "bg-red-100 text-red-500"
      }`}
    >
      {isAvailable ? "Available" : "Unavailable"}
    </span>
  );
}

export default function Doctors() {
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [openMenu, setOpenMenu] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const data = await api.get("/doctors");
        setDoctors(data);
      } catch (err) {
        console.error("Failed to fetch doctors:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const departments = [
    "All",
    ...new Set(doctors.map((d) => d.department_name).filter(Boolean)),
  ];

  const filteredDoctors = doctors.filter((doc) => {
    const depMatch = activeTab === "All" || doc.department_name === activeTab;
    const statusMatch =
      statusFilter === "All" ||
      (statusFilter === "Available" && doc.is_available) ||
      (statusFilter === "Unavailable" && !doc.is_available);
    return depMatch && statusMatch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Doctors</h2>

          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-100 px-4 py-2 rounded-xl text-sm"
            >
              <option>All</option>
              <option>Available</option>
              <option>Unavailable</option>
            </select>

            <button
              onClick={() => setOpenModal(true)}
              className="bg-teal-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-teal-600"
            >
              + Add Doctor
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-6 text-sm border-b pb-2 overflow-x-auto">
          {departments.map((dep) => (
            <button
              key={dep}
              onClick={() => setActiveTab(dep)}
              className={`pb-2 whitespace-nowrap ${
                activeTab === dep
                  ? "text-teal-600 border-b-2 border-teal-500"
                  : "text-gray-400"
              }`}
            >
              {dep}
            </button>
          ))}
        </div>

        {/* GRID */}
        {filteredDoctors.length === 0 ? (
          <p className="text-gray-400 text-sm">No doctors found</p>
        ) : (
          <div className="grid grid-cols-4 gap-6">
            {filteredDoctors.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border p-5 relative hover:shadow-md"
              >
                {/* TOP */}
                <div className="flex justify-between">
                  <h3 className="text-sm font-medium">{doc.full_name}</h3>

                  <div className="relative">
                    <button
                      onClick={() =>
                        setOpenMenu(openMenu === doc.id ? null : doc.id)
                      }
                    >
                      <MoreVertical size={16} />
                    </button>

                    {openMenu === doc.id && (
                      <div className="absolute right-0 bg-white border rounded-lg shadow text-sm w-28 z-10">
                        <button
                          onClick={() => navigate(`/doctors/${doc.id}`)}
                          className="block w-full px-3 py-2 hover:bg-gray-100"
                        >
                          View
                        </button>
                        <button className="block w-full px-3 py-2 hover:bg-gray-100">
                          Edit
                        </button>
                        <button className="block w-full px-3 py-2 text-red-500 hover:bg-gray-100">
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* STATUS */}
                <div className="mt-2 mb-3">
                  <StatusBadge isAvailable={doc.is_available} />
                </div>

                {/* AVATAR */}
                <div
                  onClick={() => navigate(`/doctors/${doc.id}`)}
                  className="flex justify-center cursor-pointer"
                >
                  {doc.avatar_url ? (
                    <img
                      src={doc.avatar_url}
                      className="w-20 h-20 rounded-full object-cover"
                      alt={doc.full_name}
                    />
                  ) : (
                    <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center text-lg font-bold text-teal-600">
                      {doc.full_name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                  )}
                </div>

                {/* INFO */}
                <div className="bg-gray-50 rounded-xl p-3 mt-4 text-center">
                  <p className="text-sm">
                    {doc.department_name || "No Department"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {doc.specialty || "General"}
                  </p>

                  <div className="flex justify-between mt-3">
                    <div className="flex gap-2">
                      <button className="p-2 bg-white border rounded-lg">
                        <MessageCircle size={14} />
                      </button>
                      <button className="p-2 bg-white border rounded-lg">
                        <Phone size={14} />
                      </button>
                    </div>

                    <button className="text-xs bg-teal-100 text-teal-600 px-3 py-1 rounded-lg">
                      Assign
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      {openModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white w-[700px] rounded-2xl shadow-xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 bg-teal-50">
              <h2 className="font-semibold">Add New Doctor</h2>
              <button onClick={() => setOpenModal(false)}>
                <X />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <input
                placeholder="Full Name"
                className="w-full p-3 border rounded-lg"
              />
              <input
                placeholder="Specialty"
                className="w-full p-3 border rounded-lg"
              />
              <input
                placeholder="Phone"
                className="w-full p-3 border rounded-lg"
              />
              <input
                placeholder="Email"
                className="w-full p-3 border rounded-lg"
              />

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setOpenModal(false)}
                  className="px-4 py-2 bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 bg-teal-500 text-white rounded-lg">
                  Add Doctor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
