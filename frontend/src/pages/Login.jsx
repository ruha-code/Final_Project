import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setCredentials((current) => ({
      ...current,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({
        email: credentials.email.trim(),
        password: credentials.password,
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to sign in");
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
            Manage patients, appointments, and hospital operations easily.
          </p>
        </div>

        <p className="text-sm text-gray-500">Copyright 2026 Medlink</p>
      </div>

      <div className="w-1/2 flex items-center justify-center bg-gray-50">
        <div className="w-[420px] bg-white p-8 rounded-2xl shadow">
          <h2 className="text-2xl font-bold mb-2">Welcome Back to Medlink</h2>

          <p className="text-gray-500 mb-6">Sign in to continue</p>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={credentials.email}
              onChange={handleChange}
              className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
              autoComplete="email"
              required
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={credentials.password}
              onChange={handleChange}
              className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
              autoComplete="current-password"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white p-3 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <p className="text-sm mt-4 text-center">
            New to Medlink?{" "}
            <span
              onClick={() => !loading && navigate("/register")}
              className="text-teal-500 cursor-pointer"
            >
              Create an account
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
