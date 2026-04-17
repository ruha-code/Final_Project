import { useState, useEffect } from "react";
import { api } from "../services/api";
import { Save, Check, User, Phone, MapPin, Heart, AlertCircle, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const PHONE_REGEX = /^\+?\d{10,15}$/;

function parseFieldErrors(err) {
  const detail = err?.data?.detail;
  if (!Array.isArray(detail)) return {};

  return detail.reduce((acc, item) => {
    const fieldName = Array.isArray(item?.loc)
      ? item.loc
          .filter(
            (segment) =>
              typeof segment === "string" &&
              !["body", "query", "path", "response"].includes(segment),
          )
          .at(-1)
      : null;

    if (!fieldName || !item?.msg) return acc;

    const message = item.msg
      .replace(/^Value error,\s*/i, "")
      .replace(/^Assertion failed,\s*/i, "")
      .trim();

    if (!message) return acc;

    acc[fieldName] = message;
    return acc;
  }, {});
}

function fieldClass(hasError) {
  return `w-full px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 ${
    hasError ? "ring-2 ring-red-300 focus:ring-red-400" : "focus:ring-teal-400"
  }`;
}

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

export default function PatientProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [isNewProfile, setIsNewProfile] = useState(false);

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
        if (err.message?.includes("not found") || err.message?.includes("set it up")) {
          setIsNewProfile(true);
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
    setError("");
    setFieldErrors((current) => {
      if (!current[name]) return current;
      return { ...current, [name]: "" };
    });
    setForm({ ...form, [name]: value });
  };

  const handleSave = async () => {
    const normalizedPhone = form.phone.replace(/[^\d+]/g, "");
    const normalizedEmergencyPhone = form.emergency_contact_phone.replace(/[^\d+]/g, "");
    const nextFieldErrors = {};

    setError("");
    setFieldErrors({});

    if (isNewProfile) {
      if (!form.date_of_birth) nextFieldErrors.date_of_birth = "Select your date of birth";
      if (!form.gender) nextFieldErrors.gender = "Select your gender";
      if (!form.phone.trim()) nextFieldErrors.phone = "Enter your phone number";
    }

    if (form.phone.trim() && !PHONE_REGEX.test(normalizedPhone)) {
      nextFieldErrors.phone = "Use 10 to 15 digits";
    }

    if (form.emergency_contact_phone.trim() && !PHONE_REGEX.test(normalizedEmergencyPhone)) {
      nextFieldErrors.emergency_contact_phone = "Use 10 to 15 digits";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setSaving(true);
    setSaved(false);
    try {
      if (isNewProfile) {
        await api.post("/patients/profile", {
          date_of_birth: form.date_of_birth,
          gender: form.gender,
          phone: normalizedPhone,
          blood_type: form.blood_type || null,
          address: form.address || null,
          condition: form.condition || null,
          notes: form.notes || null,
          emergency_contact_name: form.emergency_contact_name || null,
          emergency_contact_phone: normalizedEmergencyPhone || null,
        });
        setIsNewProfile(false);
      } else {
        await api.put("/patients/me", {
          ...form,
          phone: normalizedPhone || null,
          emergency_contact_phone: normalizedEmergencyPhone || null,
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      const parsedErrors = parseFieldErrors(err);
      if (Object.keys(parsedErrors).length > 0) {
        setFieldErrors(parsedErrors);
        setError("");
      } else {
        setError(err.message || "Failed to save profile");
      }
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
        <p className="text-sm text-gray-400">
          {isNewProfile ? "Complete your profile to get started" : "Manage your patient profile"}
        </p>
      </div>

      {isNewProfile && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-sm text-teal-700">
          <p className="font-medium mb-1">Welcome! Let's set up your profile.</p>
          <p className="text-teal-600 text-xs">Date of birth, gender and phone are required.</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
      )}

      <div className="bg-white rounded-2xl border p-6 space-y-6">
        <div>
          <label className="text-sm text-gray-500 mb-1 block">Email</label>
          <div className="flex items-center gap-3">
            <Mail size={18} className="text-gray-400" />
            <input
              value={user?.email || ""}
              readOnly
              disabled
              className="flex-1 px-4 py-2 bg-gray-100 rounded-xl text-sm text-gray-500 outline-none cursor-not-allowed"
            />
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Email is used for sign-in and can&apos;t be changed here.
          </p>
        </div>

        {!isNewProfile && (
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Full Name</label>
            <div className="flex items-center gap-3">
              <User size={18} className="text-gray-400" />
              <input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                className={`flex-1 ${fieldClass(Boolean(fieldErrors.full_name))}`}
              />
            </div>
            <FieldError message={fieldErrors.full_name} />
          </div>
        )}

        <div>
          <label className="text-sm text-gray-500 mb-1 block">
            Date of Birth {isNewProfile && <span className="text-red-400">*</span>}
          </label>
          <input
            name="date_of_birth"
            type="date"
            value={form.date_of_birth}
            onChange={handleChange}
            className={fieldClass(Boolean(fieldErrors.date_of_birth))}
          />
          <FieldError message={fieldErrors.date_of_birth} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-500 mb-1 block">
              Gender {isNewProfile && <span className="text-red-400">*</span>}
            </label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className={fieldClass(Boolean(fieldErrors.gender))}
            >
              <option value="">Select</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
            <FieldError message={fieldErrors.gender} />
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-1 block">Blood Type</label>
            <select
              name="blood_type"
              value={form.blood_type}
              onChange={handleChange}
              className={fieldClass(Boolean(fieldErrors.blood_type))}
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
            <FieldError message={fieldErrors.blood_type} />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-500 mb-1 block">
            Phone {isNewProfile && <span className="text-red-400">*</span>}
          </label>
          <div className="flex items-center gap-3">
            <Phone size={18} className="text-gray-400" />
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="+1 555-0100"
              className={`flex-1 ${fieldClass(Boolean(fieldErrors.phone))}`}
            />
          </div>
          <FieldError message={fieldErrors.phone} />
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
              className={`flex-1 ${fieldClass(Boolean(fieldErrors.address))}`}
            />
          </div>
          <FieldError message={fieldErrors.address} />
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
              className={`flex-1 ${fieldClass(Boolean(fieldErrors.condition))}`}
            />
          </div>
          <FieldError message={fieldErrors.condition} />
        </div>

        <div>
          <label className="text-sm text-gray-500 mb-1 block">Notes</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            placeholder="Any additional notes for doctors..."
            className={`${fieldClass(Boolean(fieldErrors.notes))} resize-none`}
          />
          <FieldError message={fieldErrors.notes} />
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
                className={fieldClass(Boolean(fieldErrors.emergency_contact_name))}
              />
              <FieldError message={fieldErrors.emergency_contact_name} />
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Phone</label>
              <input
                name="emergency_contact_phone"
                type="tel"
                value={form.emergency_contact_phone}
                onChange={handleChange}
                placeholder="+1 555-0100"
                className={fieldClass(Boolean(fieldErrors.emergency_contact_phone))}
              />
              <FieldError message={fieldErrors.emergency_contact_phone} />
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
          {saved ? <><Check size={18} /> Saved</> : saving ? "Saving..." : <><Save size={18} /> {isNewProfile ? "Create Profile" : "Save Profile"}</>}
        </button>
      </div>
    </div>
  );
}
