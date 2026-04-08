import { useState } from "react";
import MessageBubble from "../components/MessageBubble";
import ChatItem from "../components/ChatItem";

import amanda from "../assets/avatars/doctor-amanda.png";
import ruslan from "../assets/avatars/patient-ruslan.jpg";
import petya from "../assets/avatars/patient-petya.jpg";

function Messages() {
  const chats = [
    {
      name: "Dr. Amanda Hart",
      text: "Is the redness mild or getting worse?",
      time: "09:12",
      avatar: amanda,
    },
    {
      name: "Ruslan Wong",
      text: "Is my appointment confirmed?",
      time: "09:18",
      avatar: ruslan,
    },
    {
      name: "Petya Smith",
      text: "Can we add one more slot?",
      time: "08:58",
      avatar: petya,
    },
  ];

  const [messages, setMessages] = useState({
    2: [
      {
        fromMe: false,
        text: "Can we add one more slot?",
        time: "09:12",
      },
    ],
    1: [
      {
        fromMe: false,
        text: "Is my appointment confirmed?",
        time: "09:18",
      },
    ],
    0: [
      {
        fromMe: true,
        text: "Hi doctor, my skin is still red after using the cream.",
        time: "08:52",
      },
      {
        fromMe: false,
        text: "Is the redness mild or getting worse?",
        time: "08:53",
      },
    ],
  });

  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage = {
      fromMe: true,
      text: input,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages({
      ...messages,
      [activeChat]: [...(messages[activeChat] || []), newMessage],
    });

    setInput("");
  };

  const [activeChat, setActiveChat] = useState(2);

  return (
    <div className="flex gap-6 h-full">
      {/* LEFT PANEL */}
      <div className="w-80 bg-white rounded-2xl border shadow-sm p-4 flex flex-col">
        <div className="flex gap-2 mb-4">
          <input
            placeholder="Search..."
            className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm outline-none"
          />
          <button className="bg-teal-500 text-white px-3 rounded-lg hover:bg-teal-600">
            +
          </button>
        </div>

        <div className="space-y-2 max-h-[400px]">
          {chats.map((chat, i) => (
            <ChatItem
              key={i}
              chat={chat}
              isActive={activeChat === i}
              onClick={() => setActiveChat(i)}
            />
          ))}
        </div>
      </div>

      {/* CENTER CHAT */}
      <div className="flex-1 bg-white rounded-2xl border shadow-sm flex flex-col">
        {/* HEADER */}
        <div className="p-4 border-b flex items-center gap-3">
          <img
            src={chats[activeChat].avatar}
            className="w-10 h-10 rounded-full object-cover"
          />

          <div>
            <p className="text-sm font-semibold">{chats[activeChat].name}</p>
            <p className="text-xs text-green-500">Online</p>
          </div>
        </div>

        {/* MESSAGES */}
        <div className="flex-1 p-4 space-y-3 overflow-auto">
          {messages[activeChat]?.map((msg, i) => (
            <MessageBubble key={i} msg={msg} />
          ))}
        </div>

        {/* INPUT */}
        <div className="p-4 border-t flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-400 transition-all duration-200"
            placeholder="Type a message..."
          />
          <button
            onClick={handleSend}
            className="bg-teal-500 text-white px-4 rounded-lg hover:bg-teal-600 active:scale-95 transition-all duration-150"
          >
            Send
          </button>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-80 bg-white rounded-2xl border shadow-sm p-4">
        <h2 className="text-sm font-semibold mb-4">Account Info</h2>

        <div className="text-center mb-4">
          <img
            src={chats[activeChat].avatar}
            className="w-20 h-20 rounded-full mx-auto mb-2 object-cover"
          />
          <p className="text-sm font-medium">{chats[activeChat].name}</p>
          <p className="text-xs text-gray-400">last seen recently</p>

          <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-600 text-xs rounded-full">
            Online
          </span>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Dermatology patient under treatment.
        </p>

        <div className="flex gap-2 mb-4">
          <button className="flex-1 bg-teal-500 text-white py-2 rounded-lg text-sm">
            Message
          </button>
          <button className="flex-1 bg-gray-100 py-2 rounded-lg text-sm">
            Call
          </button>
        </div>

        <div>
          <p className="text-sm font-semibold mb-2">Media</p>
        </div>
      </div>
    </div>
  );
}

export default Messages;
