import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.type === "text"
        ? "name"
        : e.target.type === "email"
          ? "email"
          : e.target.placeholder.includes("Confirm")
            ? "confirmPassword"
            : "password"]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      return setError("Passwords do not match");
    }

    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
      });

      navigate("/dashboard");
    } catch (err) {
      setError("Something went wrong");
    }
  };

  return (
    <div className="flex h-screen">
      {/* LEFT SIDE */}
      <div className="w-1/2 bg-teal-100 flex flex-col justify-between p-10">
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

        <p className="text-sm text-gray-500">© 2025 Medlink</p>
      </div>

      {/* RIGHT SIDE */}
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
            {/* NAME */}
            <input
              type="text"
              placeholder="Full Name"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full p-3 mb-4 border rounded-lg"
              required
            />

            {/* EMAIL */}
            <input
              type="email"
              placeholder="Email Address"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full p-3 mb-4 border rounded-lg"
              required
            />

            {/* PASSWORD */}
            <input
              type="password"
              placeholder="Password"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full p-3 mb-4 border rounded-lg"
              required
            />

            {/* CONFIRM PASSWORD */}
            <input
              type="password"
              placeholder="Confirm Password"
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
              className="w-full p-3 mb-4 border rounded-lg"
              required
            />

            {/* BUTTON */}
            <button
              type="submit"
              className="w-full bg-teal-500 hover:bg-teal-600 text-white p-3 rounded-lg transition"
            >
              Create Account
            </button>
          </form>

          {/* LOGIN LINK */}
          <p className="text-sm mt-4 text-center">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/")}
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
