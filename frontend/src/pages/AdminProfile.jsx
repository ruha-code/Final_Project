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
    <div className="
      w-full
      px-4 sm:px-6 md:px-8 lg:px-0
      max-w-none sm:max-w-xl md:max-w-2xl xl:max-w-3xl
      mx-auto
      space-y-4 sm:space-y-5 md:space-y-6
    ">
      {/* Заголовок */}
      <div>
        <h2 className="text-lg sm:text-xl md:text-2xl xl:text-3xl font-semibold">
          My Profile
        </h2>
        <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
          Manage your admin profile
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs sm:text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border p-4 sm:p-5 md:p-6 xl:p-8 space-y-4 sm:space-y-5 md:space-y-6">

        {/* Avatar block */}
        <div className="
          flex flex-col items-center text-center
          sm:flex-row sm:items-center sm:text-left
          gap-3 sm:gap-4
          pb-4 sm:pb-5 md:pb-6
          border-b border-gray-100
        ">
          {/* Аватар: маленький на мобиле, больше на планшете/десктопе */}
          <div className="
            w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 xl:w-24 xl:h-24
            shrink-0
            bg-teal-100 text-teal-600 rounded-full
            flex items-center justify-center
            text-xl sm:text-2xl md:text-3xl font-bold
          ">
            {form.full_name?.charAt(0) || "?"}
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm sm:text-base md:text-lg">
              {form.full_name || "—"}
            </p>
            <p className="text-xs sm:text-sm text-gray-400">Administrator</p>
          </div>
        </div>

        {/* Поля: одна колонка на мобиле, две на планшете+ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">

          {/* Full Name */}
          <div className="md:col-span-1">
            <label className="text-xs sm:text-sm text-gray-500 mb-1 block">
              Full Name
            </label>
            <div className="flex items-center gap-2 sm:gap-3">
              <User size={16} className="text-gray-400 shrink-0 sm:w-[18px] sm:h-[18px]" />
              <input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                className="
                  flex-1 min-w-0
                  px-3 sm:px-4
                  py-2 sm:py-2.5
                  bg-gray-100 rounded-xl
                  text-xs sm:text-sm
                  outline-none focus:ring-2 focus:ring-teal-400
                "
              />
            </div>
          </div>

          {/* Email */}
          <div className="md:col-span-1">
            <label className="text-xs sm:text-sm text-gray-500 mb-1 block">
              Email (read-only)
            </label>
            <div className="flex items-center gap-2 sm:gap-3">
              <Mail size={16} className="text-gray-400 shrink-0 sm:w-[18px] sm:h-[18px]" />
              <input
                value={form.email || ""}
                disabled
                className="
                  flex-1 min-w-0
                  px-3 sm:px-4
                  py-2 sm:py-2.5
                  bg-gray-100 rounded-xl
                  text-xs sm:text-sm
                  outline-none text-gray-400
                "
              />
            </div>
          </div>

          {/* Phone — на планшете занимает всю строку */}
          <div className="md:col-span-2">
            <label className="text-xs sm:text-sm text-gray-500 mb-1 block">
              Phone
            </label>
            <div className="flex items-center gap-2 sm:gap-3">
              <Phone size={16} className="text-gray-400 shrink-0 sm:w-[18px] sm:h-[18px]" />
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+1 555-0100"
                className="
                  flex-1 min-w-0
                  px-3 sm:px-4
                  py-2 sm:py-2.5
                  bg-gray-100 rounded-xl
                  text-xs sm:text-sm
                  outline-none focus:ring-2 focus:ring-teal-400
                "
              />
            </div>
          </div>
        </div>

        {/* Кнопка: full-width на мобиле, авто на планшете+ */}
        <div className="pt-1 sm:pt-2 flex justify-center sm:justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`
              w-full sm:w-auto
              px-6 md:px-8
              py-2.5 sm:py-3
              rounded-xl
              flex items-center justify-center gap-2
              text-sm md:text-base
              transition
              ${saved
                ? "bg-green-500 text-white"
                : "bg-teal-500 text-white hover:bg-teal-600"
              }
              disabled:opacity-50
            `}
          >
            {saved ? (
              <><Check size={16} className="sm:w-[18px] sm:h-[18px]" /> Saved</>
            ) : saving ? (
              "Saving..."
            ) : (
              <><Save size={16} className="sm:w-[18px] sm:h-[18px]" /> Save Profile</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}