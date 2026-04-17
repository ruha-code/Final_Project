function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function ChatItem({ chat, isActive, onClick }) {
  const name = chat.name || chat.doctor_name || chat.patient_name || "Unknown";
  const text = chat.text || chat.last_message || "";
  const time = chat.time || "";

  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition ${
        isActive ? "bg-teal-50 border border-teal-200" : "hover:bg-gray-50"
      }`}
    >
      <div className="flex items-center gap-3">
        {chat.avatar ? (
          <img
            src={chat.avatar}
            className="w-10 h-10 rounded-full object-cover"
            alt=""
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-sm font-semibold">
            {getInitials(name)}
          </div>
        )}

        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-gray-400 truncate w-36">{text}</p>
        </div>
      </div>

      {time && <span className="text-xs text-gray-400">{time}</span>}
    </div>
  );
}

export default ChatItem;
