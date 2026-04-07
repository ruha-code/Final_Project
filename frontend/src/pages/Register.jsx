import { useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

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

          {/* NAME */}
          <input
            type="text"
            placeholder="Full Name"
            className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
          />

          {/* EMAIL */}
          <input
            type="email"
            placeholder="Email Address"
            className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
          />

          {/* PASSWORD */}
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
          />

          {/* CONFIRM PASSWORD */}
          <input
            type="password"
            placeholder="Confirm Password"
            className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
          />

          {/* CHECKBOX */}
          <div className="flex items-center mb-4 text-sm">
            <input type="checkbox" className="mr-2" />
            <span>I agree to the Terms & Conditions</span>
          </div>

          {/* BUTTON */}
          <button
            onClick={() => navigate("/")}
            className="w-full bg-teal-500 hover:bg-teal-600 text-white p-3 rounded-lg transition"
          >
            Create Account
          </button>

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
