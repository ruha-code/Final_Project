import { useState, useEffect } from "react";
import { api } from "../services/api";
import { Save, Check, User, Mail, Phone, Award, Clock, Building } from "lucide-react";

export default function DoctorProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    specialty: "",
    bio: "",
    years_of_experience: 0,
    consultation_duration_minutes: 30,
    phone: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.get("/doctors/me");
        setProfile(data);
        setForm({
          full_name: data.full_name || "",
          specialty: data.specialty || "",
          bio: data.bio || "",
          years_of_experience: data.years_of_experience || 0,
          consultation_duration_minutes: data.consultation_duration_minutes || 30,
          phone: data.phone || "",
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
    setForm({ ...form, [name]: name === "years_of_experience" || name === "consultation_duration_minutes" ? parseInt(value) || 0 : value });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await api.put("/doctors/me", form);
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
        <p className="text-sm text-gray-400">Manage your doctor profile</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
      )}

      <div className="bg-white rounded-2xl border p-6 space-y-6">
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
          <label className="text-sm text-gray-500 mb-1 block">Specialty</label>
          <div className="flex items-center gap-3">
            <Award size={18} className="text-gray-400" />
            <input
              name="specialty"
              value={form.specialty}
              onChange={handleChange}
              placeholder="e.g. Cardiologist"
              className="flex-1 px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-500 mb-1 block">Bio</label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            rows={4}
            placeholder="Tell patients about yourself..."
            className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-teal-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Years of Experience</label>
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-gray-400" />
              <input
                name="years_of_experience"
                type="number"
                min="0"
                value={form.years_of_experience}
                onChange={handleChange}
                className="flex-1 px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-1 block">Session Duration (min)</label>
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-gray-400" />
              <input
                name="consultation_duration_minutes"
                type="number"
                min="15"
                step="15"
                value={form.consultation_duration_minutes}
                onChange={handleChange}
                className="flex-1 px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
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

        {profile?.department_name && (
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Department</label>
            <div className="flex items-center gap-3">
              <Building size={18} className="text-gray-400" />
              <span className="px-4 py-2 bg-gray-100 rounded-xl text-sm">{profile.department_name}</span>
            </div>
          </div>
        )}

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