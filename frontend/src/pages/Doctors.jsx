import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, MessageCircle, MoreVertical, X, Trash2, Edit } from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

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

function AddDoctorModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    full_name: "",
    username: "",
    email: "",
    password: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setError("");
    if (!form.full_name || !form.username || !form.email || !form.password) {
      return setError("Name, username, email and password are required");
    }
    if (form.password.length < 8) {
      return setError("Password must be at least 8 characters with a digit");
    }

    setLoading(true);
    try {
      await api.post("/auth/admin/users/create-doctor", {
        full_name: form.full_name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || null,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create doctor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white w-[500px] rounded-2xl shadow-xl overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 bg-teal-50">
          <h2 className="font-semibold">Add New Doctor</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label className="text-sm text-gray-500 mb-1 block">Full Name *</label>
            <input
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Dr. John Smith"
              className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-1 block">Username *</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="jsmith"
              className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-1 block">Email *</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="jsmith@clinic.com"
              className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-1 block">Password *</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min 8 chars, include a digit"
              className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-1 block">Phone</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+1 555 123 4567"
              className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Add Doctor"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Doctors() {
  const navigate = useNavigate();
  const { isAdmin, isPatient } = useAuth();

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [openMenu, setOpenMenu] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [editDoctor, setEditDoctor] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this doctor?")) return;
    try {
      await api.delete(`/doctors/${id}`);
      fetchDoctors();
    } catch (err) {
      console.error("Failed to delete doctor:", err);
    }
  };

  const handleEdit = (doc, e) => {
    e.stopPropagation();
    setEditDoctor(doc);
    setEditForm({
      specialty: doc.specialty || "",
      bio: doc.bio || "",
      years_of_experience: doc.years_of_experience || 0,
      is_available: doc.is_available,
      consultation_duration_minutes: doc.consultation_duration_minutes || 30,
    });
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      await api.put(`/doctors/${editDoctor.id}`, editForm);
      setEditDoctor(null);
      fetchDoctors();
    } catch (err) {
      console.error("Failed to update doctor:", err);
    } finally {
      setSaving(false);
    }
  };

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
            {!isPatient() && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-100 px-4 py-2 rounded-xl text-sm"
              >
                <option>All</option>
                <option>Available</option>
                <option>Unavailable</option>
              </select>
            )}

            {isAdmin() && (
              <button
                onClick={() => setOpenModal(true)}
                className="bg-teal-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-teal-600"
              >
                + Add Doctor
              </button>
            )}
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
                className="bg-white rounded-2xl border p-5 relative hover:shadow-md transition"
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
                          onClick={() => { navigate(`/doctors/${doc.id}`); setOpenMenu(null); }}
                          className="block w-full px-3 py-2 hover:bg-gray-100 text-left"
                        >
                          View
                        </button>
                        {isAdmin() && (
                          <>
                            <button
                              onClick={(e) => { handleEdit(doc, e); setOpenMenu(null); }}
                              className="block w-full px-3 py-2 hover:bg-gray-100 text-left text-teal-600"
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => { handleDelete(doc.id, e); setOpenMenu(null); }}
                              className="block w-full px-3 py-2 hover:bg-gray-100 text-left text-red-500"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* STATUS */}
                {!isPatient() && (
                  <div className="mt-2 mb-3">
                    <StatusBadge isAvailable={doc.is_available} />
                  </div>
                )}

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
                  {doc.rating > 0 && (
                    <p className="text-xs text-yellow-500 mt-1">
                      {"★".repeat(Math.round(doc.rating))} {doc.rating.toFixed(1)}
                    </p>
                  )}
                </div>

                {isPatient() && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => navigate(`/doctors/${doc.id}`)}
                      className="rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() =>
                        navigate("/appointments", { state: { bookDoctorId: doc.id } })
                      }
                      disabled={!doc.is_available}
                      className="rounded-xl bg-teal-500 px-3 py-2 text-sm text-white hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Book
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {openModal && (
        <AddDoctorModal
          onClose={() => setOpenModal(false)}
          onCreated={fetchDoctors}
        />
      )}

      {editDoctor && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-[500px] rounded-2xl shadow-xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 bg-teal-50 border-b">
              <h2 className="font-semibold">Edit Doctor - {editDoctor.full_name}</h2>
              <button onClick={() => setEditDoctor(null)} className="p-1 hover:bg-gray-200 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Specialty</label>
                <input
                  value={editForm.specialty}
                  onChange={(e) => setEditForm({...editForm, specialty: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Years of Experience</label>
                <input
                  type="number"
                  value={editForm.years_of_experience}
                  onChange={(e) => setEditForm({...editForm, years_of_experience: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Consultation Duration (minutes)</label>
                <input
                  type="number"
                  value={editForm.consultation_duration_minutes}
                  onChange={(e) => setEditForm({...editForm, consultation_duration_minutes: parseInt(e.target.value) || 30})}
                  className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editForm.is_available}
                    onChange={(e) => setEditForm({...editForm, is_available: e.target.checked})}
                    className="w-4 h-4 text-teal-500"
                  />
                  <span className="text-sm">Available for appointments</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditDoctor(null)} className="flex-1 py-2 bg-gray-100 rounded-xl text-sm">Cancel</button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex-1 py-2 bg-teal-500 text-white rounded-xl text-sm hover:bg-teal-600 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
