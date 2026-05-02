import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MoreVertical, X } from "lucide-react";
import Badge from "../components/Badge";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  isValidDoctorPhone,
  isValidDoctorSpecialty,
  normalizeDoctorPhone,
  normalizeWhitespace,
} from "../utils/doctorValidation";

const AUTO_REFRESH_INTERVAL_MS = 15000;

function parseIntegerInput(value, fallback) {
  if (value === "" || value === null || value === undefined) return fallback;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

const FULL_NAME_REGEX = /^(?=.{2,100}$)\p{L}+(?:[ .'-]\p{L}+)*$/u;
const USERNAME_REGEX = /^[A-Za-z0-9._-]{3,30}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/;

function StatusBadge({ isAvailable }) {
  return (
    <Badge
      className={`rounded-lg px-2 py-1 text-xs font-medium ${
        isAvailable ? "bg-teal-100 text-teal-600" : "bg-gray-100 text-gray-500"
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
    department_id: "",
    specialty: "",
    license_number: "",
    license_status: "PENDING",
    rating: "0",
    years_of_experience: "",
    consultation_duration_minutes: "30",
  });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/departments")
      .then((data) => setDepartments(Array.isArray(data) ? data : []))
      .catch(() => setDepartments([]));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setError("");

    const normalizedName = normalizeWhitespace(form.full_name);
    const normalizedUsername = form.username.trim();
    const normalizedEmail = form.email.trim().toLowerCase();
    const normalizedPhone = normalizeDoctorPhone(form.phone);
    const normalizedSpecialty = normalizeWhitespace(form.specialty);

    if (
      !normalizedName ||
      !normalizedUsername ||
      !normalizedEmail ||
      !form.password
    ) {
      return setError("Name, username, email and password are required");
    }
    if (!FULL_NAME_REGEX.test(normalizedName)) {
      return setError(
        "Full name must contain letters and may include spaces.",
      );
    }
    if (!USERNAME_REGEX.test(normalizedUsername)) {
      return setError(
        "Username must be 3-30 characters and can include letters, numbers.",
      );
    }
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return setError("Please enter a valid email address.");
    }
    if (form.phone.trim() && !isValidDoctorPhone(normalizedPhone)) {
      return setError(
        "Phone must use international format, e.g. +15550123456.",
      );
    }
    if (normalizedSpecialty && !isValidDoctorSpecialty(normalizedSpecialty)) {
      return setError(
        "Specialty must contain meaningful text, e.g. Cardiologist.",
      );
    }
    if (!STRONG_PASSWORD_REGEX.test(form.password)) {
      return setError(
        "Password must be at least 8 characters.",
      );
    }

    setLoading(true);
    try {
      await api.post("/auth/admin/users/create-doctor", {
        full_name: normalizedName,
        username: normalizedUsername,
        email: normalizedEmail,
        password: form.password,
        phone: normalizedPhone || null,
        department_id: form.department_id ? Number(form.department_id) : null,
        specialty: normalizedSpecialty || null,
        license_number: form.license_number.trim() || null,
        license_status: form.license_status,
        rating: parseFloat(form.rating) || 0,
        years_of_experience: form.years_of_experience
          ? Number(form.years_of_experience)
          : 0,
        consultation_duration_minutes: form.consultation_duration_minutes
          ? Number(form.consultation_duration_minutes)
          : 30,
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
      <div className="bg-white w-full max-w-[500px] rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
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
            <label className="text-sm text-gray-500 mb-1 block">
              Full Name *
            </label>
            <input
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="John Smith"
              className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-1 block">
              Username *
            </label>
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
            <label className="text-sm text-gray-500 mb-1 block">
              Password *
            </label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Use uppercase, lowercase and a number"
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

          <div>
            <label className="text-sm text-gray-500 mb-1 block">Department</label>
            <select
              name="department_id"
              value={form.department_id}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="">No department</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-1 block">Specialty</label>
            <input
              name="specialty"
              value={form.specialty}
              onChange={handleChange}
              placeholder="Cardiologist"
              className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-1 block">License Number</label>
            <input
              name="license_number"
              value={form.license_number}
              onChange={handleChange}
              placeholder="Medical license number"
              className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm text-gray-500 mb-1 block">License Status</label>
              <select
                name="license_status"
                value={form.license_status}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-teal-400"
              >
                <option value="PENDING">Pending</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Rating</label>
              <input
                name="rating"
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={form.rating}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Experience</label>
              <input
                name="years_of_experience"
                type="number"
                min="0"
                max="50"
                value={form.years_of_experience}
                onChange={handleChange}
                placeholder="0"
                className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Consultation</label>
              <input
                name="consultation_duration_minutes"
                type="number"
                min="10"
                max="120"
                step="5"
                value={form.consultation_duration_minutes}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin, isPatient } = useAuth();
  const selectedDepartmentId = searchParams.get("department_id");

  const [doctors, setDoctors] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDepartmentId, setActiveDepartmentId] = useState(
    selectedDepartmentId || "All"
  );
  const [statusFilter, setStatusFilter] = useState("All");
  const [openMenu, setOpenMenu] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [editDoctor, setEditDoctor] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");

  const fetchDoctors = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
        setPageError("");
      }
      const data = await api.get("/doctors");
      setDoctors(Array.isArray(data) ? data : data?.items || []);
    } catch (err) {
      setPageError(err.message || "Failed to fetch doctors");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadDoctors = async ({ silent = false } = {}) => {
      try {
        if (!silent) {
          setLoading(true);
          setPageError("");
        }
        const data = await api.get("/doctors");
        if (cancelled) return;
        setDoctors(Array.isArray(data) ? data : data?.items || []);
      } catch (err) {
        if (!cancelled) {
          setPageError(err.message || "Failed to fetch doctors");
        }
      } finally {
        if (!cancelled && !silent) {
          setLoading(false);
        }
      }
    };

    void loadDoctors();
    const intervalId = setInterval(() => {
      void loadDoctors({ silent: true });
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    setActiveDepartmentId(selectedDepartmentId || "All");
  }, [selectedDepartmentId]);

  useEffect(() => {
    api.get("/departments")
      .then((data) => setDepartmentOptions(Array.isArray(data) ? data : []))
      .catch(() => setDepartmentOptions([]));
  }, []);

  const handleDepartmentTabChange = (departmentId) => {
    setActiveDepartmentId(departmentId);

    const nextParams = new URLSearchParams(searchParams);
    if (departmentId === "All") {
      nextParams.delete("department_id");
    } else {
      nextParams.set("department_id", departmentId);
    }
    setSearchParams(nextParams, { replace: true });
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this doctor?")) return;
    try {
      await api.delete(`/doctors/${id}`);
      fetchDoctors();
    } catch (err) {
      setPageError(err.message || "Failed to delete doctor");
    }
  };

  const handleEdit = (doc, e) => {
    e.stopPropagation();
    setEditDoctor(doc);
    setEditForm({
      specialty: doc.specialty || "",
      bio: doc.bio || "",
      department_id: doc.department_id ? String(doc.department_id) : "",
      license_number: doc.license_number || "",
      license_status: doc.license_status || "PENDING",
      rating: doc.rating != null ? String(doc.rating) : "0",
      years_of_experience: doc.years_of_experience
        ? String(doc.years_of_experience)
        : "",
      is_available: doc.is_available,
      consultation_duration_minutes: doc.consultation_duration_minutes
        ? String(doc.consultation_duration_minutes)
        : "30",
    });
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      await api.put(`/doctors/${editDoctor.id}`, {
        ...editForm,
        department_id: editForm.department_id ? Number(editForm.department_id) : null,
        license_number: editForm.license_number?.trim() || null,
        license_status: editForm.license_status || "PENDING",
        rating: parseFloat(editForm.rating) || 0,
        years_of_experience: parseIntegerInput(editForm.years_of_experience, 0),
        consultation_duration_minutes: parseIntegerInput(
          editForm.consultation_duration_minutes,
          30,
        ),
      });
      setEditDoctor(null);
      fetchDoctors();
    } catch (err) {
      setPageError(err.message || "Failed to update doctor");
    } finally {
      setSaving(false);
    }
  };

  const doctorDepartmentTabs = Array.from(
    new Map(
      doctors
        .filter((doctor) => doctor.department_id && doctor.department_name)
        .map((doctor) => [String(doctor.department_id), doctor.department_name])
    ).entries()
  ).map(([id, name]) => ({ id, name }));

  const departmentTabs = [
    { id: "All", name: "All" },
    ...(departmentOptions.length > 0
      ? departmentOptions.map((department) => ({
          id: String(department.id),
          name: department.name,
        }))
      : doctorDepartmentTabs),
  ];

  const filteredDoctors = doctors.filter((doc) => {
    const depMatch =
      activeDepartmentId === "All" ||
      String(doc.department_id) === activeDepartmentId;
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
                className="bg-teal-500 text-white px-4 py-2 rounded-xl text-sm w-full sm:w-auto hover:bg-teal-600"
              >
                + Add Doctor
              </button>
            )}
          </div>
        </div>

        {pageError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 flex items-center justify-between">
            <span>{pageError}</span>
            <button onClick={() => setPageError("")} className="ml-4 opacity-70 hover:opacity-100">
              <X size={16} />
            </button>
          </div>
        )}

        {/* TABS */}
        <div className="flex gap-6 text-sm border-b pb-2 overflow-x-auto">
          {departmentTabs.map((dep) => (
            <button
              key={dep.id}
              onClick={() => handleDepartmentTabChange(dep.id)}
              className={`pb-2 whitespace-nowrap ${
                activeDepartmentId === dep.id
                  ? "text-teal-600 border-b-2 border-teal-500"
                  : "text-gray-400"
              }`}
            >
              {dep.name}
            </button>
          ))}
        </div>

        {/* GRID */}
        {filteredDoctors.length === 0 ? (
          <p className="text-gray-400 text-sm">No doctors found</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDoctors.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border p-5 relative flex flex-col items-center text-center"
              >
                {/* MENU */}
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() =>
                      setOpenMenu(openMenu === doc.id ? null : doc.id)
                    }
                    className="p-1 rounded-lg hover:bg-gray-100"
                  >
                    <MoreVertical size={16} className="text-gray-400" />
                  </button>

                  {openMenu === doc.id && (
                    <div className="absolute right-0 bg-white border rounded-lg text-sm w-28 z-10">
                      <button
                        onClick={() => {
                          navigate(`/doctors/${doc.id}`);
                          setOpenMenu(null);
                        }}
                        className="block w-full px-3 py-2 hover:bg-gray-100 text-left"
                      >
                        View
                      </button>
                      {isAdmin() && (
                        <>
                          <button
                            onClick={(e) => {
                              handleEdit(doc, e);
                              setOpenMenu(null);
                            }}
                            className="block w-full px-3 py-2 hover:bg-gray-100 text-left text-teal-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              handleDelete(doc.id, e);
                              setOpenMenu(null);
                            }}
                            className="block w-full px-3 py-2 hover:bg-gray-100 text-left text-red-500"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* STATUS */}
                {!isPatient() && (
                  <div className="mb-3 self-start">
                    <StatusBadge isAvailable={doc.is_available} />
                  </div>
                )}

                {/* AVATAR */}
                <div
                  onClick={() => navigate(`/doctors/${doc.id}`)}
                  className="cursor-pointer mb-4"
                >
                  {doc.avatar_url ? (
                    <img
                      src={doc.avatar_url}
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-teal-50"
                      alt={doc.full_name}
                    />
                  ) : (
                    <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center text-lg font-bold text-teal-600 ring-4 ring-teal-50">
                      {doc.full_name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                  )}
                </div>

                {/* NAME */}
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{doc.full_name}</h3>

                {/* INFO BOX */}
                <div className="w-full mb-4 flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {doc.department_name || "No Department"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {doc.specialty || "General"}
                  </p>
                  {doc.rating != null && doc.rating > 0 && (
                    <p className="text-xs text-amber-500 mt-1.5">
                      {"★".repeat(Math.round(doc.rating))}{" "}
                      {doc.rating.toFixed(1)}
                    </p>
                  )}
                </div>

                {/* BUTTONS */}
                {isPatient() && (
                  <div className="grid grid-cols-2 gap-2 w-full mt-auto">
                    <button
                      onClick={() => navigate(`/doctors/${doc.id}`)}
                      className="rounded-xl bg-gray-100 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() =>
                        navigate("/appointments", {
                          state: { bookDoctorId: doc.id },
                        })
                      }
                      disabled={!doc.is_available}
                      className="rounded-xl bg-teal-500 px-3 py-2.5 text-sm font-medium text-white hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50 transition"
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-0">
          <div className="bg-white w-full max-w-[500px] rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-4 sm:px-6 py-4 bg-teal-50 border-b">
              <h2 className="font-semibold">
                Edit Doctor - {editDoctor.full_name}
              </h2>
              <button
                onClick={() => setEditDoctor(null)}
                className="p-1 hover:bg-gray-200 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="text-sm text-gray-500 mb-1 block">
                  Specialty
                </label>
                <input
                  value={editForm.specialty}
                  onChange={(e) =>
                    setEditForm({ ...editForm, specialty: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">
                  Department
                </label>
                <select
                  value={editForm.department_id}
                  onChange={(e) =>
                    setEditForm({ ...editForm, department_id: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <option value="">No department</option>
                  {departmentOptions.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">
                  License Number
                </label>
                <input
                  value={editForm.license_number}
                  onChange={(e) =>
                    setEditForm({ ...editForm, license_number: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">
                    License Status
                  </label>
                  <select
                    value={editForm.license_status}
                    onChange={(e) =>
                      setEditForm({ ...editForm, license_status: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="VERIFIED">Verified</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="EXPIRED">Expired</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">
                    Rating
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={editForm.rating}
                    onChange={(e) =>
                      setEditForm({ ...editForm, rating: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) =>
                    setEditForm({ ...editForm, bio: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">
                  Years of Experience
                </label>
                <input
                  type="number"
                  value={editForm.years_of_experience}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      years_of_experience: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">
                  Consultation Duration (minutes)
                </label>
                <input
                  type="number"
                  value={editForm.consultation_duration_minutes}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      consultation_duration_minutes: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editForm.is_available}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        is_available: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-teal-500"
                  />
                  <span className="text-sm">Available for appointments</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditDoctor(null)}
                  className="flex-1 py-2 bg-gray-100 rounded-xl text-sm hover:bg-gray-200"
                >
                  Cancel
                </button>
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
