function ChatItem({ chat, isActive, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition ${
        isActive ? "bg-teal-50 border border-teal-200" : "hover:bg-gray-50"
      }`}
    >
      <div className="flex items-center gap-3">
        <img
          src={chat.avatar}
          className="w-10 h-10 rounded-full object-cover"
        />

        <div>
          <p className="text-sm font-medium">{chat.name}</p>
          <p className="text-xs text-gray-400 truncate w-36">{chat.text}</p>
        </div>
      </div>

      <span className="text-xs text-gray-400">{chat.time}</span>
    </div>
  );
}

export default ChatItem;
