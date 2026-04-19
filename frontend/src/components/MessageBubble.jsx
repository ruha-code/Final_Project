import { RefreshCw } from "lucide-react";

function MessageBubble({ msg, onRetry }) {
  const status = msg.status;
  const isSending = status === "sending";
  const isError = status === "error";

  return (
    <div className={`flex ${msg.fromMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[70%] break-words rounded-2xl p-3 text-sm ${
          msg.fromMe ? "bg-teal-500 text-white" : "bg-gray-100 text-gray-700"
        } ${isError ? "border-2 border-red-400" : ""}`}
      >
        <p>{msg.text}</p>

        <div className="mt-1 flex items-center justify-end gap-1 text-xs opacity-70">
          <span>{msg.time}</span>
          {msg.fromMe && (
            <span>
              {isSending ? "Sending..." : isError ? "Failed" : "Sent"}
            </span>
          )}
          {isError && onRetry && (
            <button
              onClick={() => onRetry(msg.tempId)}
              className="flex items-center gap-1 rounded px-1 py-0.5 hover:bg-red-500/20"
              title="Retry"
            >
              <RefreshCw size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;