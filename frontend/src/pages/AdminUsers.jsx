import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  X,
  Shield,
  UserCheck,
  UserX,
  Trash2,
  Pencil,
  CheckCircle2,
  TriangleAlert,
} from "lucide-react";

import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  isValidDoctorPhone,
  isValidDoctorSpecialty,
  normalizeDoctorPhone,
  normalizeWhitespace,
} from "../utils/doctorValidation";

const ROLE_STYLES = {
  ADMIN: "bg-purple-100 text-purple-600",
  DOCTOR: "bg-teal-100 text-teal-600",
  PATIENT: "bg-blue-100 text-blue-600",
};

const FULL_NAME_REGEX = /^(?=.{2,100}$)\p{L}+(?:[ .'-]\p{L}+)*$/u;
const USERNAME_REGEX = /^[A-Za-z0-9._-]{3,30}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/;

function normalizeName(value) {
  return value.trim().replace(/\s+/g, " ");
}

function validateCreateUserForm(form) {
  const fullName = normalizeName(form.full_name);
  const username = form.username.trim();
  const email = form.email.trim();
  const password = form.password;

  if (!fullName || !username || !email || !password) {
    return "All fields are required.";
  }

  if (!FULL_NAME_REGEX.test(fullName)) {
    return "Full name must contain letters and can include spaces, apostrophes, periods, or hyphens.";
  }

  if (!USERNAME_REGEX.test(username)) {
    return "Username must be 3-30 characters and can include letters, numbers, dots, underscores, or hyphens.";
  }

  if (!EMAIL_REGEX.test(email)) {
    return "Please enter a valid email address.";
  }

  if (!STRONG_PASSWORD_REGEX.test(password)) {
    return "Password must be at least 8 characters and include uppercase, lowercase, and a digit.";
  }

  return "";
}

function validateEditUserForm(form) {
  const fullName = normalizeName(form.full_name);
  const username = form.username.trim();
  const email = form.email.trim();
  const phone = form.phone.trim();
  const normalizedPhone = normalizeDoctorPhone(form.phone);

  if (!fullName || !username || !email) {
    return "Full name, username, and email are required.";
  }

  if (!FULL_NAME_REGEX.test(fullName)) {
    return "Full name must contain letters and can include spaces, apostrophes, periods, or hyphens.";
  }

  if (!USERNAME_REGEX.test(username)) {
    return "Username must be 3-30 characters and can include letters, numbers, dots, underscores, or hyphens.";
  }

  if (!EMAIL_REGEX.test(email)) {
    return "Please enter a valid email address.";
  }

  if (phone && !isValidDoctorPhone(normalizedPhone)) {
    return "Phone must use international format, e.g. +15550123456.";
  }

  return "";
}

function validateDoctorCreateForm(form) {
  const phone = form.phone.trim();
  const normalizedPhone = normalizeDoctorPhone(form.phone);
  const specialty = normalizeWhitespace(form.specialty);

  if (phone && !isValidDoctorPhone(normalizedPhone)) {
    return "Phone must use international format, e.g. +15550123456.";
  }

  if (specialty && !isValidDoctorSpecialty(specialty)) {
    return "Specialty must contain meaningful text, e.g. Cardiologist.";
  }

  return "";
}

function ConfirmationModal({
  title,
  message,
  confirmLabel,
  confirmTone = "danger",
  loading,
  onClose,
  onConfirm,
}) {
  const confirmClass =
    confirmTone === "warning"
      ? "bg-amber-500 text-white hover:bg-amber-600"
      : "bg-red-500 text-white hover:bg-red-600";

  return (
    // items-end на мобиле (снизу), items-center на sm+
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-4 sm:pb-0">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b bg-red-50 px-4 sm:px-6 py-4">
          <h2 className="font-semibold text-sm sm:text-base text-gray-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1 transition hover:bg-gray-200 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 sm:space-y-5 p-4 sm:p-6">
          <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-3 sm:p-4">
            <TriangleAlert size={18} className="mt-0.5 shrink-0 text-amber-600" />
            <p className="text-xs sm:text-sm text-gray-600">{message}</p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl bg-gray-100 py-2 text-xs sm:text-sm text-gray-700 transition hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 rounded-xl py-2 text-xs sm:text-sm transition disabled:opacity-50 ${confirmClass}`}
            >
              {loading ? "Processing..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateUserModal({ onClose, onCreated, role }) {
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
    if (role !== "DOCTOR") return;
    api.get("/departments")
      .then((data) => setDepartments(Array.isArray(data) ? data : []))
      .catch(() => setDepartments([]));
  }, [role]);

  const handleChange = (e) => {
    setForm((current) => ({ ...current, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    setError("");
    const validationError = validateCreateUserForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (role === "DOCTOR") {
      const doctorValidationError = validateDoctorCreateForm(form);
      if (doctorValidationError) {
        setError(doctorValidationError);
        return;
      }
    }

    const normalizedPhone = normalizeDoctorPhone(form.phone);
    const normalizedSpecialty = normalizeWhitespace(form.specialty);

    setLoading(true);
    try {
      const endpoint =
        role === "ADMIN"
          ? "/auth/admin/users/create-admin"
          : "/auth/admin/users/create-doctor";
      await api.post(endpoint, {
        full_name: normalizeName(form.full_name),
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: normalizedPhone || null,
        ...(role === "DOCTOR"
          ? {
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
            }
          : {}),
      });
      onCreated(
        `${role === "ADMIN" ? "Admin" : "Doctor"} account created successfully.`,
      );
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-4 sm:pb-0">
      <div className="w-full max-w-[480px] overflow-hidden rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between border-b bg-teal-50 px-4 sm:px-6 py-4">
          <h2 className="font-semibold text-sm sm:text-base">
            Create {role === "ADMIN" ? "Admin" : "Doctor"} Account
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 transition hover:bg-gray-200"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-xs sm:text-sm text-red-600">{error}</div>
          )}

          <div>
            <label className="mb-1 block text-xs sm:text-sm text-gray-500">Full Name</label>
            <input
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="John Doe"
              className="w-full rounded-xl bg-gray-100 px-3 sm:px-4 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs sm:text-sm text-gray-500">Username</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="john.doe"
              className="w-full rounded-xl bg-gray-100 px-3 sm:px-4 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
            <p className="mt-1 text-xs text-gray-400">
              3-30 chars: letters, numbers, dot, underscore, hyphen.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs sm:text-sm text-gray-500">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="john@clinic.com"
              className="w-full rounded-xl bg-gray-100 px-3 sm:px-4 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs sm:text-sm text-gray-500">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Use uppercase, lowercase and a number"
              className="w-full rounded-xl bg-gray-100 px-3 sm:px-4 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
            <p className="mt-1 text-xs text-gray-400">
              Minimum 8 characters with uppercase, lowercase, and one digit.
            </p>
          </div>

          {role === "DOCTOR" && (
            <>
              <div>
                <label className="mb-1 block text-xs sm:text-sm text-gray-500">Phone</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+1234567890"
                  className="w-full rounded-xl bg-gray-100 px-3 sm:px-4 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs sm:text-sm text-gray-500">Department</label>
                <select
                  name="department_id"
                  value={form.department_id}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-gray-100 px-3 sm:px-4 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-teal-400"
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
                <label className="mb-1 block text-xs sm:text-sm text-gray-500">Specialty</label>
                <input
                  name="specialty"
                  value={form.specialty}
                  onChange={handleChange}
                  placeholder="Cardiologist"
                  className="w-full rounded-xl bg-gray-100 px-3 sm:px-4 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs sm:text-sm text-gray-500">License Number</label>
                <input
                  name="license_number"
                  value={form.license_number}
                  onChange={handleChange}
                  placeholder="Medical license number"
                  className="w-full rounded-xl bg-gray-100 px-3 sm:px-4 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs sm:text-sm text-gray-500">License Status</label>
                  <select
                    name="license_status"
                    value={form.license_status}
                    onChange={handleChange}
                    className="w-full rounded-xl bg-gray-100 px-3 sm:px-4 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-teal-400"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="VERIFIED">Verified</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="EXPIRED">Expired</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs sm:text-sm text-gray-500">Rating</label>
                  <input
                    name="rating"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={form.rating}
                    onChange={handleChange}
                    className="w-full rounded-xl bg-gray-100 px-3 sm:px-4 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs sm:text-sm text-gray-500">Experience</label>
                  <input
                    name="years_of_experience"
                    type="number"
                    min="0"
                    max="50"
                    value={form.years_of_experience}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full rounded-xl bg-gray-100 px-3 sm:px-4 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs sm:text-sm text-gray-500">Consultation</label>
                  <input
                    name="consultation_duration_minutes"
                    type="number"
                    min="10"
                    max="120"
                    step="5"
                    value={form.consultation_duration_minutes}
                    onChange={handleChange}
                    className="w-full rounded-xl bg-gray-100 px-3 sm:px-4 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-gray-100 py-2 text-xs sm:text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 rounded-xl bg-teal-500 py-2 text-xs sm:text-sm text-white transition hover:bg-teal-600 disabled:opacity-50"
            >
              {loading
                ? "Creating..."
                : `Create ${role === "ADMIN" ? "Admin" : "Doctor"}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditUserModal({ user, onClose, onSaved, canChangeRole }) {
  const [form, setForm] = useState({
    full_name: user.full_name || "",
    username: user.username || "",
    email: user.email || "",
    phone: user.phone || "",
    role: user.role || "PATIENT",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((current) => ({ ...current, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    setError("");
    const validationError = validateEditUserForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await api.put(`/auth/admin/users/${user.id}`, {
        full_name: normalizeName(form.full_name),
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        phone: normalizeDoctorPhone(form.phone) || null,
        role: form.role,
      });
      await onSaved(updatedUser, "User updated successfully.");
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-4 sm:pb-0">
      <div className="w-full max-w-[480px] overflow-hidden rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between border-b bg-blue-50 px-4 sm:px-6 py-4">
          <div>
            <h2 className="font-semibold text-sm sm:text-base">Edit User</h2>
            <p className="text-xs text-gray-400">@{user.username}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 transition hover:bg-gray-200"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-xs sm:text-sm text-red-600">{error}</div>
          )}

          <div>
            <label className="mb-1 block text-xs sm:text-sm text-gray-500">Full Name</label>
            <input
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              className="w-full rounded-xl bg-gray-100 px-3 sm:px-4 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs sm:text-sm text-gray-500">Username</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              className="w-full rounded-xl bg-gray-100 px-3 sm:px-4 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs sm:text-sm text-gray-500">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-xl bg-gray-100 px-3 sm:px-4 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs sm:text-sm text-gray-500">Phone</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Optional"
              className="w-full rounded-xl bg-gray-100 px-3 sm:px-4 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs sm:text-sm text-gray-500">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              disabled={!canChangeRole}
              className="w-full rounded-xl bg-gray-100 px-3 sm:px-4 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-teal-400 disabled:opacity-60"
            >
              <option value="ADMIN">Admin</option>
              <option value="DOCTOR">Doctor</option>
              <option value="PATIENT">Patient</option>
            </select>
            {!canChangeRole && (
              <p className="mt-1 text-xs text-amber-600">
                You cannot change your own role.
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-gray-100 py-2 text-xs sm:text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 rounded-xl bg-blue-500 py-2 text-xs sm:text-sm text-white transition hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Мобильная карточка пользователя (вместо строки таблицы)
function UserCard({ u, isCurrentUser, actionLoading, onEdit, onToggle, onDelete }) {
  return (
    <div className="flex flex-col gap-3 border-b p-4 last:border-none hover:bg-gray-50">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-600">
            {u.full_name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{u.full_name}</p>
            <p className="text-xs text-gray-400">@{u.username}</p>
            {isCurrentUser && (
              <p className="text-xs text-gray-400">Current account</p>
            )}
          </div>
        </div>
        <span
          className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium ${
            ROLE_STYLES[u.role] || "bg-gray-100 text-gray-500"
          }`}
        >
          {u.role}
        </span>
      </div>

      <p className="truncate text-xs text-gray-500">{u.email}</p>

      <div className="flex flex-wrap gap-1">
        <span
          className={`rounded-md px-2.5 py-1 text-xs font-medium ${
            u.is_active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
          }`}
        >
          {u.is_active ? "Active" : "Inactive"}
        </span>
        <span
          className={`rounded-md px-2.5 py-1 text-xs font-medium ${
            u.is_verified
              ? "bg-blue-50 text-blue-600"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {u.is_verified ? "Verified" : "Unverified"}
        </span>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(u)}
          disabled={actionLoading === u.id}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs text-blue-500 transition hover:bg-blue-100 disabled:opacity-50"
          aria-label="Edit user"
        >
          <Pencil size={12} /> Edit
        </button>

        {!isCurrentUser && (
          <>
            <button
              type="button"
              onClick={() => onToggle(u)}
              disabled={actionLoading === u.id}
              className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-xs transition disabled:opacity-50 ${
                u.is_active
                  ? "bg-red-50 text-red-500 hover:bg-red-100"
                  : "bg-green-50 text-green-600 hover:bg-green-100"
              }`}
              aria-label={u.is_active ? "Deactivate user" : "Activate user"}
            >
              {u.is_active ? (
                <><UserX size={12} /> Deactivate</>
              ) : (
                <><UserCheck size={12} /> Activate</>
              )}
            </button>

            <button
              type="button"
              onClick={() => onDelete(u)}
              disabled={actionLoading === u.id}
              className="flex items-center justify-center rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-gray-500 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
              aria-label="Delete user"
            >
              <Trash2 size={12} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const { user: currentUser, refreshUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [modal, setModal] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [toast, setToast] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const triggerReload = () => setReloadKey((current) => current + 1);

  useEffect(() => {
    if (!toast) return undefined;
    const timeoutId = setTimeout(() => {
      setToast(null);
    }, 3000);
    return () => clearTimeout(timeoutId);
  }, [toast]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setLoadError("");
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("page_size", "10");
        if (roleFilter) params.set("role", roleFilter);
        if (search) params.set("search", search);

        const data = await api.get(`/auth/admin/users?${params.toString()}`);
        const nextTotalPages = data.pages || 1;
        if (page > nextTotalPages) {
          setTotalPages(nextTotalPages);
          setPage(nextTotalPages);
          return;
        }

        setUsers(data.items || []);
        setTotalPages(nextTotalPages);
      } catch (err) {
        setLoadError(err.message || "Failed to load users.");
        setToast({
          id: Date.now(),
          type: "error",
          message: err.message || "Failed to load users.",
        });
      } finally {
        setLoading(false);
      }
    };

    void fetchUsers();
  }, [page, roleFilter, search, reloadKey]);

  const showToast = (type, message) => {
    setToast({ id: Date.now(), type, message });
  };

  const handleToggleActive = async (userId, currentlyActive) => {
    setActionLoading(userId);
    try {
      const response = currentlyActive
        ? await api.put(`/auth/admin/users/${userId}/deactivate`)
        : await api.put(`/auth/admin/users/${userId}/activate`);
      if (currentlyActive) {
        triggerReload();
        showToast("success", response?.message || "User deactivated successfully.");
      } else {
        triggerReload();
        showToast("success", response?.message || "User activated successfully.");
      }
    } catch (err) {
      showToast("error", err.message || "Failed to update user status.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId) => {
    setActionLoading(userId);
    try {
      await api.delete(`/auth/admin/users/${userId}`);
      triggerReload();
      showToast("success", "User deleted successfully.");
    } catch (err) {
      showToast("error", err.message || "Failed to delete user.");
    } finally {
      setActionLoading(null);
    }
  };

  const openToggleConfirmation = (user) => {
    if (currentUser?.id === user.id) {
      showToast("error", "You cannot deactivate your own account.");
      return;
    }

    if (user.is_active) {
      setConfirmAction({
        title: "Deactivate user",
        message:
          "This user will no longer be able to sign in until you activate the account again.",
        confirmLabel: "Deactivate",
        confirmTone: "warning",
        onConfirm: () => handleToggleActive(user.id, true),
      });
      return;
    }

    setConfirmAction({
      title: "Activate user",
      message: user.is_verified
        ? "This user will regain access to the system."
        : "This user will regain access to the system and be marked as verified.",
      confirmLabel: "Activate",
      confirmTone: "warning",
      onConfirm: () => handleToggleActive(user.id, false),
    });
  };

  const openDeleteConfirmation = (user) => {
    if (currentUser?.id === user.id) {
      showToast("error", "You cannot delete your own account.");
      return;
    }

    setConfirmAction({
      title: "Delete user",
      message:
        "Deleting this user is permanent and cannot be undone. Related doctor/patient profile links will also be removed.",
      confirmLabel: "Delete",
      confirmTone: "danger",
      onConfirm: () => handleDelete(user.id),
    });
  };

  const runConfirmedAction = async () => {
    if (!confirmAction?.onConfirm) return;
    setConfirmLoading(true);
    try {
      await confirmAction.onConfirm();
      setConfirmAction(null);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleCreated = (message) => {
    triggerReload();
    showToast("success", message || "User created successfully.");
  };

  const handleSaved = async (updatedUser, message) => {
    if (currentUser?.id === updatedUser?.id) {
      await refreshUser();
    }
    triggerReload();
    showToast("success", message || "User updated successfully.");
  };

  const displayPage = Math.min(page, totalPages);

  return (
    <>
      <div className="space-y-4 sm:space-y-5 md:space-y-6">

        {/* Заголовок + кнопки */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold">User Management</h2>
            <p className="text-xs sm:text-sm text-gray-400">Manage system users and accounts</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setModal("DOCTOR")}
              className="flex flex-1 sm:flex-none items-center justify-center gap-1 rounded-xl bg-teal-500 px-3 sm:px-4 py-2 text-xs sm:text-sm text-white transition hover:bg-teal-600"
            >
              <Plus size={16} /> Add Doctor
            </button>
            <button
              type="button"
              onClick={() => setModal("ADMIN")}
              className="flex flex-1 sm:flex-none items-center justify-center gap-1 rounded-xl bg-purple-500 px-3 sm:px-4 py-2 text-xs sm:text-sm text-white transition hover:bg-purple-600"
            >
              <Shield size={16} /> Add Admin
            </button>
          </div>
        </div>

        {/* Поиск + фильтр */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs md:max-w-sm">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, username, or email..."
              className="w-full rounded-xl border bg-white py-2 pl-9 pr-4 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-auto rounded-xl border bg-white px-3 sm:px-4 py-2 text-xs sm:text-sm"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="DOCTOR">Doctor</option>
            <option value="PATIENT">Patient</option>
          </select>
        </div>

        {!loading && loadError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs sm:text-sm text-red-600">
            {loadError}
          </div>
        )}

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-teal-500" />
          </div>
        ) : loadError && users.length === 0 ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center text-xs sm:text-sm text-red-600">
            {loadError}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

            {/* Таблица — только md+ */}
            <div className="hidden md:block">
              <div className="grid grid-cols-6 border-b bg-gray-50 px-6 py-3 text-xs text-gray-400">
                <span>Name</span>
                <span>Username</span>
                <span>Email</span>
                <span>Role</span>
                <span>Status</span>
                <span>Actions</span>
              </div>

              {users.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">No users found</div>
              ) : (
                users.map((u) => {
                  const isCurrentUser = currentUser?.id === u.id;

                  return (
                    <div
                      key={u.id}
                      className="grid grid-cols-6 items-center border-b px-6 py-4 last:border-none hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-600">
                          {u.full_name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{u.full_name}</p>
                          {isCurrentUser && (
                            <p className="text-xs text-gray-400">Current account</p>
                          )}
                        </div>
                      </div>

                      <span className="text-sm text-gray-500">@{u.username}</span>
                      <span className="truncate text-sm text-gray-500">{u.email}</span>

                      <span
                        className={`w-fit rounded-md px-2.5 py-1 text-xs font-medium ${
                          ROLE_STYLES[u.role] || "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {u.role}
                      </span>

                      <div className="flex flex-wrap gap-1">
                        <span
                          className={`w-fit rounded-md px-2.5 py-1 text-xs font-medium ${
                            u.is_active
                              ? "bg-green-50 text-green-600"
                              : "bg-red-50 text-red-500"
                          }`}
                        >
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                        <span
                          className={`w-fit rounded-md px-2.5 py-1 text-xs font-medium ${
                            u.is_verified
                              ? "bg-blue-50 text-blue-600"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {u.is_verified ? "Verified" : "Unverified"}
                        </span>
                      </div>

                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setEditUser(u)}
                          disabled={actionLoading === u.id}
                          className="flex w-fit items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs text-blue-500 transition hover:bg-blue-100 disabled:opacity-50"
                          aria-label="Edit user"
                        >
                          <Pencil size={12} />
                        </button>

                        {!isCurrentUser && (
                          <>
                            <button
                              type="button"
                              onClick={() => openToggleConfirmation(u)}
                              disabled={actionLoading === u.id}
                              className={`flex w-fit items-center gap-1 rounded-lg px-3 py-1.5 text-xs transition disabled:opacity-50 ${
                                u.is_active
                                  ? "bg-red-50 text-red-500 hover:bg-red-100"
                                  : "bg-green-50 text-green-600 hover:bg-green-100"
                              }`}
                              aria-label={u.is_active ? "Deactivate user" : "Activate user"}
                            >
                              {u.is_active ? (
                                <><UserX size={12} /> Deactivate</>
                              ) : (
                                <><UserCheck size={12} /> Activate</>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => openDeleteConfirmation(u)}
                              disabled={actionLoading === u.id}
                              className="flex w-fit items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-gray-500 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                              aria-label="Delete user"
                            >
                              <Trash2 size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Карточки — только до md */}
            <div className="md:hidden">
              {users.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">No users found</div>
              ) : (
                users.map((u) => (
                  <UserCard
                    key={u.id}
                    u={u}
                    isCurrentUser={currentUser?.id === u.id}
                    actionLoading={actionLoading}
                    onEdit={setEditUser}
                    onToggle={openToggleConfirmation}
                    onDelete={openDeleteConfirmation}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* Пагинация */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={displayPage === 1}
              className="rounded-lg border bg-white px-3 py-1.5 text-xs sm:text-sm disabled:opacity-50 hover:bg-gray-50 transition"
            >
              Prev
            </button>
            <span className="px-2 py-1 text-xs sm:text-sm text-gray-500">
              Page {displayPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={displayPage === totalPages}
              className="rounded-lg border bg-white px-3 py-1.5 text-xs sm:text-sm disabled:opacity-50 hover:bg-gray-50 transition"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {modal && (
        <CreateUserModal
          role={modal}
          onClose={() => setModal(null)}
          onCreated={handleCreated}
        />
      )}

      {editUser && (
        <EditUserModal
          user={editUser}
          canChangeRole={currentUser?.id !== editUser.id}
          onClose={() => setEditUser(null)}
          onSaved={handleSaved}
        />
      )}

      {confirmAction && (
        <ConfirmationModal
          title={confirmAction.title}
          message={confirmAction.message}
          confirmLabel={confirmAction.confirmLabel}
          confirmTone={confirmAction.confirmTone}
          loading={confirmLoading}
          onClose={() => {
            if (!confirmLoading) {
              setConfirmAction(null);
            }
          }}
          onConfirm={runConfirmedAction}
        />
      )}

      {toast && (
        <div
          className={`fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-[80] flex items-start gap-2 rounded-xl border px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm shadow-lg max-w-[calc(100vw-2rem)] sm:max-w-sm ${
            toast.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          ) : (
            <TriangleAlert size={16} className="mt-0.5 shrink-0" />
          )}
          <p className="flex-1">{toast.message}</p>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 rounded-md p-1 transition hover:bg-black/5"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </>
  );
}
