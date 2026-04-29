import { useNavigate, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

function VerifyCode() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyCode, resendVerification } = useAuth();

  const email = location.state?.email || "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate("/register");
    }
  }, [email, navigate]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);

    if (pasted.length === 6) {
      setCode(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const fullCode = code.join("");

    if (fullCode.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setLoading(true);

    try {
      await verifyCode({ email, code: fullCode });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;

    setError("");
    setResendLoading(true);

    try {
      await resendVerification(email);
      setResendTimer(60);
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || "Failed to resend code");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row overflow-hidden">

      {/* LEFT SIDE */}
      <div className="w-full md:w-1/2 bg-[#e6f4f1] flex flex-col items-center px-4 sm:px-6 md:px-10 py-6 md:py-8 text-center justify-between">

        <div className="flex flex-col items-center w-full">

          {/* LOGO */}
          <div className="flex items-center gap-2 text-teal-700 mb-6 mt-2 md:mt-0">
            <svg className="w-7 h-7 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
            </svg>
            <span className="text-lg md:text-xl font-bold">Medlink</span>
          </div>

          {/* TITLE */}
          <div className="mb-8 md:mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-teal-900">
              Verify Your Email
            </h2>
            <p className="text-sm md:text-base text-gray-600 max-w-sm mx-auto">
              We sent a verification code to your email
            </p>
          </div>

          {/* CARD */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg w-full max-w-md">

            {/* EMAIL */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 md:w-10 md:h-10 bg-teal-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8" />
                </svg>
              </div>

              <div className="text-left">
                <p className="text-xs md:text-sm text-gray-500">Code sent to</p>
                <p className="text-xs md:text-sm font-semibold text-gray-800 break-all">
                  {email}
                </p>
              </div>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit}>
              <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition"
                  />
                ))}
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm border border-red-100">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white p-3 rounded-lg transition disabled:opacity-60 font-medium shadow-md"
              >
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>
            </form>

            {/* RESEND */}
            <div className="mt-6 text-center">
              <p className="text-xs sm:text-sm text-gray-500">
                Didn't receive the code?{" "}
                <button
                  onClick={handleResend}
                  disabled={resendLoading || resendTimer > 0}
                  className="text-teal-600 font-medium disabled:opacity-50"
                >
                  {resendLoading
                    ? "Sending..."
                    : resendTimer > 0
                      ? `Resend in ${resendTimer}s`
                      : "Resend code"}
                </button>
              </p>
            </div>

          </div>
        </div>

        <p className="text-xs md:text-sm text-gray-500 mt-6 md:mt-0">
          Copyright 2026 Medlink
        </p>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-50 py-10 md:py-0">

        <div className="text-center max-w-sm px-6 md:px-8">

          <div className="w-16 h-16 md:w-20 md:h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 md:w-10 md:h-10 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4" />
            </svg>
          </div>

          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3">
            Secure Verification
          </h3>

          <p className="text-sm md:text-base text-gray-500">
            Your verification code ensures that only you can access your Medlink account. The code expires in 10 minutes.
          </p>

        </div>
      </div>

    </div>
  );
}

export default VerifyCode;