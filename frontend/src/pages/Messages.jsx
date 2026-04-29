import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CalendarClock, ChevronUp, Info, MessageSquare,
  Search, Stethoscope, UserRound, ArrowLeft,
} from "lucide-react";

import MessageBubble from "../components/MessageBubble";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

const PAGE_SIZE = 100;

function dedupeMessages(items) {
  const seen = new Set();
  return (Array.isArray(items) ? items : []).filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

function Avatar({ name, size = "md" }) {
  const sizes = { md: "h-10 w-10 text-sm", lg: "h-20 w-20 text-2xl" };
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full bg-teal-100 font-semibold text-teal-600 ${sizes[size]}`}>
      {getInitials(name)}
    </div>
  );
}

function formatShortDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", timeZone: "Asia/Almaty",
  });
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Almaty",
  });
}

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [conversations, setConversations] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [doctorAppointments, setDoctorAppointments] = useState([]);
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [sendError, setSendError] = useState("");
  const [sending, setSending] = useState(false);
  const [contextInfo, setContextInfo] = useState("");
  const [activePatient, setActivePatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState("");
  const [wsError, setWsError] = useState(false);

  // Мобильная навигация: "list" | "chat" | "info"
  const [mobilePanel, setMobilePanel] = useState("list");

  const bottomRef = useRef(null);
  const messageListRef = useRef(null);
  const wsRef = useRef(null);
  const activeConvIdRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const fetchMessagesRef = useRef(null);
  const markAsReadRef = useRef(null);
  const clearUnreadRef = useRef(null);
  const currentPageRef = useRef(1);
  const shouldScrollRef = useRef(true);

  useEffect(() => {
    activeConvIdRef.current = activeConvId;
  }, [activeConvId]);

  useEffect(() => {
    api.get("/messages/conversations")
      .then((data) => {
        setConversations(data);
        if (location.state?.patientId && user?.role === "DOCTOR") {
          const matching = data.find((item) => item.patient_id === Number(location.state.patientId));
          if (matching) {
            setActiveConvId(matching.id);
            setContextInfo("");
          } else {
            setContextInfo("This patient has not started a conversation yet.");
            if (data.length > 0) setActiveConvId(data[0].id);
          }
        } else if (location.state?.conversationId) {
          setActiveConvId(location.state.conversationId);
        } else if (data.length > 0) {
          setActiveConvId(data[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [location.state, user?.role]);

  useEffect(() => {
    if (user?.role !== "PATIENT") return;
    Promise.all([api.get("/doctors"), api.get("/appointments/my")])
      .then(([doctorList, appointments]) => {
        const normalizedAppointments = Array.isArray(appointments) ? appointments : [];
        const allowedDoctorIds = new Set(
          normalizedAppointments.filter((a) => a.status !== "CANCELLED").map((a) => a.doctor_id),
        );
        setPatientAppointments(normalizedAppointments);
        setDoctors((doctorList || []).filter((d) => allowedDoctorIds.has(d.id)));
      })
      .catch(console.error);
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== "DOCTOR") return;
    api.get("/appointments/my")
      .then((data) => setDoctorAppointments(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [user?.role]);

  const clearUnreadForConversation = useCallback((convId) => {
    setConversations((prev) =>
      prev.map((conv) => (conv.id === convId ? { ...conv, unread_count: 0 } : conv)),
    );
  }, []);

  const markConversationAsRead = useCallback(async (convId) => {
    if (!convId) return;
    try {
      await api.put(`/messages/conversations/${convId}/read`);
      clearUnreadForConversation(convId);
    } catch (err) {
      console.error("Failed to mark conversation as read:", err);
    }
  }, [clearUnreadForConversation]);

  const fetchMessages = useCallback(async (convId, { silent = false } = {}) => {
    if (!convId) return;
    if (!silent) setMessagesLoading(true);
    setMessagesError("");
    try {
      const data = await api.get(`/messages/conversations/${convId}/messages?page=1&page_size=${PAGE_SIZE}`);
      const fresh = dedupeMessages(Array.isArray(data) ? data : []);

      shouldScrollRef.current = true;
      setHasMoreMessages(fresh.length === PAGE_SIZE);
      currentPageRef.current = 1;

      setMessages((prev) => {
        if (silent) {
          const newMsgs = fresh.filter((f) => !prev.find((p) => p.id === f.id));
          if (newMsgs.length === 0) {
            shouldScrollRef.current = false;
            return prev;
          }
          return dedupeMessages([...prev.filter((m) => m.conversation_id === convId), ...newMsgs]);
        }
        const wsOnly = prev.filter((m) => m.conversation_id === convId && !fresh.find((f) => f.id === m.id));
        return dedupeMessages([...fresh, ...wsOnly]);
      });

      const hasUnreadFromOthers = (data || []).some(
        (message) => message.sender_id !== user?.id && !message.is_read,
      );
      if (hasUnreadFromOthers) {
        await markConversationAsRead(convId);
      }
    } catch (err) {
      console.error(err);
      if (!silent) setMessagesError("Failed to load messages. Check your connection and try again.");
    } finally {
      if (!silent) setMessagesLoading(false);
    }
  }, [markConversationAsRead, user?.id]);

  const handleLoadOlder = useCallback(async () => {
    const convId = activeConvIdRef.current;
    if (!convId || loadingOlder || !hasMoreMessages) return;

    const nextPage = currentPageRef.current + 1;
    setLoadingOlder(true);
    shouldScrollRef.current = false;

    const container = messageListRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;

    try {
      const data = await api.get(`/messages/conversations/${convId}/messages?page=${nextPage}&page_size=${PAGE_SIZE}`);
      const fresh = dedupeMessages(Array.isArray(data) ? data : []);

      setHasMoreMessages(fresh.length === PAGE_SIZE);
      currentPageRef.current = nextPage;

      setMessages((prev) => dedupeMessages([...fresh, ...prev]));

      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevScrollHeight;
        }
      });
    } catch (err) {
      console.error("Failed to load older messages:", err);
    } finally {
      setLoadingOlder(false);
    }
  }, [loadingOlder, hasMoreMessages]);

  useEffect(() => { fetchMessagesRef.current = fetchMessages; }, [fetchMessages]);
  useEffect(() => { markAsReadRef.current = markConversationAsRead; }, [markConversationAsRead]);
  useEffect(() => { clearUnreadRef.current = clearUnreadForConversation; }, [clearUnreadForConversation]);

  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      setHasMoreMessages(false);
      setMessagesError("");
      setWsError(false);
      currentPageRef.current = 1;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    setMessages([]);
    setHasMoreMessages(false);
    setMessagesError("");
    setWsError(false);
    currentPageRef.current = 1;
    shouldScrollRef.current = true;

    clearUnreadRef.current?.(activeConvId);
    void markAsReadRef.current?.(activeConvId);
    void fetchMessagesRef.current?.(activeConvId);

    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(() => {
      void fetchMessagesRef.current?.(activeConvIdRef.current, { silent: true });
    }, 15000);

    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    if (reconnectTimerRef.current) { clearTimeout(reconnectTimerRef.current); reconnectTimerRef.current = null; }

    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = (attempt) => Math.min(1000 * 2 ** attempt, 10000);

    const connect = () => {
      const token = api.getToken();
      const ws = new WebSocket(api.getWebSocketUrl(`/messages/ws/${activeConvId}`, { token }));
      wsRef.current = ws;

      ws.onopen = () => { setWsError(false); reconnectAttempts = 0; };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === "new_message") {
            shouldScrollRef.current = true;
            setMessages((prev) => {
              if (prev.find((m) => m.id === data.id)) return prev;
              return dedupeMessages([...prev, data]);
            });
            setConversations((prev) =>
              prev.map((conv) =>
                conv.id === activeConvIdRef.current ? { ...conv, last_message: data.text } : conv,
              ),
            );
          } else if (data.event === "messages_read") {
            clearUnreadRef.current?.(activeConvIdRef.current);
          }
        } catch (err) {
          console.error("WS message parse error:", err);
        }
      };

      ws.onerror = () => setWsError(true);

      ws.onclose = () => {
        wsRef.current = null;
        if (reconnectAttempts < maxReconnectAttempts && activeConvIdRef.current) {
          reconnectTimerRef.current = setTimeout(() => {
            reconnectAttempts += 1;
            connect();
          }, reconnectDelay(reconnectAttempts));
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          setWsError(true);
        }
      };
    };

    connect();

    return () => {
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
      if (reconnectTimerRef.current) { clearTimeout(reconnectTimerRef.current); reconnectTimerRef.current = null; }
      if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current); pollIntervalRef.current = null; }
    };
  }, [activeConvId]);

  useEffect(() => {
    if (shouldScrollRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const currentConversation = conversations.find((item) => item.id === activeConvId);
    if (user?.role !== "DOCTOR" || !currentConversation?.patient_id) {
      setActivePatient(null);
      return;
    }
    api.get(`/patients/${currentConversation.patient_id}`)
      .then((data) => setActivePatient(data))
      .catch(() => setActivePatient(null));
  }, [activeConvId, conversations, user?.role]);

  const handleSend = async () => {
    if (!input.trim() || !activeConvId || sending) return;
    try {
      setSending(true);
      setSendError("");
      const msg = await api.post(`/messages/conversations/${activeConvId}/messages`, { text: input.trim() });
      shouldScrollRef.current = true;
      setMessages((prev) => dedupeMessages([...prev, msg]));
      setConversations((prev) =>
        prev.map((conv) => (conv.id === activeConvId ? { ...conv, last_message: msg.text } : conv)),
      );
      setInput("");
    } catch (err) {
      setSendError(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleCreateConversation = async () => {
    if (!selectedDoctorId) { setCreateError("Select a doctor to start a conversation"); return; }
    setCreateLoading(true);
    setCreateError("");
    try {
      const conversation = await api.post("/messages/conversations", { doctor_id: Number(selectedDoctorId) });
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
    ? (user?.role === "PATIENT" ? activeConv.doctor_name : activeConv.patient_name)
    : "";
  const filteredConversations = conversations.filter((conv) => {
    const name = user?.role === "PATIENT" ? conv.doctor_name : conv.patient_name;
    return name?.toLowerCase().includes(search.toLowerCase());
  });
  const availableDoctors = doctors.filter((doctor) =>
    !conversations.some((conv) => conv.doctor_id === doctor.id),
  );
  const activeDoctor = activeConv?.doctor_id
    ? doctors.find((d) => d.id === activeConv.doctor_id)
    : null;
  const activePatientAppointments = activeConv?.patient_id
    ? doctorAppointments
        .filter((a) => a.patient_id === activeConv.patient_id)
        .sort((a, b) => new Date(b.appointment_time) - new Date(a.appointment_time))
    : [];
  const activeDoctorAppointments = activeConv?.doctor_id
    ? patientAppointments
        .filter((a) => a.doctor_id === activeConv.doctor_id)
        .sort((a, b) => new Date(b.appointment_time) - new Date(a.appointment_time))
    : [];
  const lastVisit = activePatientAppointments.find((a) => new Date(a.appointment_time) < Date.now());
  const patientLastVisitLabel = lastVisit ? formatShortDate(lastVisit.appointment_time) : "-";
  const patientAge = activePatient?.date_of_birth
    ? Math.floor((Date.now() - new Date(activePatient.date_of_birth)) / (1000 * 60 * 60 * 24 * 365.25))
    : null;
  const nextVisitWithDoctor = [...activeDoctorAppointments]
    .reverse()
    .find((a) => a.status !== "CANCELLED" && new Date(a.appointment_time) >= Date.now());
  const lastVisitWithDoctor = activeDoctorAppointments.find(
    (a) => new Date(a.appointment_time) < Date.now(),
  );
  const messageCount = messages.length;

  const accountInfoCards = useMemo(() => {
    if (!activeConv) return [];
    if (user?.role === "DOCTOR") {
      return [
        { label: "Age", value: patientAge ?? "-" },
        { label: "Condition", value: activePatient?.condition || "No condition" },
        { label: "Last Visit", value: patientLastVisitLabel },
      ];
    }
    return [
      { label: "Specialty", value: activeDoctor?.specialty || "Doctor" },
      { label: "Next Visit", value: nextVisitWithDoctor ? formatDateTime(nextVisitWithDoctor.appointment_time) : "No upcoming visit" },
      { label: "Last Visit", value: lastVisitWithDoctor ? formatShortDate(lastVisitWithDoctor.appointment_time) : "-" },
    ];
  }, [activeConv, activeDoctor?.specialty, activePatient?.condition, lastVisitWithDoctor, nextVisitWithDoctor, patientAge, patientLastVisitLabel, user?.role]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-teal-500" />
      </div>
    );
  }

  // Список разговоров
  const conversationsList = (
    <div className="flex min-h-0 flex-col rounded-2xl border bg-white p-4 shadow-sm h-full">
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-3 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search conversations"
          className="w-full rounded-xl bg-gray-100 py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-teal-400"
        />
      </div>

      {user?.role === "PATIENT" && (
        <div className="mb-4 space-y-3 rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-cyan-50 p-4">
          <div>
            <p className="text-sm font-semibold text-gray-800">Start a conversation</p>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              Choose a doctor from your care journey to ask follow-up questions.
            </p>
          </div>
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-400"
          >
            <option value="">Select doctor</option>
            {availableDoctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>{doctor.full_name}</option>
            ))}
          </select>
          {createError && <p className="text-xs text-red-500">{createError}</p>}
          <button
            onClick={handleCreateConversation}
            disabled={createLoading || availableDoctors.length === 0}
            className="w-full rounded-xl bg-teal-500 py-2.5 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-50"
          >
            {createLoading ? "Starting..." : "New Conversation"}
          </button>
          {availableDoctors.length === 0 && (
            <p className="text-xs text-gray-500">
              You can only start chats with doctors connected to your appointments.
            </p>
          )}
        </div>
      )}

      {filteredConversations.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 text-center text-sm text-gray-400">
          No conversations yet
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto pr-1">
          {filteredConversations.map((conv) => {
            const name = user?.role === "PATIENT" ? conv.doctor_name : conv.patient_name;
            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => {
                  setContextInfo("");
                  clearUnreadForConversation(conv.id);
                  setActiveConvId(conv.id);
                  setMobilePanel("chat");
                }}
                className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${
                  activeConvId === conv.id ? "bg-teal-50 ring-1 ring-teal-100" : "hover:bg-gray-50"
                }`}
              >
                <Avatar name={name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{name}</p>
                  <p className="truncate text-xs text-gray-400">{conv.last_message || "No messages yet"}</p>
                </div>
                {conv.unread_count > 0 && (
                  <span className="rounded-full bg-teal-500 px-2 py-0.5 text-[11px] text-white">
                    {conv.unread_count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  // Чат
  const chatArea = (
    <div className="flex min-h-0 min-w-0 flex-col rounded-2xl border bg-white shadow-sm h-full">
      {activeConv ? (
        <>
          <div className="border-b p-3.5">
            <div className="flex items-center gap-3">
              {/* Кнопка назад — только на мобиле */}
              <button
                onClick={() => setMobilePanel("list")}
                className="shrink-0 rounded-lg p-1 text-gray-400 hover:bg-gray-100 2xl:hidden"
              >
                <ArrowLeft size={18} />
              </button>
              <Avatar name={contactName} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-gray-900">{contactName}</p>
                <p className="text-xs text-gray-400">
                  {user?.role === "PATIENT" ? (activeDoctor?.specialty || "Doctor") : "Patient conversation"}
                </p>
              </div>
              <div className="hidden max-w-[152px] rounded-xl bg-gray-50 px-3 py-2 text-right text-[11px] text-gray-500 lg:block">
                <p>{messageCount} messages</p>
                <p className="mt-1 break-words leading-4">Live updates</p>
              </div>
              {/* Кнопка инфо — только на мобиле/планшете */}
              {activeConv && (
                <button
                  onClick={() => setMobilePanel("info")}
                  className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 2xl:hidden"
                >
                  <Info size={18} />
                </button>
              )}
            </div>
          </div>

          {contextInfo && (
            <div className="border-b bg-yellow-50 px-4 py-2 text-xs text-yellow-700">{contextInfo}</div>
          )}
          {wsError && (
            <div className="border-b bg-amber-50 px-4 py-2 text-xs text-amber-700">
              Connection lost. Messages may not update in real time.
            </div>
          )}
          {messagesError && (
            <div className="border-b bg-red-50 px-4 py-2 flex items-center justify-between gap-3">
              <p className="text-xs text-red-600">{messagesError}</p>
              <button
                onClick={() => void fetchMessagesRef.current?.(activeConvId)}
                className="shrink-0 rounded-lg bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
              >
                Retry
              </button>
            </div>
          )}

          <div ref={messageListRef} className="flex-1 overflow-auto bg-gradient-to-b from-white to-gray-50 p-3.5">
            {hasMoreMessages && (
              <div className="mb-3 flex justify-center">
                <button
                  onClick={handleLoadOlder}
                  disabled={loadingOlder}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  {loadingOlder ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-b-2 border-gray-500" />
                  ) : (
                    <ChevronUp size={14} />
                  )}
                  {loadingOlder ? "Loading..." : "Load older messages"}
                </button>
              </div>
            )}

            <div className="space-y-3">
              {messagesLoading && messages.length === 0 ? (
                <div className="flex h-48 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-teal-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white/70 px-6 text-center">
                  <div>
                    <MessageSquare className="mx-auto mb-3 text-gray-300" size={24} />
                    <p className="text-sm font-medium text-gray-600">No messages yet</p>
                    <p className="mt-1 text-xs text-gray-400">
                      Start the conversation with a simple question or follow-up.
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    msg={{
                      fromMe: msg.sender_id === user?.id,
                      text: msg.text,
                      time: new Date(msg.sent_at).toLocaleTimeString("en-GB", {
                        hour: "2-digit", minute: "2-digit", timeZone: "Asia/Almaty",
                      }),
                    }}
                  />
                ))
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          <div className="border-t p-3.5">
            {sendError && (
              <div className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{sendError}</div>
            )}
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !sending) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                className="flex-1 rounded-xl bg-gray-100 px-4 py-3 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-teal-400"
                placeholder="Type a message..."
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="min-w-[80px] sm:min-w-[94px] rounded-xl bg-teal-500 px-3 sm:px-5 text-sm font-medium text-white hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? "..." : "Send"}
              </button>
            </div>
            <p className="mt-2 break-words text-xs text-gray-400">Press Enter to send.</p>
          </div>
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center p-8 text-center">
          {user?.role === "PATIENT" ? (
            <div>
              <MessageSquare className="mx-auto mb-3 text-gray-300" size={28} />
              <p className="text-sm font-medium text-gray-600">Start a conversation with your doctor</p>
              <p className="mt-1 text-xs text-gray-400">Use the panel on the left to open a secure care chat.</p>
              <button
                onClick={() => setMobilePanel("list")}
                className="mt-4 rounded-xl bg-teal-500 px-4 py-2 text-sm text-white hover:bg-teal-600 2xl:hidden"
              >
                View conversations
              </button>
            </div>
          ) : (
            <div>
              <MessageSquare className="mx-auto mb-3 text-gray-300" size={28} />
              <p className="text-sm font-medium text-gray-600">No conversations yet</p>
              <p className="mt-1 text-xs text-gray-400">Patients can start a new chat from their side.</p>
              <button
                onClick={() => setMobilePanel("list")}
                className="mt-4 rounded-xl bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 2xl:hidden"
              >
                View conversations
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Инфо панель
  const infoPanel = (
    <div className="rounded-2xl border bg-white p-4 shadow-sm h-full overflow-y-auto">
      {/* Кнопка назад — только на мобиле */}
      <div className="mb-4 flex items-center gap-2 2xl:hidden">
        <button
          onClick={() => setMobilePanel("chat")}
          className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-sm font-semibold text-gray-900">
          {user?.role === "DOCTOR" ? "Patient Info" : "Account Info"}
        </h2>
      </div>
      <h2 className="mb-4 hidden text-sm font-semibold text-gray-900 2xl:block">
        {user?.role === "DOCTOR" ? "Patient Info" : "Account Info"}
      </h2>

      {activeConv ? (
        <div className="space-y-4">
          <div className="rounded-3xl bg-gradient-to-br from-teal-50 to-cyan-50 p-4 text-center">
            <Avatar name={contactName} size="lg" />
            <p className="mt-3 break-words text-lg font-semibold text-gray-900">{contactName}</p>
            <p className="mt-1 break-words text-sm text-gray-500">
              {user?.role === "PATIENT" ? (activeDoctor?.specialty || "Doctor") : "Patient"}
            </p>
          </div>

          <div className="space-y-2.5">
            {accountInfoCards.map((card) => (
              <div key={card.label} className="rounded-2xl bg-gray-50 px-4 py-2.5">
                <p className="text-xs uppercase tracking-wide text-gray-400">{card.label}</p>
                <p className="mt-1 break-words text-sm font-medium text-gray-900">{card.value}</p>
              </div>
            ))}
          </div>

          {user?.role === "DOCTOR" && activePatient ? (
            <>
              <div className="rounded-2xl border border-teal-100 bg-teal-50 p-3.5 text-sm text-teal-700">
                <div className="mb-2 flex items-center gap-2">
                  <Stethoscope size={15} /> Clinical context
                </div>
                <p className="text-xs leading-5 text-teal-700/90">
                  Use chat for coordination and follow-up. Open the patient workspace for notes and vitals.
                </p>
              </div>
              <button
                onClick={() => navigate(`/patients/${activeConv.patient_id}`)}
                className="w-full rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                View clinical workspace
              </button>
            </>
          ) : (
            <>
              <div className="rounded-2xl border border-sky-100 bg-sky-50 p-3.5 text-sm text-sky-700">
                <div className="mb-2 flex items-center gap-2">
                  <Info size={15} /> Care chat
                </div>
                <p className="break-words text-xs leading-5 text-sky-700/90">
                  Use this channel for appointment questions and treatment follow-up.
                </p>
              </div>
              <div className="grid gap-2.5">
                <button
                  onClick={() => navigate("/appointments")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  <CalendarClock size={16} /> Open appointments
                </button>
                <button
                  onClick={() => navigate("/doctors")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  <UserRound size={16} /> Browse doctors
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
          <MessageSquare className="mx-auto mb-3 text-gray-300" size={24} />
          <p className="text-sm font-medium text-gray-600">No conversation selected</p>
          <p className="mt-1 text-xs text-gray-400">
            Open a chat to see contact details and contextual information here.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Мобильный вид — только одна панель за раз */}
      <div className="flex h-full flex-col 2xl:hidden">
        {mobilePanel === "list" && conversationsList}
        {mobilePanel === "chat" && chatArea}
        {mobilePanel === "info" && infoPanel}
      </div>

      {/* Десктоп вид — все 3 колонки */}
      <div className="hidden h-full min-h-0 gap-5 2xl:grid 2xl:grid-cols-[300px_minmax(0,1fr)_280px]">
        {conversationsList}
        {chatArea}
        {infoPanel}
      </div>
    </>
  );
}