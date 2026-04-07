import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <button
        onClick={() => navigate("/dashboard")}
        className="bg-blue-500 text-white px-6 py-3 rounded-lg"
      >
        Login
      </button>
    </div>
  );
}

export default Login;
