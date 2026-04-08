function Messages() {
  return (
    <div className="flex h-full gap-6">
      {/* LEFT - CHAT LIST */}
      <div className="w-72 bg-white rounded-2xl border shadow-sm p-4">
        <h2 className="text-sm font-semibold mb-4">Messages</h2>

        <input
          placeholder="Search..."
          className="w-full mb-4 px-3 py-2 bg-gray-100 rounded-lg text-sm outline-none"
        />

        <div className="space-y-2">
          {["John Doe", "Sarah Smith", "Michael Lee"].map((name, i) => (
            <div
              key={i}
              className={`p-3 rounded-xl cursor-pointer transition ${
                i === 0 ? "bg-teal-50" : "hover:bg-gray-100"
              }`}
            >
              <p className="font-medium text-sm">{name}</p>
              <p className="text-xs text-gray-400">Last message...</p>
            </div>
          ))}
        </div>
      </div>

      {/* CENTER - CHAT */}
      <div className="flex-1 bg-white rounded-2xl border shadow-sm flex flex-col">
        {/* HEADER */}
        <div className="p-4 border-b">
          <h2 className="text-sm font-semibold">John Doe</h2>
        </div>

        {/* MESSAGES */}
        <div className="flex-1 p-4 space-y-3 overflow-auto">
          <div className="bg-gray-100 p-3 rounded-xl w-fit">Hello doctor!</div>

          <div className="bg-teal-500 text-white p-3 rounded-xl w-fit ml-auto">
            Hello, how can I help you?
          </div>
        </div>

        {/* INPUT */}
        <div className="p-4 border-t flex gap-2">
          <input
            className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm outline-none"
            placeholder="Type a message..."
          />
          <button className="bg-teal-500 text-white px-4 rounded-lg">
            Send
          </button>
        </div>
      </div>

      {/* RIGHT - USER INFO */}
      <div className="w-72 bg-white rounded-2xl border shadow-sm p-4">
        <h2 className="text-sm font-semibold mb-4">User Info</h2>

        <div className="space-y-2 text-sm">
          <p>
            <strong>Name:</strong> John Doe
          </p>
          <p>
            <strong>Age:</strong> 29
          </p>
          <p>
            <strong>Status:</strong> Active
          </p>
        </div>
      </div>
    </div>
  );
}

export default Messages;
