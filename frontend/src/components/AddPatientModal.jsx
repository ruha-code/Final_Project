import { useState } from "react";
import { X, Loader2 } from "lucide-react";

import { api } from "../services/api";

const PHONE_REGEX = /^\+[1-9]\d{7,14}$/;

function fieldClass(hasError) {
  return `w-full rounded-xl border bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 ${hasError ? "border-red-300" : "border-gray-200"}`;
}

export default function AddPatientModal({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    username: "",
    password: "",
    date_of_birth: "",
    gender: "",
    phone: "",
    address: "",
    condition: "",
    patient_type: "OUTPATIENT",
    admission_date: "",
    room_location: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    notes: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError("");
    setFieldErrors((prev) => (prev[name] ? { ...prev, [name]: "" } : prev));
    setForm((prev) => {
      if (name === "patient_type" && value === "OUTPATIENT") {
        return {
          ...prev,
          patient_type: value,
          admission_date: "",
          room_location: "",
        };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleSubmit = async () => {
    setError("");
    setFieldErrors({});

    const nextErrors = {};
    if (!form.full_name.trim() || form.full_name.trim().split(/\s+/).length < 2) {
      nextErrors.full_name = "Enter first and last name";
    }
    if (!form.email.trim() || !form.email.includes("@")) {
      nextErrors.email = "Enter a valid email";
    }
    if (!form.username.trim() || form.username.trim().length < 3) {
      nextErrors.username = "Username must be at least 3 characters";
    }
    if (!form.password || form.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters";
    }
    if (!form.date_of_birth) {
      nextErrors.date_of_birth = "Select date of birth";
    }
    if (!form.gender) {
      nextErrors.gender = "Select gender";
    }
    if (!form.phone.trim()) {
      nextErrors.phone = "Enter phone number";
    } else if (!PHONE_REGEX.test(form.phone.replace(/[^\d+]/g, ""))) {
      nextErrors.phone = "Use international format, e.g. +15550101";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setLoading(true);

    try {
      const normalizedPhone = form.phone.replace(/[^\d+]/g, "");
      const normalizedEmergencyPhone = form.emergency_contact_phone.replace(/[^\d+]/g, "");

      const userPayload = {
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        username: form.username.trim().toLowerCase(),
        password: form.password,
        phone: normalizedPhone,
        role: "PATIENT",
      };

      const userResult = await api.post("/admin/users/create-doctor", userPayload);

      const patientPayload = {
        user_id: userResult.id,
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        phone: normalizedPhone,
        address: form.address.trim() || null,
        condition: form.condition.trim() || null,
        notes: form.notes.trim() || null,
        patient_type: form.patient_type,
        admission_date: form.admission_date || null,
        room_location: form.room_location.trim() || null,
        emergency_contact_name: form.emergency_contact_name.trim() || null,
        emergency_contact_phone: normalizedEmergencyPhone || null,
      };

      await api.post("/patients/profile", patientPayload);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      if (err?.data?.detail && Array.isArray(err.data.detail)) {
        const parsed = {};
        err.data.detail.forEach((item) => {
          if (item?.loc && item?.msg) {
            const field = item.loc.filter((s) => typeof s === "string" && !["body", "query", "path"].includes(s)).at(-1);
            if (field) parsed[field] = item.msg.replace(/^Value error,\s*/i, "").trim();
          }
        });
        if (Object.keys(parsed).length > 0) {
          setFieldErrors(parsed);
        } else {
          setError(err.message || "Failed to create patient");
        }
      } else {
        setError(err.message || "Failed to create patient");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4 rounded-t-2xl">
          <h2 className="text-lg font-semibold text-gray-900">Add New Patient</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <div className="space-y-6 p-6">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-700">Account Info</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Full Name</label>
                <input name="full_name" value={form.full_name} onChange={handleChange} placeholder="John Doe" className={fieldClass(Boolean(fieldErrors.full_name))} />
                {fieldErrors.full_name && <p className="mt-1 text-xs text-red-500">{fieldErrors.full_name}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="john@example.com" className={fieldClass(Boolean(fieldErrors.email))} />
                {fieldErrors.email && <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Username</label>
                <input name="username" value={form.username} onChange={handleChange} placeholder="johndoe" className={fieldClass(Boolean(fieldErrors.username))} />
                {fieldErrors.username && <p className="mt-1 text-xs text-red-500">{fieldErrors.username}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Password</label>
                <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Min 8 characters" className={fieldClass(Boolean(fieldErrors.password))} />
                {fieldErrors.password && <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>}
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">Personal Info</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Date of Birth</label>
                <input name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} className={fieldClass(Boolean(fieldErrors.date_of_birth))} />
                {fieldErrors.date_of_birth && <p className="mt-1 text-xs text-red-500">{fieldErrors.date_of_birth}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Gender</label>
                <select name="gender" value={form.gender} onChange={handleChange} className={fieldClass(Boolean(fieldErrors.gender))}>
                  <option value="">Select</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
                {fieldErrors.gender && <p className="mt-1 text-xs text-red-500">{fieldErrors.gender}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Phone</label>
                <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+15550100" className={fieldClass(Boolean(fieldErrors.phone))} />
                {fieldErrors.phone && <p className="mt-1 text-xs text-red-500">{fieldErrors.phone}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Address</label>
                <input name="address" value={form.address} onChange={handleChange} placeholder="123 Main St, City" className={fieldClass(Boolean(fieldErrors.address))} />
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">Medical Info</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Condition</label>
                <input name="condition" value={form.condition} onChange={handleChange} placeholder="e.g. Hypertension" className={fieldClass(Boolean(fieldErrors.condition))} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Patient Type</label>
                <select name="patient_type" value={form.patient_type} onChange={handleChange} className={fieldClass(Boolean(fieldErrors.patient_type))}>
                  <option value="OUTPATIENT">Outpatient</option>
                  <option value="INPATIENT">Inpatient</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Admission Date</label>
                <input
                  name="admission_date"
                  type="date"
                  value={form.admission_date}
                  onChange={handleChange}
                  disabled={form.patient_type !== "INPATIENT"}
                  className={fieldClass(Boolean(fieldErrors.admission_date))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Room Location</label>
                <input
                  name="room_location"
                  value={form.room_location}
                  onChange={handleChange}
                  placeholder="e.g. Room 204"
                  disabled={form.patient_type !== "INPATIENT"}
                  className={fieldClass(Boolean(fieldErrors.room_location))}
                />
              </div>
            </div>
            {form.patient_type !== "INPATIENT" && (
              <p className="mt-2 text-xs text-gray-400">Admission timeline fields apply only to inpatients.</p>
            )}
          </div>

          <div className="border-t pt-6">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">Emergency Contact</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Name</label>
                <input name="emergency_contact_name" value={form.emergency_contact_name} onChange={handleChange} placeholder="Contact name" className={fieldClass(Boolean(fieldErrors.emergency_contact_name))} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Phone</label>
                <input name="emergency_contact_phone" type="tel" value={form.emergency_contact_phone} onChange={handleChange} placeholder="+15550100" className={fieldClass(Boolean(fieldErrors.emergency_contact_phone))} />
                {fieldErrors.emergency_contact_phone && <p className="mt-1 text-xs text-red-500">{fieldErrors.emergency_contact_phone}</p>}
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">Notes</h3>
            <textarea name="notes" rows={3} value={form.notes} onChange={handleChange} placeholder="Add clinical notes..." className={`w-full rounded-xl border bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 ${fieldClass(Boolean(fieldErrors.notes))}`} />
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <button onClick={onClose} disabled={loading} className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={loading} className="rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-50">
              {loading ? <><Loader2 size={16} className="mr-1 inline animate-spin" /> Creating...</> : "Add Patient"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
