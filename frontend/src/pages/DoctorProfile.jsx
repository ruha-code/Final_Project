import { useEffect, useState } from "react";
import { Award, Building, Check, Clock, Mail, Phone, Save, User, Shield, ShieldAlert, ShieldCheck, Star, Calendar, MapPin } from "lucide-react";

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

function fieldClass(hasError) {
  return `w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm outline-none transition focus:ring-2 focus:border-teal-400 focus:ring-teal-100 ${
    hasError ? "border-red-300 focus:ring-red-200 focus:border-red-400" : "focus:border-teal-400"
  }`;
}

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">{message}</p>;
}

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function LicenseBadge({ status }) {
  if (!status) return null;
  if (status === "APPROVED" || status === "VERIFIED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
        <ShieldCheck size={14} /> Verified
      </span>
    );
  }
  if (status === "PENDING") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700">
        <Shield size={14} /> Pending Review
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-semibold text-red-600">
      <ShieldAlert size={14} /> {status}
    </span>
  );
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
      nextFieldErrors.bio = "Bio too short (min 15 chars, 3 words)";

    if (normalizedPhone && !PHONE_REGEX.test(normalizedPhone))
      nextFieldErrors.phone = "Use format +1234567890";

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
    <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6 lg:px-0 pb-10">

      {/* HEADER CARD */}
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="px-5 sm:px-8 pt-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-2xl font-bold text-teal-700 border-2 border-teal-200">
              {getInitials(profile?.full_name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {profile?.full_name || "Doctor"}
                </h2>
                <LicenseBadge status={profile?.license_status} />
              </div>
              <p className="mt-1 text-sm text-teal-600 font-medium">
                {profile?.specialty || "Set your specialty"}
              </p>
              {profile?.department_name && (
                <p className="mt-1 text-xs text-gray-400 flex items-center gap-1">
                  <Building size={12} /> {profile.department_name}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 flex items-start gap-2">
          <ShieldAlert size={16} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {saved && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 flex items-center gap-2">
          <Check size={16} /> Profile updated successfully!
        </div>
      )}

      {/* FORM */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b bg-gray-50 px-5 sm:px-8 py-4 flex items-center gap-2">
          <User size={18} className="text-teal-600" />
          <h3 className="text-sm font-semibold text-gray-800">Personal Information</h3>
        </div>

        <div className="p-5 sm:p-8 space-y-5">
          {/* EMAIL (read-only) */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">Email</label>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                <Mail size={16} className="text-gray-400" />
              </div>
              <input
                value={profile?.email || ""}
                readOnly
                className="flex-1 rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* NAME */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">Full Name</label>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                <User size={16} className="text-gray-400" />
              </div>
              <input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Dr. John Smith"
                className={fieldClass(fieldErrors.full_name)}
              />
            </div>
            <FieldError message={fieldErrors.full_name} />
          </div>

          {/* SPECIALTY */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">Specialty</label>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                <Award size={16} className="text-gray-400" />
              </div>
              <input
                name="specialty"
                value={form.specialty}
                onChange={handleChange}
                placeholder="Cardiologist, Pediatrician..."
                className={fieldClass(fieldErrors.specialty)}
              />
            </div>
            <FieldError message={fieldErrors.specialty} />
          </div>

          {/* BIO */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">Bio</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={4}
              placeholder="Describe your experience, education, and areas of expertise..."
              className={`${fieldClass(fieldErrors.bio)} w-full resize-none`}
            />
            <FieldError message={fieldErrors.bio} />
            <p className="mt-1 text-xs text-gray-400">
              {form.bio.length} characters
            </p>
          </div>

          {/* GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600">
                Experience (years)
              </label>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  <Award size={16} className="text-gray-400" />
                </div>
                <input
                  name="years_of_experience"
                  type="number"
                  min="0"
                  max="60"
                  placeholder="0"
                  className={fieldClass(fieldErrors.years_of_experience)}
                  value={form.years_of_experience}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600">
                Consultation (minutes)
              </label>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  <Clock size={16} className="text-gray-400" />
                </div>
                <input
                  name="consultation_duration_minutes"
                  type="number"
                  min="10"
                  max="120"
                  step="5"
                  placeholder="30"
                  className={fieldClass(fieldErrors.consultation_duration_minutes)}
                  value={form.consultation_duration_minutes}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* PHONE */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">Phone</label>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                <Phone size={16} className="text-gray-400" />
              </div>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+1234567890"
                className={fieldClass(fieldErrors.phone)}
              />
            </div>
            <FieldError message={fieldErrors.phone} />
          </div>

          {/* SAVE BUTTON */}
          <div className="pt-4 border-t">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all ${
                saved
                  ? "bg-emerald-500 text-white"
                  : "bg-teal-500 text-white hover:bg-teal-600"
              }`}
            >
              {saved ? (
                <>
                  <Check size={18} /> Saved Successfully
                </>
              ) : saving ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </span>
              ) : (
                <>
                  <Save size={18} /> Save Profile
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
