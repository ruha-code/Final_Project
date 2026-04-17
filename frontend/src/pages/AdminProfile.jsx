import { useState, useEffect } from "react";
import { api } from "../services/api";
import { Save, Check, User, Mail, Phone } from "lucide-react";

export default function AdminProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    avatar_url: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.get("/auth/me");
        setForm({
          full_name: data.full_name || "",
          email: data.email || "",
          phone: data.phone || "",
          avatar_url: data.avatar_url || "",
        });
      } catch (err) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await api.put("/auth/me", form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || "Failed to save profile");
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">My Profile</h2>
        <p className="text-sm text-gray-400">Manage your admin profile</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
      )}

      <div className="bg-white rounded-2xl border p-6 space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-2xl font-bold">
            {form.full_name?.charAt(0) || "?"}
          </div>
          <div>
            <p className="text-sm text-gray-400">Administrator</p>
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-500 mb-1 block">Full Name</label>
          <div className="flex items-center gap-3">
            <User size={18} className="text-gray-400" />
            <input
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              className="flex-1 px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-500 mb-1 block">Email (read-only)</label>
          <div className="flex items-center gap-3">
            <Mail size={18} className="text-gray-400" />
            <input
              value={form.email || ""}
              disabled
              className="flex-1 px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none text-gray-400"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-500 mb-1 block">Phone</label>
          <div className="flex items-center gap-3">
            <Phone size={18} className="text-gray-400" />
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+1 555-0100"
              className="flex-1 px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 transition ${
            saved ? "bg-green-500 text-white" : "bg-teal-500 text-white hover:bg-teal-600"
          } disabled:opacity-50`}
        >
          {saved ? <><Check size={18} /> Saved</> : saving ? "Saving..." : <><Save size={18} /> Save Profile</>}
        </button>
      </div>
    </div>
  );
}
