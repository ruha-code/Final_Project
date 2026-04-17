import { useState, useEffect, useRef } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import MessageBubble from "../components/MessageBubble";

const POLL_INTERVAL = 4000;

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

function Avatar({ name }) {
  return (
    <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
      {getInitials(name)}
    </div>
  );
}

function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [sendError, setSendError] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);
  const activeConvIdRef = useRef(null);

  useEffect(() => {
    activeConvIdRef.current = activeConvId;
  }, [activeConvId]);

  useEffect(() => {
    api.get("/messages/conversations")
      .then((data) => {
        setConversations(data);
        if (data.length > 0) setActiveConvId(data[0].id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user?.role !== "PATIENT") return;
    Promise.all([api.get("/doctors"), api.get("/appointments/my")])
      .then(([doctorList, appointments]) => {
        const allowedDoctorIds = new Set(
          (appointments || [])
            .filter((appointment) => appointment.status !== "CANCELLED")
            .map((appointment) => appointment.doctor_id),
        );
        setDoctors((doctorList || []).filter((doctor) => allowedDoctorIds.has(doctor.id)));
      })
      .catch(console.error);
  }, [user?.role]);

  const fetchMessages = async (convId) => {
    if (!convId) return;
    try {
      const data = await api.get(`/messages/conversations/${convId}/messages`);
      setMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      return;
    }
    fetchMessages(activeConvId);

    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      if (activeConvIdRef.current) {
        fetchMessages(activeConvIdRef.current);
      }
    }, POLL_INTERVAL);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeConvId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !activeConvId) return;
    try {
      setSendError("");
      const msg = await api.post(`/messages/conversations/${activeConvId}/messages`, { text: input });
      setMessages((prev) => [...prev, msg]);
      setInput("");
    } catch (err) {
      setSendError(err.message || "Failed to send message");
    }
  };

  const handleCreateConversation = async () => {
    if (!selectedDoctorId) {
      setCreateError("Select a doctor to start a conversation");
      return;
    }
    setCreateLoading(true);
    setCreateError("");
    try {
      const conversation = await api.post("/messages/conversations", {
        doctor_id: Number(selectedDoctorId),
      });
      setConversations((prev) => {
        const existing = prev.some((item) => item.id === conversation.id);
        return existing ? prev : [conversation, ...prev];
      });
      setActiveConvId(conversation.id);
      setMessages([]);
      setSelectedDoctorId("");
    } catch (err) {
      setCreateError(err.message || "Failed to start conversation");
    } finally {
      setCreateLoading(false);
    }
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const contactName = activeConv
    ? user?.role === "PATIENT" ? activeConv.doctor_name : activeConv.patient_name
    : "";
  const filteredConversations = conversations.filter((conv) => {
    const name = user?.role === "PATIENT" ? conv.doctor_name : conv.patient_name;
    return name?.toLowerCase().includes(search.toLowerCase());
  });
  const availableDoctors = doctors.filter(
    (doctor) => !conversations.some((conv) => conv.doctor_id === doctor.id),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-full">
      {/* LEFT PANEL */}
      <div className="w-80 bg-white rounded-2xl border shadow-sm p-4 flex flex-col">
        <div className="flex gap-2 mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm outline-none"
          />
        </div>

        {user?.role === "PATIENT" && (
          <div className="mb-4 p-3 bg-teal-50 rounded-xl space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Start a conversation</p>
              <p className="text-xs text-gray-500 mt-1">Choose a doctor to open a new chat.</p>
            </div>

            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full px-3 py-2 bg-white border rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="">Select doctor</option>
              {availableDoctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.full_name}
                </option>
              ))}
            </select>

            {createError && <p className="text-xs text-red-500">{createError}</p>}

            <button
              onClick={handleCreateConversation}
              disabled={createLoading || availableDoctors.length === 0}
              className="w-full bg-teal-500 text-white py-2 rounded-lg text-sm hover:bg-teal-600 disabled:opacity-50"
            >
              {createLoading ? "Starting..." : "New Conversation"}
            </button>

            {availableDoctors.length === 0 && (
              <p className="text-xs text-gray-500">
                You can only start chats with doctors you have appointments with.
              </p>
            )}
          </div>
        )}

        {filteredConversations.length === 0 ? (
          <p className="text-sm text-gray-400 text-center mt-4">No conversations yet</p>
        ) : (
          <div className="space-y-2 overflow-y-auto">
            {filteredConversations.map((conv) => {
              const name = user?.role === "PATIENT" ? conv.doctor_name : conv.patient_name;
              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${activeConvId === conv.id ? "bg-teal-50" : "hover:bg-gray-50"}`}
                >
                  <Avatar name={name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{name}</p>
                    <p className="text-xs text-gray-400 truncate">{conv.last_message || "No messages yet"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CENTER CHAT */}
      <div className="flex-1 bg-white rounded-2xl border shadow-sm flex flex-col">
        {activeConv ? (
          <>
            <div className="p-4 border-b flex items-center gap-3">
              <Avatar name={contactName} />
              <div>
                <p className="text-sm font-semibold">{contactName}</p>
                <p className="text-xs text-gray-400">
                  {user?.role === "PATIENT" ? "Doctor" : "Patient"}
                </p>
              </div>
            </div>

            <div className="flex-1 p-4 space-y-3 overflow-auto">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={{
                    fromMe: msg.sender_id === user?.id,
                    text: msg.text,
                    time: new Date(msg.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  }}
                />
              ))}
              <div ref={bottomRef} />
            </div>

            <div className="p-4 border-t flex gap-2">
              {sendError && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 shadow">
                  {sendError}
                </div>
              )}
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
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            {user?.role === "PATIENT" ? (
              <p className="text-sm text-gray-500">Start a conversation with a doctor to begin messaging.</p>
            ) : (
              <div>
                <p className="text-sm text-gray-500">No conversations yet.</p>
                <p className="text-xs text-gray-400 mt-2">Patients can start a new chat from their side.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT PANEL */}
      <div className="w-80 bg-white rounded-2xl border shadow-sm p-4">
        <h2 className="text-sm font-semibold mb-4">Account Info</h2>
        {activeConv ? (
          <div className="text-center mb-4">
            <div className="w-20 h-20 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-2xl font-bold mx-auto mb-2">
              {getInitials(contactName)}
            </div>
            <p className="text-sm font-medium">{contactName}</p>
            <p className="text-xs text-gray-400">
              {user?.role === "PATIENT" ? "Doctor" : "Patient"}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-400">No conversation selected</p>
        )}
      </div>
    </div>
  );
}

export default Messages;
