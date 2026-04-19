import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, Check, Mail, MapPin, Phone, Save, User, X } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

const PHONE_REGEX = /^\+[1-9]\d{7,14}$/;
const NAME_REGEX = /^[\p{L}][\p{L}\s'.-]*$/u;

function isRealisticDateOfBirth(value) {
  if (!value) return false;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return false;

  const today = new Date();
  if (parsed >= new Date(today.getFullYear(), today.getMonth(), today.getDate())) return false;

  const ageYears = (today.getTime() - parsed.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  return parsed.getFullYear() >= 1900 && ageYears <= 120;
}

function parseFieldErrors(err) {
  const detail = err?.data?.detail;
  if (!Array.isArray(detail)) return {};

  return detail.reduce((acc, item) => {
    const fieldName = Array.isArray(item?.loc)
      ? item.loc.filter((segment) => typeof segment === "string" && !["body", "query", "path", "response"].includes(segment)).at(-1)
      : null;

    if (!fieldName || !item?.msg) return acc;

    acc[fieldName] = item.msg.replace(/^Value error,\s*/i, "").replace(/^Assertion failed,\s*/i, "").trim();
    return acc;
  }, {});
}

function fieldClass(hasError) {
  return `w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 ${hasError ? "ring-2 ring-red-300 focus:ring-red-400" : "focus:ring-teal-400"}`;
}

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

export default function PatientProfile() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [isNewProfile, setIsNewProfile] = useState(false);
  const [showIntroNotice, setShowIntroNotice] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    date_of_birth: "",
    gender: "",
    phone: "",
    address: "",
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
          phone: data.phone || "",
          address: data.address || "",
          emergency_contact_name: data.emergency_contact_name || "",
          emergency_contact_phone: data.emergency_contact_phone || "",
        });
        setIsNewProfile(!data.date_of_birth || !data.gender || !data.phone);
      } catch (err) {
        if (err.message?.includes("not found") || err.message?.includes("set it up")) {
          setIsNewProfile(true);
          setForm((current) => ({ ...current, full_name: user?.full_name || "" }));
        } else {
          setError(err.message || "Failed to load profile");
        }
      } finally {
        setLoading(false);
      }
    };

    void fetchProfile();
  }, [user?.full_name]);

  useEffect(() => {
    if (!isNewProfile) {
      setShowIntroNotice(false);
      return;
    }

    setShowIntroNotice(true);
    const timeoutId = setTimeout(() => setShowIntroNotice(false), 6000);
    return () => clearTimeout(timeoutId);
  }, [isNewProfile]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setError("");
    setFieldErrors((current) => (current[name] ? { ...current, [name]: "" } : current));
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSave = async () => {
    const normalizedName = form.full_name.trim();
    const normalizedPhone = form.phone.replace(/[^\d+]/g, "");
    const normalizedAddress = form.address.trim();
    const normalizedEmergencyName = form.emergency_contact_name.trim();
    const normalizedEmergencyPhone = form.emergency_contact_phone.replace(/[^\d+]/g, "");
    const nextFieldErrors = {};

    setError("");
    setFieldErrors({});

    if (!normalizedName || normalizedName.split(/\s+/).filter(Boolean).length < 2 || !NAME_REGEX.test(normalizedName)) {
      nextFieldErrors.full_name = "Enter first and last name using letters only";
    }
    if (!form.date_of_birth) nextFieldErrors.date_of_birth = "Select your date of birth";
    else if (!isRealisticDateOfBirth(form.date_of_birth)) nextFieldErrors.date_of_birth = "Enter a realistic date of birth";
    if (!form.gender) nextFieldErrors.gender = "Select your gender";
    if (!form.phone.trim()) nextFieldErrors.phone = "Enter your phone number";
    else if (!PHONE_REGEX.test(normalizedPhone)) nextFieldErrors.phone = "Use international format, e.g. +15550101";
    if (form.emergency_contact_phone.trim() && !PHONE_REGEX.test(normalizedEmergencyPhone)) {
      nextFieldErrors.emergency_contact_phone = "Use international format, e.g. +15550101";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setSaving(true);
    setSaved(false);

    try {
      const payload = {
        full_name: normalizedName,
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        phone: normalizedPhone,
        address: normalizedAddress || null,
        emergency_contact_name: normalizedEmergencyName || null,
        emergency_contact_phone: normalizedEmergencyPhone || null,
      };

      if (isNewProfile) {
        await api.post("/patients/profile", payload);
        setIsNewProfile(false);
      } else {
        await api.put("/patients/me", payload);
      }

      const refreshed = await api.get("/patients/me");
      await refreshUser();
      setForm({
        full_name: refreshed.full_name || "",
        date_of_birth: refreshed.date_of_birth || "",
        gender: refreshed.gender || "",
        phone: refreshed.phone || "",
        address: refreshed.address || "",
        emergency_contact_name: refreshed.emergency_contact_name || "",
        emergency_contact_phone: refreshed.emergency_contact_phone || "",
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
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">Patient Profile</p>
            <h1 className="mt-2 text-3xl font-semibold text-gray-900">Manage your contact details</h1>
            <p className="mt-2 text-sm text-gray-500">Keep your personal information up to date. Medical records live in the separate My Health section.</p>
          </div>
          <button onClick={() => navigate("/patient/health")} className="inline-flex min-w-[168px] items-center justify-center gap-2 self-start rounded-2xl bg-teal-500 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-teal-600 lg:self-auto">
            Open My Health <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {showIntroNotice && (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-700">
          <div>
          <p className="font-medium">Complete your patient profile to get started.</p>
          <p className="mt-1 text-xs text-teal-600">Full name, date of birth, gender, phone and email are needed for safe communication and account recovery.</p>
          </div>
          <button type="button" onClick={() => setShowIntroNotice(false)} className="rounded-lg p-1 text-teal-600 hover:bg-teal-100">
            <X size={16} />
          </button>
        </div>
      )}

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <div className="space-y-6 rounded-2xl border bg-white p-6">
        <div>
          <label className="mb-1 block text-sm text-gray-500">Email</label>
          <div className="flex items-center gap-3">
            <Mail size={18} className="text-gray-400" />
            <input value={user?.email || ""} readOnly disabled className="flex-1 cursor-not-allowed rounded-xl bg-gray-100 px-4 py-2 text-sm text-gray-500 outline-none" />
          </div>
          <p className="mt-1 text-xs text-gray-400">Email is required for sign-in, notifications and future account security features.</p>
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-500">Full Name</label>
          <div className="flex items-center gap-3">
            <User size={18} className="text-gray-400" />
            <input name="full_name" value={form.full_name} onChange={handleChange} className={`flex-1 ${fieldClass(Boolean(fieldErrors.full_name))}`} />
          </div>
          <FieldError message={fieldErrors.full_name} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-gray-500">Date of Birth</label>
            <input name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} className={fieldClass(Boolean(fieldErrors.date_of_birth))} />
            <FieldError message={fieldErrors.date_of_birth} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-500">Gender</label>
            <select name="gender" value={form.gender} onChange={handleChange} className={fieldClass(Boolean(fieldErrors.gender))}>
              <option value="">Select</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
            <FieldError message={fieldErrors.gender} />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-500">Phone</label>
          <div className="flex items-center gap-3">
            <Phone size={18} className="text-gray-400" />
            <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+1 555-0100" className={`flex-1 ${fieldClass(Boolean(fieldErrors.phone))}`} />
          </div>
          <FieldError message={fieldErrors.phone} />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-500">Address</label>
          <div className="flex items-center gap-3">
            <MapPin size={18} className="text-gray-400" />
            <input name="address" value={form.address} onChange={handleChange} placeholder="123 Main St, City" className={`flex-1 ${fieldClass(Boolean(fieldErrors.address))}`} />
          </div>
          <FieldError message={fieldErrors.address} />
        </div>

        <div className="border-t pt-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500" />
            <span className="text-sm font-medium text-gray-800">Emergency Contact</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-gray-500">Name</label>
              <input name="emergency_contact_name" value={form.emergency_contact_name} onChange={handleChange} placeholder="Emergency contact name" className={fieldClass(Boolean(fieldErrors.emergency_contact_name))} />
              <FieldError message={fieldErrors.emergency_contact_name} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-500">Phone</label>
              <input name="emergency_contact_phone" type="tel" value={form.emergency_contact_phone} onChange={handleChange} placeholder="+1 555-0100" className={fieldClass(Boolean(fieldErrors.emergency_contact_phone))} />
              <FieldError message={fieldErrors.emergency_contact_phone} />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-white transition ${saved ? "bg-green-500" : "bg-teal-500 hover:bg-teal-600"} disabled:opacity-50`}
        >
          {saved ? <><Check size={18} /> Saved</> : saving ? "Saving..." : <><Save size={18} /> {isNewProfile ? "Create Profile" : "Save Profile"}</>}
        </button>
      </div>
    </div>
  );
}
