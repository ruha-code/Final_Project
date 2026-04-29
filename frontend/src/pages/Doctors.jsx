import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, MessageCircle, MoreVertical, X, Trash2, Edit } from "lucide-react";
import Badge from "../components/Badge";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

function parseIntegerInput(value, fallback) {
  if (value === "" || value === null || value === undefined) return fallback;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

const FULL_NAME_REGEX = /^(?=.{2,100}$)\p{L}+(?:[ .'-]\p{L}+)*$/u;
const USERNAME_REGEX = /^[A-Za-z0-9._-]{3,30}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9()\-\s]{7,20}$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/;

function normalizeName(value) {
  return value.trim().replace(/\s+/g, " ");
}

function StatusBadge({ isAvailable }) {
  return (
    <Badge
      className={`rounded-lg px-2 py-1 text-xs font-medium ${
        isAvailable ? "bg-teal-100 text-teal-600" : "bg-red-100 text-red-500"
      }`}
    >
      {isAvailable ? "Available" : "Unavailable"}
    </Badge>
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

    const normalizedName = normalizeName(form.full_name);
    const normalizedUsername = form.username.trim();
    const normalizedEmail = form.email.trim().toLowerCase();
    const normalizedPhone = form.phone.trim();

    if (!normalizedName || !normalizedUsername || !normalizedEmail || !form.password) {
      return setError("Name, username, email and password are required");
    }
    if (!FULL_NAME_REGEX.test(normalizedName)) {
      return setError("Full name invalid");
    }
    if (!USERNAME_REGEX.test(normalizedUsername)) {
      return setError("Username invalid");
    }
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return setError("Email invalid");
    }
    if (normalizedPhone && !PHONE_REGEX.test(normalizedPhone)) {
      return setError("Phone invalid");
    }
    if (!STRONG_PASSWORD_REGEX.test(form.password)) {
      return setError("Weak password");
    }

    setLoading(true);
    try {
      await api.post("/auth/admin/users/create-doctor", {
        full_name: normalizedName,
        username: normalizedUsername,
        email: normalizedEmail,
        password: form.password,
        phone: normalizedPhone || null,
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
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-3 sm:p-0">
      <div className="bg-white w-full max-w-[500px] rounded-2xl shadow-xl overflow-hidden">
        <div className="flex justify-between items-center px-4 sm:px-6 py-4 bg-teal-50">
          <h2 className="font-semibold">Add New Doctor</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm text-gray-500 mb-1 block">Full Name *</label>
            <input
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-1 block">Username *</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
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
              className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-1 block">Phone</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-teal-500 text-white rounded-lg"
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
      setDoctors(Array.isArray(data) ? data : data?.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
        <div className="animate-spin h-12 w-12 border-b-2 border-teal-500 rounded-full"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 px-3 sm:px-0">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-semibold">Doctors</h2>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {!isPatient() && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-100 px-4 py-2 rounded-xl text-sm w-full sm:w-auto"
              >
                <option>All</option>
                <option>Available</option>
                <option>Unavailable</option>
              </select>
            )}

            {isAdmin() && (
              <button
                onClick={() => setOpenModal(true)}
                className="bg-teal-500 text-white px-4 py-2 rounded-xl text-sm w-full sm:w-auto"
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

        {/* GRID (RESPONSIVE FIX) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDoctors.map((doc) => (
            <div key={doc.id} className="bg-white rounded-2xl border p-5">
              <div className="flex justify-between">
                <h3 className="text-sm font-medium">{doc.full_name}</h3>
                <MoreVertical size={16} />
              </div>

              {!isPatient() && (
                <div className="mt-2 mb-3">
                  <StatusBadge isAvailable={doc.is_available} />
                </div>
              )}

              <div className="flex justify-center">
                {doc.avatar_url ? (
                  <img
                    src={doc.avatar_url}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-teal-100 rounded-full flex items-center justify-center">
                    {doc.full_name?.split(" ").map((n) => n[0]).join("")}
                  </div>
                )}
              </div>

              <div className="text-center mt-3 text-sm">
                {doc.department_name || "No Department"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {openModal && (
        <AddDoctorModal
          onClose={() => setOpenModal(false)}
          onCreated={fetchDoctors}
        />
      )}
    </>
  );
}