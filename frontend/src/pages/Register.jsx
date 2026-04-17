import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((current) => ({
      ...current,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await register({
        name: form.name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/2 bg-[#e6f4f1] flex flex-col justify-between p-10">
        <div>
          <h1 className="text-xl font-bold text-teal-700 mb-10">Medlink</h1>

          <h2 className="text-3xl font-bold mb-4 text-teal-800">
            Stay on Top of Every Detail
          </h2>

          <p className="text-gray-600 max-w-md">
            From appointments to inventory, Medlink gives you a clear view of
            daily hospital operations.
          </p>
        </div>

        <p className="text-sm text-gray-500">Copyright 2026 Medlink</p>
      </div>

      <div className="w-1/2 flex items-center justify-center bg-gray-50">
        <div className="w-[420px] bg-white p-8 rounded-2xl shadow">
          <h2 className="text-2xl font-bold mb-2">
            Create Your Medlink Account
          </h2>

          <p className="text-gray-500 mb-6">
            Register to access hospital dashboard
          </p>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 mb-4 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
              autoComplete="name"
              required
            />

            <input
              type="text"
              name="username"
              placeholder="Username (min. 3 characters)"
              value={form.username}
              onChange={handleChange}
              className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
              autoComplete="username"
              required
            />

            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
              autoComplete="email"
              required
            />

            <input
              type="password"
              name="password"
              placeholder="Password (min. 8 chars, include a digit)"
              value={form.password}
              onChange={handleChange}
              className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
              autoComplete="new-password"
              required
            />

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
              autoComplete="new-password"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white p-3 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-sm mt-4 text-center">
            Already have an account?{" "}
            <span
              onClick={() => !loading && navigate("/")}
              className="text-teal-500 cursor-pointer"
            >
              Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
