import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function ForgotPassword() {
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  // ================= SUCCESS =================
  if (success) {
    return (
      <div className="flex min-h-[100dvh] flex-col md:flex-row">

        {/* LEFT */}
        <div className="w-full md:w-1/2 bg-[#e6f4f1] flex flex-col items-center justify-center px-4 md:px-10 py-10 text-center">

          <div className="flex flex-col items-center w-full">

            <div className="text-teal-700 mb-6 font-bold text-lg md:text-xl">
              Medlink
            </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-lg border border-white/60 w-full max-w-md">

              <div className="w-14 h-14 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-7 h-7 md:w-8 md:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
                Check Your Email
              </h2>

              <p className="text-sm md:text-base text-gray-500 mb-6">
                We've sent a reset link to <strong>{email}</strong>
              </p>

              <div className="mb-6 space-y-2 text-left">
                <div className="rounded-xl border bg-white px-4 py-3 text-sm text-gray-600">
                  Check your inbox and spam folder.
                </div>
                <div className="rounded-xl border bg-white px-4 py-3 text-sm text-gray-600">
                  The reset link remains active for 30 minutes.
                </div>
                <div className="rounded-xl border bg-white px-4 py-3 text-sm text-gray-600">
                  Use the most recent email if you request another link.
                </div>
              </div>

              <button
                onClick={() => navigate("/")}
                className="text-teal-600 hover:text-teal-700 font-medium"
              >
                Back to Login
              </button>

            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="hidden md:flex w-1/2 items-center justify-center bg-gray-50 px-8 text-center">
          <div className="max-w-sm text-left space-y-3">
            <h3 className="text-xl font-bold">Password Recovery</h3>
            <p className="rounded-xl border bg-white px-4 py-3 text-gray-500">
              A secure reset link is sent only after a valid request.
            </p>
            <p className="rounded-xl border bg-white px-4 py-3 text-gray-500">
              For your security, the link expires automatically after 30 minutes.
            </p>
          </div>
        </div>

      </div>
    );
  }

  // ================= FORM =================
  return (
    <div className="flex min-h-[100dvh] flex-col md:flex-row">

      {/* LEFT */}
      <div className="w-full md:w-1/2 bg-[#e6f4f1] flex flex-col items-center justify-center px-4 md:px-10 py-8 md:py-10 text-center">

        <div className="flex flex-col items-center w-full">

          <div className="text-teal-700 mb-6 font-bold text-lg md:text-xl">
            Medlink
          </div>

          <h2 className="text-xl md:text-3xl font-bold text-teal-900 mb-2">
            Reset Password
          </h2>

          <p className="text-sm md:text-base text-gray-600 mb-6">
            Enter your email and we'll send a reset link
          </p>

          {/* CARD */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 sm:p-5 md:p-8 shadow-lg border border-white/60 w-full max-w-md">

            <form onSubmit={handleSubmit}>

              <div className="mb-4 text-left">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="you@example.com"
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 transition ${error ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                  required
                />
                {error && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm text-red-600">
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white p-3 rounded-lg font-medium disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>

            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => navigate("/")}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                Back to Login
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="hidden md:flex w-1/2 items-center justify-center bg-gray-50 px-8">
        <div className="text-left max-w-sm space-y-3">
          <h3 className="text-xl font-bold">Need access again?</h3>
          <p className="rounded-xl border bg-white px-4 py-3 text-gray-500">
            Enter the email linked to your Medlink account and we'll send a secure reset link.
          </p>
          <p className="rounded-xl border bg-white px-4 py-3 text-gray-500">
            If the account exists, the instructions arrive by email within a few moments.
          </p>
        </div>
      </div>

    </div>
  );
}

export default ForgotPassword;