function MessageBubble({ msg }) {
  return (
    <div className={`flex ${msg.fromMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`p-3 rounded-2xl max-w-[70%] text-sm ${
          msg.fromMe ? "bg-teal-500 text-white" : "bg-gray-100 text-gray-700"
        }`}
      >
        <p>{msg.text}</p>

        <div className="flex justify-end items-center gap-1 mt-1 text-xs opacity-70">
          <span>{msg.time}</span>
          {msg.fromMe && <span>✔</span>}
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;
