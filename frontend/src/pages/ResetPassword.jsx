import { useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuth();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordChecks = [
    {
      label: "At least 8 characters",
      passed: password.length >= 8,
    },
    {
      label: "Contains at least one digit",
      passed: /\d/.test(password),
    },
  ];

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-7 h-7 md:w-8 md:h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856"
              />
            </svg>
          </div>

          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
            Invalid Reset Link
          </h2>

          <p className="text-sm md:text-base text-gray-500 mb-6">
            The password reset link is missing or invalid.
          </p>

          <button
            onClick={() => navigate("/forgot-password")}
            className="text-teal-600 hover:text-teal-700 font-medium"
          >
            Request a new reset link
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col md:flex-row">
        {/* LEFT */}
        <div className="w-full md:w-1/2 bg-[#e6f4f1] flex flex-col items-center justify-between px-4 md:px-10 py-6 md:py-8 text-center">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 text-teal-700 mb-6">
              <span className="text-lg md:text-xl font-bold">Medlink</span>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-lg w-full max-w-md">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-7 h-7 md:w-8 md:h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4 10-10"
                  />
                </svg>
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
                Password Updated
              </h2>

              <p className="text-sm md:text-base text-gray-500 mb-6">
                Your password has been reset successfully.
              </p>

              <button
                onClick={() => navigate("/")}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-lg font-medium"
              >
                Go to Login
              </button>
            </div>
          </div>

          <p className="text-xs md:text-sm text-gray-500 mt-6 md:mt-0">
            Copyright 2026 Medlink
          </p>
        </div>

        {/* RIGHT */}
        <div className="hidden md:flex w-1/2 items-center justify-center bg-gray-50 px-8 text-center">
          <div className="max-w-sm text-left space-y-3">
            <h3 className="text-xl font-bold mb-3">Access Restored</h3>
            <p className="rounded-xl border bg-white px-4 py-3 text-gray-500">
              Sign in with your new password to continue using your Medlink
              account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!/\d/.test(password)) {
      setError("Password must contain at least one digit");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* LEFT */}
      <div className="w-full md:w-1/2 bg-[#e6f4f1] flex flex-col justify-between px-4 md:px-10 py-5 md:py-8 text-center">
        <div className="flex flex-col items-center">
          <div className="text-teal-700 mb-6 font-bold text-lg md:text-xl">
            Medlink
          </div>

          <h2 className="text-xl md:text-3xl font-bold text-teal-900 mb-2">
            Set New Password
          </h2>

          <p className="text-sm md:text-base text-gray-600 mb-6">
            Create a strong password
          </p>

          {/* CARD */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 sm:p-5 md:p-8 shadow-lg border border-white/60 w-full max-w-md">
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              {/* PASSWORD */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  New Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-teal-400"
                  placeholder="Enter password"
                />
              </div>

              <div className="rounded-xl border bg-white px-4 py-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Password requirements
                </p>
                <div className="space-y-2">
                  {passwordChecks.map((item) => (
                    <div
                      key={item.label}
                      className={`flex items-center gap-2 text-sm ${
                        item.passed ? "text-emerald-600" : "text-gray-500"
                      }`}
                    >
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${
                          item.passed ? "bg-emerald-500" : "bg-gray-300"
                        }`}
                      />
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* CONFIRM */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Confirm Password
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-teal-400"
                  placeholder="Repeat password"
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                  {error}
                </div>
              )}

              <button
                disabled={loading}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-lg font-medium"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-6 md:mt-0">
          Copyright 2026 Medlink
        </p>
      </div>

      {/* RIGHT (hidden on mobile) */}
      <div className="hidden md:flex w-1/2 items-center justify-center bg-gray-50 px-8">
        <div className="text-left max-w-sm space-y-3">
          <h3 className="text-xl font-bold mb-3">Choose a secure password</h3>
          <p className="rounded-xl border bg-white px-4 py-3 text-gray-500">
            Use a password you have not used elsewhere and keep it private.
          </p>
          <p className="rounded-xl border bg-white px-4 py-3 text-gray-500">
            Once saved, your previous reset link can no longer be used.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
