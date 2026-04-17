import { useState, useEffect } from "react";
import { api } from "../services/api";
import { Search, Plus, X, Shield, UserCheck, UserX, Trash2, Pencil } from "lucide-react";

const ROLE_STYLES = {
  ADMIN: "bg-purple-100 text-purple-600",
  DOCTOR: "bg-teal-100 text-teal-600",
  PATIENT: "bg-blue-100 text-blue-600",
};

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
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setError("");
    if (!form.full_name || !form.username || !form.email || !form.password) {
      return setError("All fields are required");
    }
    if (form.password.length < 8) {
      return setError("Password must be at least 8 characters");
    }

    setLoading(true);
    try {
      const endpoint =
        role === "ADMIN"
          ? "/auth/admin/users/create-admin"
          : "/auth/admin/users/create-doctor";
      await api.post(endpoint, {
        full_name: form.full_name,
        username: form.username,
        email: form.email,
        password: form.password,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white w-[480px] rounded-2xl shadow-xl overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 bg-teal-50 border-b">
          <h2 className="font-semibold">
            Create {role === "ADMIN" ? "Admin" : "Doctor"} Account
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label className="text-sm text-gray-500 mb-1 block">Full Name</label>
            <input
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="John Doe"
              className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-1 block">Username</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="johndoe"
              className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-1 block">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="john@clinic.com"
              className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-1 block">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min 8 chars, include a digit"
              className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 bg-gray-100 rounded-xl text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-2 bg-teal-500 text-white rounded-xl text-sm hover:bg-teal-600 disabled:opacity-50"
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

function EditUserModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    full_name: user.full_name || "",
    email: user.email || "",
    phone: user.phone || "",
    role: user.role || "PATIENT",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setError("");
    if (!form.full_name.trim() || !form.email.trim()) {
      return setError("Full name and email are required");
    }

    setLoading(true);
    try {
      await api.put(`/auth/admin/users/${user.id}`, {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        role: form.role,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white w-[480px] rounded-2xl shadow-xl overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 bg-blue-50 border-b">
          <div>
            <h2 className="font-semibold">Edit User</h2>
            <p className="text-xs text-gray-400">@{user.username}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label className="text-sm text-gray-500 mb-1 block">Full Name</label>
            <input
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-1 block">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-1 block">Phone</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Optional"
              className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-1 block">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="ADMIN">Admin</option>
              <option value="DOCTOR">Doctor</option>
              <option value="PATIENT">Patient</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 bg-gray-100 rounded-xl text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-2 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600 disabled:opacity-50"
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
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [modal, setModal] = useState(null); // "DOCTOR" | "ADMIN" | null
  const [editUser, setEditUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const triggerReload = () => setReloadKey((current) => current + 1);

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
        console.error("Failed to fetch users:", err);
      } finally {
        setLoading(false);
      }
    };

    void fetchUsers();
  }, [page, roleFilter, search, reloadKey]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
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
    } catch (err) {
      console.error("Failed to toggle user:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    )
      return;
    setActionLoading(userId);
    try {
      await api.delete(`/auth/admin/users/${userId}`);
      triggerReload();
    } catch (err) {
      console.error("Failed to delete user:", err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">User Management</h2>
            <p className="text-sm text-gray-400">Manage system users and accounts</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setModal("DOCTOR")}
              className="bg-teal-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-teal-600 flex items-center gap-1"
            >
              <Plus size={16} /> Add Doctor
            </button>
            <button
              onClick={() => setModal("ADMIN")}
              className="bg-purple-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-purple-600 flex items-center gap-1"
            >
              <Shield size={16} /> Add Admin
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 items-center">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by username or email..."
                className="pl-9 pr-4 py-2 bg-white border rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400 w-72"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-gray-100 rounded-xl text-sm hover:bg-gray-200"
            >
              Search
            </button>
          </form>

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="bg-white border px-4 py-2 rounded-xl text-sm"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="DOCTOR">Doctor</option>
            <option value="PATIENT">Patient</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="grid grid-cols-6 px-6 py-3 text-xs text-gray-400 border-b bg-gray-50">
              <span>Name</span>
              <span>Username</span>
              <span>Email</span>
              <span>Role</span>
              <span>Status</span>
              <span>Actions</span>
            </div>

            {users.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">No users found</div>
            ) : (
              users.map((u) => (
                <div
                  key={u.id}
                  className="grid grid-cols-6 px-6 py-4 items-center border-b last:border-none hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center font-semibold text-sm">
                      {u.full_name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <p className="font-medium text-sm">{u.full_name}</p>
                  </div>

                  <span className="text-sm text-gray-500">@{u.username}</span>
                  <span className="text-sm text-gray-500 truncate">{u.email}</span>

                  <span
                    className={`text-xs px-2.5 py-1 rounded-md font-medium w-fit ${
                      ROLE_STYLES[u.role] || "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {u.role}
                  </span>

                  <span
                    className={`text-xs px-2.5 py-1 rounded-md font-medium w-fit ${
                      u.is_active
                        ? "bg-green-50 text-green-600"
                        : "bg-red-50 text-red-500"
                    }`}
                  >
                    {u.is_active ? "Active" : "Inactive"}
                  </span>

                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditUser(u)}
                      disabled={actionLoading === u.id}
                      className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 w-fit disabled:opacity-50 bg-blue-50 text-blue-500 hover:bg-blue-100"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => handleToggleActive(u.id, u.is_active)}
                      disabled={actionLoading === u.id}
                      className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 w-fit disabled:opacity-50 ${
                        u.is_active
                          ? "bg-red-50 text-red-500 hover:bg-red-100"
                          : "bg-green-50 text-green-600 hover:bg-green-100"
                      }`}
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
                      onClick={() => handleDelete(u.id)}
                      disabled={actionLoading === u.id}
                      className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 w-fit disabled:opacity-50 bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 bg-white border rounded-lg text-sm disabled:opacity-50"
            >
              Prev
            </button>
            <span className="px-3 py-1 text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 bg-white border rounded-lg text-sm disabled:opacity-50"
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
          onCreated={triggerReload}
        />
      )}

      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={triggerReload}
        />
      )}
    </>
  );
}
