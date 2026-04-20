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

const ROLE_STYLES = {
  ADMIN: "bg-purple-100 text-purple-600",
  DOCTOR: "bg-teal-100 text-teal-600",
  PATIENT: "bg-blue-100 text-blue-600",
};

const FULL_NAME_REGEX = /^(?=.{2,100}$)\p{L}+(?:[ .'-]\p{L}+)*$/u;
const USERNAME_REGEX = /^[A-Za-z0-9._-]{3,30}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9()\-\s]{7,20}$/;
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

  if (phone && !PHONE_REGEX.test(phone)) {
    return "Phone must be 7-20 characters and contain only digits or +-() symbols.";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b bg-red-50 px-6 py-4">
          <h2 className="font-semibold text-gray-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1 transition hover:bg-gray-200 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-4">
            <TriangleAlert size={18} className="mt-0.5 text-amber-600" />
            <p className="text-sm text-gray-600">{message}</p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl bg-gray-100 py-2 text-sm text-gray-700 transition hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 rounded-xl py-2 text-sm transition disabled:opacity-50 ${confirmClass}`}
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
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-[480px] overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b bg-teal-50 px-6 py-4">
          <h2 className="font-semibold">
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

        <div className="space-y-4 p-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <div>
            <label className="mb-1 block text-sm text-gray-500">Full Name</label>
            <input
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="John Doe"
              className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-500">Username</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="john.doe"
              className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
            <p className="mt-1 text-xs text-gray-400">
              3-30 chars: letters, numbers, dot, underscore, hyphen.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-500">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="john@clinic.com"
              className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-500">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Use uppercase, lowercase and a number"
              className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
            <p className="mt-1 text-xs text-gray-400">
              Minimum 8 characters with uppercase, lowercase, and one digit.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-gray-100 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 rounded-xl bg-teal-500 py-2 text-sm text-white transition hover:bg-teal-600 disabled:opacity-50"
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
      await api.put(`/auth/admin/users/${user.id}`, {
        full_name: normalizeName(form.full_name),
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || null,
        role: form.role,
      });
      onSaved("User updated successfully.");
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-[480px] overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b bg-blue-50 px-6 py-4">
          <div>
            <h2 className="font-semibold">Edit User</h2>
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

        <div className="space-y-4 p-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <div>
            <label className="mb-1 block text-sm text-gray-500">Full Name</label>
            <input
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-500">Username</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-500">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-500">Phone</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Optional"
              className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-500">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              disabled={!canChangeRole}
              className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400 disabled:opacity-60"
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
              className="flex-1 rounded-xl bg-gray-100 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 rounded-xl bg-blue-500 py-2 text-sm text-white transition hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
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
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("page_size", "10");
        if (roleFilter) params.set("role", roleFilter);
        if (search) params.set("search", search);

        const data = await api.get(`/auth/admin/users?${params.toString()}`);
        setUsers(data.items || []);
        setTotalPages(data.pages || 1);
      } catch (err) {
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
      if (currentlyActive) {
        await api.put(`/auth/admin/users/${userId}/deactivate`);
      } else {
        await api.put(`/auth/admin/users/${userId}/activate`);
      }
      triggerReload();
      showToast(
        "success",
        currentlyActive ? "User deactivated successfully." : "User activated successfully.",
      );
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
      message: "This user will regain access to the system.",
      confirmLabel: "Activate",
      confirmTone: "warning",
      onConfirm: () => handleToggleActive(user.id, false),
    });
  };

  const openDeleteConfirmation = (user) => {
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

  const handleSaved = (message) => {
    triggerReload();
    showToast("success", message || "User updated successfully.");
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">User Management</h2>
            <p className="text-sm text-gray-400">Manage system users and accounts</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setModal("DOCTOR")}
              className="flex items-center gap-1 rounded-xl bg-teal-500 px-4 py-2 text-sm text-white transition hover:bg-teal-600"
            >
              <Plus size={16} /> Add Doctor
            </button>
            <button
              type="button"
              onClick={() => setModal("ADMIN")}
              className="flex items-center gap-1 rounded-xl bg-purple-500 px-4 py-2 text-sm text-white transition hover:bg-purple-600"
            >
              <Shield size={16} /> Add Admin
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, username, or email..."
              className="w-80 rounded-xl border bg-white py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border bg-white px-4 py-2 text-sm"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="DOCTOR">Doctor</option>
            <option value="PATIENT">Patient</option>
          </select>
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-teal-500" />
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
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
              users.map((u) => (
                <div
                  key={u.id}
                  className="grid grid-cols-6 items-center border-b px-6 py-4 last:border-none hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-600">
                      {u.full_name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <p className="text-sm font-medium">{u.full_name}</p>
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

                  <span
                    className={`w-fit rounded-md px-2.5 py-1 text-xs font-medium ${
                      u.is_active
                        ? "bg-green-50 text-green-600"
                        : "bg-red-50 text-red-500"
                    }`}
                  >
                    {u.is_active ? "Active" : "Inactive"}
                  </span>

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
                        <>
                          <UserX size={12} /> Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck size={12} /> Activate
                        </>
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
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border bg-white px-3 py-1 text-sm disabled:opacity-50"
            >
              Prev
            </button>
            <span className="px-3 py-1 text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border bg-white px-3 py-1 text-sm disabled:opacity-50"
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
          className={`fixed bottom-5 right-5 z-[80] flex items-start gap-2 rounded-xl border px-4 py-3 text-sm shadow-lg ${
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
          <p>{toast.message}</p>
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
