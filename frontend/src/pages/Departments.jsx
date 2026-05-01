import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, MapPin, Users, Plus, Search, Edit2, Trash2, X } from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1584982751601-97dcc096659c";

export default function Departments() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [doctorRosterWarning, setDoctorRosterWarning] = useState("");
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    location: "",
    image_url: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setPageError("");
    setDoctorRosterWarning("");

    const [deptResult, doctorsResult] = await Promise.allSettled([
      api.get("/departments"),
      api.get("/doctors"),
    ]);

    if (deptResult.status === "rejected") {
      setDepartments([]);
      setDoctors([]);
      setPageError(deptResult.reason?.message || "Failed to load departments");
      setLoading(false);
      return;
    }

    setDepartments(Array.isArray(deptResult.value) ? deptResult.value : []);

    if (doctorsResult.status === "fulfilled" && Array.isArray(doctorsResult.value)) {
      setDoctors(doctorsResult.value);
      setDoctorRosterWarning("");
    } else {
      setDoctors([]);
      setDoctorRosterWarning(
        doctorsResult.reason?.message ||
          "Doctor roster could not be loaded. Showing saved staff counts only."
      );
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const totalStaffCount = departments.reduce(
    (sum, dept) => sum + Number(dept.staff_count || 0),
    0
  );
  const totalDoctors = doctorRosterWarning ? totalStaffCount : doctors.length;
  const availableDoctors = doctorRosterWarning
    ? null
    : doctors.filter((d) => d.is_available).length;

  const getDoctorCount = (dept) => {
    if (doctorRosterWarning) return Number(dept.staff_count || 0);
    return doctors.filter((d) => Number(d.department_id) === Number(dept.id)).length;
  };

  const getAvailableCount = (deptId) => {
    if (doctorRosterWarning) return null;
    return doctors.filter(
      (d) => Number(d.department_id) === Number(deptId) && d.is_available
    ).length;
  };

  const filtered = departments.filter((dept) => {
    const value = search.trim().toLowerCase();
    if (!value) return true;
    return (
      dept.name?.toLowerCase().includes(value) ||
      dept.description?.toLowerCase().includes(value) ||
      dept.location?.toLowerCase().includes(value)
    );
  });

  const openCreate = () => {
    setForm({ name: "", description: "", location: "", image_url: "" });
    setShowCreateModal(true);
  };

  const openEdit = (dept) => {
    setForm({
      name: dept.name || "",
      description: dept.description || "",
      location: dept.location || "",
      image_url: dept.image_url || "",
    });
    setShowEditModal(dept);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFeedback({ tone: "error", message: "Department name is required" });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        location: form.location.trim() || null,
        image_url: form.image_url.trim() || null,
      };

      if (showEditModal) {
        await api.put(`/departments/${showEditModal.id}`, payload);
        setFeedback({ tone: "success", message: "Department updated successfully" });
      } else {
        await api.post("/departments", payload);
        setFeedback({ tone: "success", message: "Department created successfully" });
      }
      setShowCreateModal(false);
      setShowEditModal(null);
      await fetchData();
    } catch (err) {
      setFeedback({ tone: "error", message: err.message || "Failed to save department" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!showDeleteModal) return;

    setSaving(true);
    setFeedback(null);

    try {
      await api.delete(`/departments/${showDeleteModal.id}`);
      setFeedback({ tone: "success", message: "Department deleted successfully" });
      setShowDeleteModal(null);
      await fetchData();
    } catch (err) {
      setFeedback({ tone: "error", message: err.message || "Failed to delete department" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-3xl bg-white p-4 sm:p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Departments</h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            Manage hospital departments and their teams.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search departments"
              className="w-full sm:w-64 rounded-2xl bg-gray-100 pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
          {isAdmin() && (
            <button
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-500 px-5 py-3 text-sm font-medium text-white hover:bg-teal-600"
            >
              <Plus size={16} /> Add Department
            </button>
          )}
        </div>
      </div>

      {pageError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {pageError}
        </div>
      )}

      {doctorRosterWarning && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {doctorRosterWarning}
        </div>
      )}

      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${
            feedback.tone === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="ml-4 opacity-70 hover:opacity-100">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Summary */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border bg-white p-4 sm:p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-400">Total</p>
          <p className="mt-2 text-xl sm:text-2xl font-semibold text-gray-900">
            {departments.length}
          </p>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">Departments</p>
        </div>
        <div className="rounded-2xl border bg-white p-4 sm:p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-400">Total</p>
          <p className="mt-2 text-xl sm:text-2xl font-semibold text-gray-900">
            {totalDoctors}
          </p>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">Doctors</p>
        </div>
        <div className="rounded-2xl border bg-white p-4 sm:p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-400">Avg</p>
          <p className="mt-2 text-xl sm:text-2xl font-semibold text-gray-900">
            {departments.length > 0
              ? (totalDoctors / departments.length).toFixed(1)
              : "0"}
          </p>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">Doctors per dept</p>
        </div>
        <div className="rounded-2xl border bg-white p-4 sm:p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-400">Available</p>
          <p className="mt-2 text-xl sm:text-2xl font-semibold text-gray-900">
            {availableDoctors ?? "N/A"}
          </p>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">Doctors available</p>
        </div>
      </div>

      {/* Cards Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border bg-white p-12 text-center">
          <Building2 className="mx-auto mb-3 text-gray-300" size={32} />
          <p className="text-base font-medium text-gray-600">No departments found</p>
          <p className="mt-1 text-sm text-gray-400">
            {search ? "Try adjusting your search." : "Create your first department to get started."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((dept) => {
            const doctorCount = getDoctorCount(dept);
            const availableCount = getAvailableCount(dept.id);

            return (
              <div
                key={dept.id}
                className="group rounded-2xl border bg-white shadow-sm hover:shadow-md hover:border-teal-200 transition overflow-hidden"
              >
                <div className="h-40 overflow-hidden">
                  <img
                    src={
                      dept.image_url
                        ? `${dept.image_url}?auto=format&fit=crop&w=600`
                        : `${FALLBACK_IMG}?auto=format&fit=crop&w=600`
                    }
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    alt={dept.name}
                  />
                </div>

                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-base truncate">{dept.name}</h3>
                    {isAdmin() && (
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => openEdit(dept)}
                          className="rounded-lg p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(dept)}
                          className="rounded-lg p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="mt-2 text-xs sm:text-sm text-gray-500 line-clamp-2">
                    {dept.description || "No description available."}
                  </p>

                  <div className="mt-4 space-y-2 text-xs sm:text-sm text-gray-600">
                    {dept.location && (
                      <p className="flex items-center gap-2">
                        <MapPin size={14} /> {dept.location}
                      </p>
                    )}
                    <p className="flex items-center gap-2">
                      <Users size={14} /> {doctorCount} doctors
                      {availableCount !== null && ` (${availableCount} available)`}
                    </p>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => navigate(`/departments/${dept.id}`)}
                      className="flex-1 rounded-xl bg-teal-500 text-white py-2 text-xs sm:text-sm font-medium hover:bg-teal-600"
                    >
                      View Details
                    </button>
                    {doctorCount > 0 && (
                      <button
                        onClick={() => navigate(`/doctors?department_id=${dept.id}`)}
                        className="rounded-xl bg-gray-100 px-3 py-2 text-xs sm:text-sm text-gray-600 hover:bg-gray-200"
                      >
                        Team
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4 pb-0 sm:pb-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b bg-teal-50 px-4 sm:px-6 py-4">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  {showEditModal ? "Edit Department" : "Create Department"}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  {showEditModal ? "Update department information." : "Add a new department to the hospital."}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(null);
                }}
                className="rounded-lg p-1 hover:bg-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 p-4 sm:p-6">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Department name"
                className="w-full rounded-2xl bg-gray-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-400"
              />
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Description"
                className="w-full rounded-2xl bg-gray-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-400"
              />
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Location (e.g. Building A, Floor 2)"
                className="w-full rounded-2xl bg-gray-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-400"
              />
              <input
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="Image URL (optional)"
                className="w-full rounded-2xl bg-gray-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-400"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(null);
                  }}
                  className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-teal-500 px-4 py-2.5 text-sm text-white hover:bg-teal-600 disabled:opacity-60"
                >
                  {saving ? "Saving..." : showEditModal ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4 pb-0 sm:pb-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b bg-red-50 px-4 sm:px-6 py-4">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  Delete Department
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  This action cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteModal(null)}
                className="rounded-lg p-1 hover:bg-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 p-4 sm:p-6">
              <div className="rounded-2xl bg-gray-50 p-4 text-sm">
                <p className="font-medium text-gray-800">{showDeleteModal.name}</p>
                <p className="mt-1 text-gray-500">
                  {getDoctorCount(showDeleteModal)} doctor(s) assigned
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm text-white hover:bg-red-600 disabled:opacity-60"
                >
                  {saving ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
