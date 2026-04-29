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
  return `w-full rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 ${
    hasError ? "ring-2 ring-red-300 focus:ring-red-400" : "focus:ring-teal-400"
  }`;
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
          setForm((c) => ({ ...c, full_name: user?.full_name || "" }));
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
    if (!isNewProfile) return;

    setShowIntroNotice(true);
    const t = setTimeout(() => setShowIntroNotice(false), 6000);
    return () => clearTimeout(t);
  }, [isNewProfile]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setError("");
    setFieldErrors((c) => (c[name] ? { ...c, [name]: "" } : c));
    setForm((c) => ({ ...c, [name]: value }));
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

    if (normalizedEmergencyName && !normalizedEmergencyPhone) {
      nextFieldErrors.emergency_contact_phone = "Enter a phone number for your emergency contact";
    } else if (normalizedEmergencyPhone && !PHONE_REGEX.test(normalizedEmergencyPhone)) {
      nextFieldErrors.emergency_contact_phone = "Use international format, e.g. +15550101";
    }

    if (normalizedEmergencyPhone && !normalizedEmergencyName) {
      nextFieldErrors.emergency_contact_name = "Enter a name for your emergency contact";
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
      const parsed = parseFieldErrors(err);
      if (Object.keys(parsed).length) setFieldErrors(parsed);
      else setError(err.message || "Failed to save profile");
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
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 sm:px-6 lg:px-0">
      {/* HEADER */}
      <div className="rounded-3xl border bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">
              Patient Profile
            </p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-semibold text-gray-900">
              Manage your contact details
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Keep your personal information up to date.
            </p>
          </div>

          <button
            onClick={() => navigate("/patient/health")}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-teal-500 px-5 py-3 text-sm font-medium text-white hover:bg-teal-600"
          >
            Open My Health <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* NOTICE */}
      {showIntroNotice && (
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-700">
          <div>
            <p className="font-medium">Complete your profile</p>
            <p className="mt-1 text-xs text-teal-600">
              Fill required data for safe communication.
            </p>
          </div>
          <button onClick={() => setShowIntroNotice(false)} className="self-end sm:self-auto">
            <X size={16} />
          </button>
        </div>
      )}

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {/* FORM */}
      <div className="space-y-5 rounded-2xl border bg-white p-5 sm:p-6">
        <div>
          <label className="text-sm text-gray-500">Email</label>
          <div className="flex items-center gap-3 mt-1">
            <Mail size={18} className="text-gray-400" />
            <input
              value={user?.email || ""}
              readOnly
              disabled
              className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm text-gray-500"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-500">Full Name</label>
          <input
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            className={fieldClass(Boolean(fieldErrors.full_name))}
          />
          <FieldError message={fieldErrors.full_name} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-500">DOB</label>
            <input
              type="date"
              name="date_of_birth"
              value={form.date_of_birth}
              onChange={handleChange}
              className={fieldClass(Boolean(fieldErrors.date_of_birth))}
            />
            <FieldError message={fieldErrors.date_of_birth} />
          </div>

          <div>
            <label className="text-sm text-gray-500">Gender</label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className={fieldClass(Boolean(fieldErrors.gender))}
            >
              <option value="">Select</option>
              <option>MALE</option>
              <option>FEMALE</option>
            </select>
            <FieldError message={fieldErrors.gender} />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-500">Phone</label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className={fieldClass(Boolean(fieldErrors.phone))}
          />
          <FieldError message={fieldErrors.phone} />
        </div>

        <div>
          <label className="text-sm text-gray-500">Address</label>
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            className={fieldClass(Boolean(fieldErrors.address))}
          />
        </div>

        {/* BUTTON */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full rounded-xl py-3 text-white ${
            saved ? "bg-green-500" : "bg-teal-500 hover:bg-teal-600"
          }`}
        >
          {saving ? "Saving..." : saved ? "Saved" : "Save Profile"}
        </button>
      </div>
    </div>
  );
}