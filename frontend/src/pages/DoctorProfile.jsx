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

function parseFieldErrors(err) {
  const detail = err?.data?.detail;
  if (!Array.isArray(detail)) return {};

  return detail.reduce((acc, item) => {
    const fieldName = Array.isArray(item?.loc)
      ? item.loc.filter((segment) => typeof segment === "string" && !["body", "query", "path"].includes(segment)).at(-1)
      : "";
    if (!fieldName) return acc;
    acc[fieldName] = item?.msg?.replace(/^Value error,\s*/i, "") || "Invalid value";
    return acc;
  }, {});
}

function fieldClass(hasError) {
  return `flex-1 rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 ${hasError ? "border border-red-300 focus:ring-red-200" : "focus:ring-teal-400"}`;
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
    void fetchProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFieldErrors((current) => ({ ...current, [name]: "" }));
    setForm((current) => ({
      ...current,
      [name]: name === "years_of_experience" || name === "consultation_duration_minutes"
        ? parseInt(value, 10) || 0
        : value,
    }));
  };

  const handleSave = async () => {
    const nextFieldErrors = {};
    const normalizedFullName = normalizeWhitespace(form.full_name);
    const normalizedSpecialty = normalizeWhitespace(form.specialty);
    const normalizedBio = normalizeWhitespace(form.bio);
    const normalizedPhone = normalizePhone(form.phone);

    setError("");
    setSaved(false);
    setFieldErrors({});

    if (!normalizedFullName) nextFieldErrors.full_name = "Enter your full name";
    else if (!isValidFullName(normalizedFullName)) {
      nextFieldErrors.full_name = "Use letters only (spaces, apostrophes, dots, or hyphens are allowed)";
    }

    if (!normalizedSpecialty) nextFieldErrors.specialty = "Enter your specialty";
    else if (!isValidSpecialty(normalizedSpecialty)) {
      nextFieldErrors.specialty = "Enter a valid medical specialty using text";
    }

    if (normalizedBio && !isValidBio(normalizedBio)) {
      nextFieldErrors.bio = "Bio should be descriptive (at least 15 characters and 3 words)";
    }

    if (normalizedPhone && !PHONE_REGEX.test(normalizedPhone)) {
      nextFieldErrors.phone = "Use international format, e.g. +15550123456";
    }

    if (form.years_of_experience < 0 || form.years_of_experience > 50) nextFieldErrors.years_of_experience = "Use a value from 0 to 50";
    if (form.consultation_duration_minutes < 10 || form.consultation_duration_minutes > 120) nextFieldErrors.consultation_duration_minutes = "Use a value from 10 to 120";

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    try {
      setSaving(true);
      const updatedProfile = await api.put("/doctors/me", {
        full_name: normalizedFullName,
        specialty: normalizedSpecialty,
        bio: normalizedBio || null,
        phone: normalizedPhone || null,
        years_of_experience: form.years_of_experience,
        consultation_duration_minutes: form.consultation_duration_minutes,
      });
      setProfile(updatedProfile);
      setForm({
        full_name: updatedProfile.full_name || "",
        specialty: updatedProfile.specialty || "",
        bio: updatedProfile.bio || "",
        years_of_experience: updatedProfile.years_of_experience || 0,
        consultation_duration_minutes: updatedProfile.consultation_duration_minutes || 30,
        phone: updatedProfile.phone || "",
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      const parsedErrors = parseFieldErrors(err);
      if (Object.keys(parsedErrors).length > 0) {
        setFieldErrors(parsedErrors);
      } else {
        setError(err.message || "Failed to save profile");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-teal-500" /></div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">My Profile</h2>
        <p className="text-sm text-gray-400">Manage your doctor profile.</p>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <div className="space-y-6 rounded-2xl border bg-white p-6">
        <div>
          <label className="mb-1 block text-sm text-gray-500">Email</label>
          <div className="flex items-center gap-3">
            <Mail size={18} className="text-gray-400" />
            <input value={profile?.email || ""} readOnly className="flex-1 rounded-xl bg-gray-100 px-4 py-2 text-sm text-gray-500 outline-none" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-500">Full Name</label>
          <div className="flex items-center gap-3">
            <User size={18} className="text-gray-400" />
            <input name="full_name" value={form.full_name} onChange={handleChange} className={fieldClass(Boolean(fieldErrors.full_name))} />
          </div>
          <FieldError message={fieldErrors.full_name} />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-500">Specialty</label>
          <div className="flex items-center gap-3">
            <Award size={18} className="text-gray-400" />
            <input name="specialty" value={form.specialty} onChange={handleChange} placeholder="e.g. Cardiologist" className={fieldClass(Boolean(fieldErrors.specialty))} />
          </div>
          <FieldError message={fieldErrors.specialty} />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-500">Bio</label>
          <textarea name="bio" value={form.bio} onChange={handleChange} rows={4} placeholder="Tell patients about yourself..." className={`${fieldClass(Boolean(fieldErrors.bio))} w-full resize-none`} />
          <FieldError message={fieldErrors.bio} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm text-gray-500">Years of Experience</label>
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-gray-400" />
              <input name="years_of_experience" type="number" min="0" max="50" value={form.years_of_experience} onChange={handleChange} className={fieldClass(Boolean(fieldErrors.years_of_experience))} />
            </div>
            <FieldError message={fieldErrors.years_of_experience} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-500">Session Duration (min)</label>
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-gray-400" />
              <input name="consultation_duration_minutes" type="number" min="10" max="120" step="5" value={form.consultation_duration_minutes} onChange={handleChange} className={fieldClass(Boolean(fieldErrors.consultation_duration_minutes))} />
            </div>
            <FieldError message={fieldErrors.consultation_duration_minutes} />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-500">Phone</label>
          <div className="flex items-center gap-3">
            <Phone size={18} className="text-gray-400" />
            <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+15550123456" className={fieldClass(Boolean(fieldErrors.phone))} />
          </div>
          <FieldError message={fieldErrors.phone} />
        </div>

        {profile?.department_name && (
          <div>
            <label className="mb-1 block text-sm text-gray-500">Department</label>
            <div className="flex items-center gap-3">
              <Building size={18} className="text-gray-400" />
              <span className="rounded-xl bg-gray-100 px-4 py-2 text-sm">{profile.department_name}</span>
            </div>
          </div>
        )}

        <button onClick={handleSave} disabled={saving} className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 transition ${saved ? "bg-green-500 text-white" : "bg-teal-500 text-white hover:bg-teal-600"} disabled:opacity-50`}>
          {saved ? <><Check size={18} /> Saved</> : saving ? "Saving..." : <><Save size={18} /> Save Profile</>}
        </button>
      </div>
    </div>
  );
}
