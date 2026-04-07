import Login from "./pages/Login";

function App() {
  return (
    <div className="h-screen bg-green-500 flex items-center justify-center">
      <div className="bg-white p-10 rounded-2xl shadow-xl text-center">
        <h1 className="text-4xl font-bold text-blue-500 mb-4">
          Tailwind works
        </h1>

        <p className="text-gray-600 mb-6"></p>

        <button className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition">
          Button
        </button>
      </div>
    </div>
  );
}

export default App;
