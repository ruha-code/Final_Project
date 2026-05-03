import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const VERIFY_EMAIL_STORAGE_KEY = "pending_verification_email";

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name } = e.target;
    setFieldErrors((c) => ({ ...c, [name]: "" }));
    setError("");
    setForm((current) => ({ ...current, [name]: e.target.value }));
  };

  const validateEmail = (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  const validateUsername = (value) =>
    /^(?=.{3,15}$)(?=.*[A-Za-z])[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/.test(
      value.trim(),
    );

  const handleEmailBlur = () => {
    if (form.email && !validateEmail(form.email)) {
      setFieldErrors((c) => ({
        ...c,
        email: "Please enter a valid email address",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const nextErrors = {};

    if (!form.name.trim()) nextErrors.name = "Full name is required";

    if (!validateUsername(form.username))
      nextErrors.username =
        "Username must be 3-15 characters, include a letter, and start/end with a letter or number";

    if (!validateEmail(form.email))
      nextErrors.email = "Please enter a valid email address";

    if (form.password.length < 8)
      nextErrors.password = "Password must be at least 8 characters";
    else if (!/\d/.test(form.password))
      nextErrors.password = "Password must contain at least one digit";

    if (form.password !== form.confirmPassword)
      nextErrors.confirmPassword = "Passwords do not match";

    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      return;
    }

    setLoading(true);

    try {
      const normalizedEmail = form.email.trim().toLowerCase();
      await register({
        name: form.name.trim(),
        username: form.username.trim(),
        email: normalizedEmail,
        password: form.password,
      });

      sessionStorage.setItem(VERIFY_EMAIL_STORAGE_KEY, normalizedEmail);
      navigate(`/verify?email=${encodeURIComponent(normalizedEmail)}`, {
        state: { email: normalizedEmail },
      });
    } catch (err) {
      const msg = err.message || "Failed to create account";
      if (msg.toLowerCase().includes("email already")) {
        setFieldErrors({
          email: "This email is already registered. Try logging in.",
        });
      } else if (msg.toLowerCase().includes("username already")) {
        setFieldErrors({ username: "This username is already taken." });
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row lg:h-screen lg:overflow-hidden">

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#e6f4f1] flex-col items-center px-10 py-8 text-center justify-between">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 text-teal-700 mb-6">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
            <span className="text-xl font-bold">Medlink</span>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold mb-3 text-teal-900">
              Stay on Top of Every Detail
            </h2>
            <p className="text-gray-600 max-w-sm mx-auto">
              From appointments to patient records, Medlink gives you a clear
              view of daily hospital operations.
            </p>
          </div>

          <img
            src="/images/mock2-Photoroom.png"
            alt="Medlink Dashboard"
            className="w-full max-w-2xl rounded-2xl mt-4"
          />
        </div>

        <p className="text-sm text-gray-500">Copyright 2026 Medlink</p>
      </div>

      {/* Right panel with the form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 px-4 py-8 sm:px-8 lg:w-1/2">

        {/* Logo shown only on mobile while the left panel is hidden */}
        <div className="flex items-center gap-2 text-teal-700 mb-6 lg:hidden">
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
          <span className="text-lg font-bold">Medlink</span>
        </div>

        <div className="w-full max-w-[460px] bg-white p-5 sm:p-8 lg:p-10 rounded-2xl shadow-lg border border-gray-100">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
            Create Your Account
          </h2>
          <p className="text-sm text-gray-500 mb-6 sm:mb-8">
            Register to access the Medlink dashboard
          </p>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-5 text-xs sm:text-sm border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                placeholder="John Doe"
                value={form.name}
                onChange={handleChange}
                className={`w-full p-2.5 sm:p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition text-sm ${fieldErrors.name ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                autoComplete="name"
              />
              {fieldErrors.name && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                Username
              </label>
              <input
                type="text"
                name="username"
                placeholder="johndoe"
                value={form.username}
                onChange={handleChange}
                className={`w-full p-2.5 sm:p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition text-sm ${fieldErrors.username ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                autoComplete="username"
                minLength={3}
                maxLength={15}
                pattern="^(?=.{3,15}$)(?=.*[A-Za-z])[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$"
                title="3-15 characters, include a letter, and start/end with a letter or number"
                autoCapitalize="none"
                spellCheck={false}
              />
              {fieldErrors.username ? (
                <p className="mt-1 text-xs text-red-500">
                  {fieldErrors.username}
                </p>
              ) : (
                <p className="text-xs text-gray-400 mt-1">
                  3-15 chars with at least one letter
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                onBlur={handleEmailBlur}
                className={`w-full p-2.5 sm:p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition text-sm ${fieldErrors.email ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                autoComplete="email"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={handleChange}
                  className={`w-full p-2.5 sm:p-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition text-sm ${fieldErrors.password ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password ? (
                <p className="mt-1 text-xs text-red-500">
                  {fieldErrors.password}
                </p>
              ) : (
                <p className="text-xs text-gray-400 mt-1">
                  Minimum 8 characters, include a digit
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={handleChange}
                className={`w-full p-2.5 sm:p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition text-sm ${fieldErrors.confirmPassword ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                autoComplete="new-password"
              />
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white p-2.5 sm:p-3 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg mt-4 sm:mt-6 text-sm"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-xs sm:text-sm mt-5 sm:mt-6 text-center text-gray-600">
            Already have an account?{" "}
            <span
              onClick={() => !loading && navigate("/")}
              className="text-teal-600 hover:text-teal-700 cursor-pointer font-medium"
            >
              Login
            </span>
          </p>
        </div>

        <p className="mt-6 text-xs text-gray-400 lg:hidden">
          Copyright 2026 Medlink
        </p>
      </div>
    </div>
  );
}

export default Register;
