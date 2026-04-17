function MessageBubble({ msg }) {
  return (
    <div className={`flex ${msg.fromMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[70%] rounded-2xl p-3 text-sm ${
          msg.fromMe ? "bg-teal-500 text-white" : "bg-gray-100 text-gray-700"
        }`}
      >
        <p>{msg.text}</p>

        <div className="mt-1 flex items-center justify-end gap-1 text-xs opacity-70">
          <span>{msg.time}</span>
          {msg.fromMe && <span>Sent</span>}
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;
