import { useState, useEffect } from "react";
import { api } from "../services/api";
import { Save, Check, User, Mail, Phone, MapPin, Heart, AlertCircle } from "lucide-react";

export default function PatientProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    date_of_birth: "",
    gender: "",
    blood_type: "",
    phone: "",
    address: "",
    condition: "",
    notes: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.get("/patients/me");
        setProfile(data);
        setForm({
          full_name: data.full_name || "",
          date_of_birth: data.date_of_birth || "",
          gender: data.gender || "",
          blood_type: data.blood_type || "",
          phone: data.phone || "",
          address: data.address || "",
          condition: data.condition || "",
          notes: data.notes || "",
          emergency_contact_name: data.emergency_contact_name || "",
          emergency_contact_phone: data.emergency_contact_phone || "",
        });
      } catch (err) {
        if (err.message?.includes("not found") || err.message?.includes("not found")) {
          setError("Patient profile not found. Please contact admin to set up your profile.");
        } else {
          setError(err.message || "Failed to load profile");
        }
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
      await api.put("/patients/me", form);
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
        <p className="text-sm text-gray-400">Manage your patient profile</p>
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
          <label className="text-sm text-gray-500 mb-1 block">Date of Birth</label>
          <input
            name="date_of_birth"
            type="date"
            value={form.date_of_birth}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Gender</label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="">Select</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-1 block">Blood Type</label>
            <select
              name="blood_type"
              value={form.blood_type}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="">Select</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
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

        <div>
          <label className="text-sm text-gray-500 mb-1 block">Address</label>
          <div className="flex items-center gap-3">
            <MapPin size={18} className="text-gray-400" />
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="123 Main St, City"
              className="flex-1 px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-500 mb-1 block">Medical Condition</label>
          <div className="flex items-center gap-3">
            <Heart size={18} className="text-gray-400" />
            <input
              name="condition"
              value={form.condition}
              onChange={handleChange}
              placeholder="e.g. Diabetes, Hypertension"
              className="flex-1 px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-500 mb-1 block">Notes</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            placeholder="Any additional notes for doctors..."
            className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-teal-400"
          />
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={16} className="text-red-500" />
            <span className="text-sm font-medium">Emergency Contact</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Name</label>
              <input
                name="emergency_contact_name"
                value={form.emergency_contact_name}
                onChange={handleChange}
                placeholder="Emergency contact name"
                className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Phone</label>
              <input
                name="emergency_contact_phone"
                value={form.emergency_contact_phone}
                onChange={handleChange}
                placeholder="+1 555-0100"
                className="w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
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