import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot } from "lucide-react";

const FAQ_DATA = [
  {
    keywords: ["appointment", "book", "schedule", "записаться", "запись"],
    answer: "You can book an appointment by going to the **Appointments** page in the sidebar. Click 'New Appointment', select a doctor, date and time, then confirm.",
  },
  {
    keywords: ["cancel", "reschedule", "отменить", "перенести"],
    answer: "To cancel or reschedule, go to **Appointments**, find your appointment, and click the cancel or reschedule button. Please cancel at least 24 hours in advance.",
  },
  {
    keywords: ["doctor", "врач", "specialist", "specialty"],
    answer: "You can browse available doctors in the **Doctors** section. Each doctor's profile shows their specialty, availability, and patient reviews.",
  },
  {
    keywords: ["prescription", "medicine", "drug", "рецепт", "лекарство"],
    answer: "Prescriptions are managed by your doctor. After your appointment, you can view prescribed medications in your **My Health** section under 'Prescriptions'.",
  },
  {
    keywords: ["test", "result", "lab", "analysis", "анализ", "результат"],
    answer: "Lab results are available in your **My Health** section. Results typically appear within 24-48 hours after your test. Your doctor will also be notified.",
  },
  {
    keywords: ["insurance", "payment", "bill", "cost", "страховка", "оплата"],
    answer: "For billing questions, please contact our front desk. Payment information and insurance details can be updated in your **Profile** settings.",
  },
  {
    keywords: ["hours", "open", "close", "time", "working", "часы", "время"],
    answer: "Our clinic is open **Monday-Friday: 8:00 AM - 8:00 PM** and **Saturday: 9:00 AM - 5:00 PM**. We are closed on Sundays and public holidays.",
  },
  {
    keywords: ["emergency", "urgent", "срочно", "экстренный"],
    answer: "For emergencies, please call **911** or go to the nearest emergency room. For urgent but non-emergency issues, call us at **+1 (555) 123-4567**.",
  },
  {
    keywords: ["password", "reset", "forgot", "сброс", "пароль", "login"],
    answer: "To reset your password, click 'Forgot password?' on the login page. You'll receive an email with a reset link valid for 30 minutes.",
  },
  {
    keywords: ["profile", "update", "change", "edit", "профиль", "изменить"],
    answer: "You can update your personal information, phone number, and preferences in your **Profile** section. Click on your name in the top-right corner.",
  },
  {
    keywords: ["hello", "hi", "hey", "привет", "здравствуйте"],
    answer: "Hello! 👋 I'm the Medlink assistant. I can help you with appointments, prescriptions, test results, billing, and more. What would you like to know?",
  },
  {
    keywords: ["help", "помощь", "support", "assist"],
    answer: "I can help with:\n• **Appointments** — booking, canceling, rescheduling\n• **Doctors** — finding specialists\n• **Prescriptions** — viewing medications\n• **Test Results** — checking lab results\n• **Billing** — payment and insurance\n• **Hours** — clinic working hours\n\nJust ask me anything!",
  },
  {
    keywords: ["thank", "thanks", "спасибо"],
    answer: "You're welcome! 😊 If you have any other questions, feel free to ask. Have a great day!",
  },
  {
    keywords: ["location", "address", "where", "адрес", "где"],
    answer: "Our clinic is located at **123 Medical Center Drive, Suite 100**. Free parking is available in the basement garage. Enter through the main entrance.",
  },
  {
    keywords: ["visit", "checkup", "examination", "осмотр"],
    answer: "For a general checkup, book a **General Consultation** appointment. Arrive 10 minutes early and bring your insurance card and ID.",
  },
];

const DEFAULT_ANSWER =
  "I'm not sure about that. Here are some topics I can help with:\n\n• Appointments & scheduling\n• Doctors & specialties\n• Prescriptions & medications\n• Test results\n• Billing & insurance\n• Clinic hours\n\nTry asking about one of these topics!";

function findBestAnswer(message) {
  const lower = message.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;

  for (const faq of FAQ_DATA) {
    let score = 0;
    for (const keyword of faq.keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        score += keyword.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = faq;
    }
  }

  return bestMatch && bestScore > 2 ? bestMatch.answer : DEFAULT_ANSWER;
}

function formatMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/\n/g, "<br/>");
}

function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hi! 👋 I'm your Medlink assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setMessages((prev) => [...prev, { from: "user", text: trimmed }]);
    setInput("");
    setIsTyping(true);

    const delay = 500 + Math.random() * 1000;
    setTimeout(() => {
      const answer = findBestAnswer(trimmed);
      setMessages((prev) => [...prev, { from: "bot", text: answer }]);
      setIsTyping(false);
    }, delay);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = [
    "How do I book an appointment?",
    "What are your working hours?",
    "How to cancel an appointment?",
    "Where can I see test results?",
  ];

  const handleQuickQuestion = (q) => {
    setMessages((prev) => [...prev, { from: "user", text: q }]);
    setIsTyping(true);
    const delay = 500 + Math.random() * 1000;
    setTimeout(() => {
      const answer = findBestAnswer(q);
      setMessages((prev) => [...prev, { from: "bot", text: answer }]);
      setIsTyping(false);
    }, delay);
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed bottom-20 right-5 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[60] flex flex-col overflow-hidden"
          style={{ height: "480px" }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Medlink Assistant</p>
                <p className="text-[10px] text-teal-100">Online • Ready to help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 text-sm leading-relaxed ${
                    msg.from === "user"
                      ? "bg-teal-500 text-white rounded-2xl rounded-br-md"
                      : "bg-white text-gray-700 rounded-2xl rounded-bl-md shadow-sm border border-gray-100"
                  }`}
                >
                  {msg.from === "bot" ? (
                    <span dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }} />
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-100">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 2 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickQuestion(q)}
                  className="text-xs bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full hover:bg-teal-100 transition border border-teal-100"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t bg-white shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                className="flex-1 bg-gray-100 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className="bg-teal-500 hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl p-2 transition"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-5 right-5 z-[65] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? "bg-gray-600 hover:bg-gray-700"
            : "bg-teal-500 hover:bg-teal-600 hover:scale-110"
        }`}
      >
        {isOpen ? (
          <X size={22} className="text-white" />
        ) : (
          <MessageSquare size={22} className="text-white" />
        )}
      </button>
    </>
  );
}

export default ChatBot;
