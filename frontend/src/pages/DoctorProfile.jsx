import { useEffect, useState } from "react";
import { Award, Building, Check, Clock, Mail, Phone, Save, User } from "lucide-react";

import { api } from "../services/api";

const PHONE_REGEX = /^\+[1-9]\d{9,14}$/;
const NAME_ALLOWED_REGEX = /^[\p{L}\s'.-]+$/u;
const SPECIALTY_ALLOWED_REGEX = /^[\p{L}\s&'./()-]+$/u;

function normalizeWhitespace(value) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizePhone(value) {
  return value
    .replace(/[^\d+]/g, "")
    .replace(/(?!^)\+/g, "");
}

function isValidFullName(value) {
  if (value.length < 3) return false;
  const lettersCount = Array.from(value).filter((char) => /\p{L}/u.test(char)).length;
  return lettersCount >= 2 && NAME_ALLOWED_REGEX.test(value);
}

function isValidSpecialty(value) {
  if (value.length < 3 || value.length > 100) return false;
  const lettersCount = Array.from(value).filter((char) => /\p{L}/u.test(char)).length;
  return lettersCount >= 3 && SPECIALTY_ALLOWED_REGEX.test(value);
}

function isValidBio(value) {
  if (value.length < 15) return false;
  const words = value.split(" ").filter(Boolean);
  const lettersCount = Array.from(value).filter((char) => /\p{L}/u.test(char)).length;
  return words.length >= 3 && lettersCount >= 10;
}

function parseIntegerInput(value, fallback = null) {
  if (value === "" || value === null || value === undefined) return fallback;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function parseFieldErrors(err) {
  const detail = err?.data?.detail;
  if (!Array.isArray(detail)) return {};

  return detail.reduce((acc, item) => {
    const fieldName = Array.isArray(item?.loc)
      ? item.loc.filter((s) => typeof s === "string").at(-1)
      : "";
    if (!fieldName) return acc;
    acc[fieldName] = item?.msg?.replace(/^Value error,\s*/i, "") || "Invalid value";
    return acc;
  }, {});
}

function fieldClass(hasError) {
  return `flex-1 w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 ${
    hasError ? "border border-red-300 focus:ring-red-200" : "focus:ring-teal-400"
  }`;
}

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

export default function DoctorProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState({
    full_name: "",
    specialty: "",
    bio: "",
    years_of_experience: "",
    consultation_duration_minutes: "30",
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
          years_of_experience: data.years_of_experience ? String(data.years_of_experience) : "",
          consultation_duration_minutes: data.consultation_duration_minutes ? String(data.consultation_duration_minutes) : "30",
          phone: data.phone || "",
        });
      } catch (err) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    void fetchProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFieldErrors((c) => ({ ...c, [name]: "" }));
    setForm((c) => ({ ...c, [name]: value }));
  };

  const handleSave = async () => {
    const nextFieldErrors = {};

    const normalizedFullName = normalizeWhitespace(form.full_name);
    const normalizedSpecialty = normalizeWhitespace(form.specialty);
    const normalizedBio = normalizeWhitespace(form.bio);
    const normalizedPhone = normalizePhone(form.phone);
    const yearsOfExperience = parseIntegerInput(form.years_of_experience, 0);
    const consultationDuration = parseIntegerInput(form.consultation_duration_minutes, 30);

    setError("");
    setSaved(false);
    setFieldErrors({});

    if (!normalizedFullName) nextFieldErrors.full_name = "Enter your full name";
    else if (!isValidFullName(normalizedFullName))
      nextFieldErrors.full_name = "Invalid name format";

    if (!normalizedSpecialty) nextFieldErrors.specialty = "Enter specialty";
    else if (!isValidSpecialty(normalizedSpecialty))
      nextFieldErrors.specialty = "Invalid specialty";

    if (normalizedBio && !isValidBio(normalizedBio))
      nextFieldErrors.bio = "Bio too short";

    if (normalizedPhone && !PHONE_REGEX.test(normalizedPhone))
      nextFieldErrors.phone = "Invalid phone format";

    if (Object.keys(nextFieldErrors).length) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    try {
      setSaving(true);

      const updated = await api.put("/doctors/me", {
        full_name: normalizedFullName,
        specialty: normalizedSpecialty,
        bio: normalizedBio || null,
        phone: normalizedPhone || null,
        years_of_experience: yearsOfExperience,
        consultation_duration_minutes: consultationDuration,
      });

      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-teal-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 sm:px-0">
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold">My Profile</h2>
        <p className="text-sm text-gray-400">Manage your doctor profile.</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-6 rounded-2xl border bg-white p-4 sm:p-6">
        {/* EMAIL */}
        <div>
          <label className="mb-1 block text-sm text-gray-500">Email</label>
          <div className="flex items-center gap-3">
            <Mail size={18} className="text-gray-400" />
            <input
              value={profile?.email || ""}
              readOnly
              className="flex-1 rounded-xl bg-gray-100 px-4 py-2 text-sm text-gray-500"
            />
          </div>
        </div>

        {/* NAME */}
        <div>
          <label className="mb-1 block text-sm text-gray-500">Full Name</label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <User size={18} className="text-gray-400" />
            <input
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              className={fieldClass(fieldErrors.full_name)}
            />
          </div>
          <FieldError message={fieldErrors.full_name} />
        </div>

        {/* SPECIALTY */}
        <div>
          <label className="mb-1 block text-sm text-gray-500">Specialty</label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Award size={18} className="text-gray-400" />
            <input
              name="specialty"
              value={form.specialty}
              onChange={handleChange}
              className={fieldClass(fieldErrors.specialty)}
            />
          </div>
          <FieldError message={fieldErrors.specialty} />
        </div>

        {/* BIO */}
        <div>
          <label className="mb-1 block text-sm text-gray-500">Bio</label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            rows={4}
            className={`${fieldClass(fieldErrors.bio)} w-full resize-none`}
          />
          <FieldError message={fieldErrors.bio} />
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm text-gray-500">
              Experience
            </label>
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-gray-400" />
              <input
                name="years_of_experience"
                type="number"
                className={fieldClass(fieldErrors.years_of_experience)}
                value={form.years_of_experience}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-500">
              Duration
            </label>
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-gray-400" />
              <input
                name="consultation_duration_minutes"
                type="number"
                className={fieldClass(fieldErrors.consultation_duration_minutes)}
                value={form.consultation_duration_minutes}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* PHONE */}
        <div>
          <label className="mb-1 block text-sm text-gray-500">Phone</label>
          <div className="flex items-center gap-3">
            <Phone size={18} className="text-gray-400" />
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className={fieldClass(fieldErrors.phone)}
            />
          </div>
        </div>

        {/* BUTTON */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 transition ${
            saved
              ? "bg-green-500 text-white"
              : "bg-teal-500 text-white hover:bg-teal-600"
          }`}
        >
          {saved ? (
            <>
              <Check size={18} /> Saved
            </>
          ) : saving ? (
            "Saving..."
          ) : (
            <>
              <Save size={18} /> Save Profile
            </>
          )}
        </button>
      </div>
    </div>
  );
}