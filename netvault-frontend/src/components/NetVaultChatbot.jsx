import { useState, useEffect, useRef } from "react";

async function askAI(messages) {
  try {
    const res = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    const data = await res.json();
    return data.reply || "Sorry, something went wrong. Please try again!";
  } catch {
    return "Could not connect to server. Please try again!";
  }
}

// ── Quick option buttons ─────────────────────────────────────────────
const QUICK_OPTIONS = [
  { label: "🌐 About NetVault", value: "Tell me everything about the NetVault platform and its features." },
  { label: "💳 Subscription & Pricing", value: "What are the subscription plans and pricing?" },
  { label: "📝 How to Register?", value: "How do I register on NetVault? Is there a free trial?" },
  { label: "🤖 Automation Features", value: "What automation features does NetVault offer? Tell me about expiry alerts and auto-renewal." },
  { label: "🔒 Security & Data Safety", value: "How secure is NetVault? Is my data safe? What encryption is used?" },
  { label: "📊 Client Portal", value: "What can clients see in the client portal? How do they get access?" },
];

// ── Typing indicator ─────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "10px 14px" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "#1E3A5F",
            display: "inline-block",
            animation: "nvBounce 1.2s infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

// ── Message bubble ───────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isBot = msg.role === "assistant";
  return (
    <div style={{
      display: "flex",
      justifyContent: isBot ? "flex-start" : "flex-end",
      marginBottom: 12,
      animation: "nvFadeIn 0.3s ease",
    }}>
      {isBot && (
        <div style={{
          width: 30, height: 30, borderRadius: "50%",
          background: "linear-gradient(135deg, #1E3A5F, #2E86AB)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, flexShrink: 0, marginRight: 8, marginTop: 2,
        }}>🤖</div>
      )}
      <div style={{
        maxWidth: "78%",
        background: isBot
          ? "linear-gradient(135deg, #f0f7ff, #e8f4fd)"
          : "linear-gradient(135deg, #1E3A5F, #2E86AB)",
        color: isBot ? "#1a2744" : "#ffffff",
        borderRadius: isBot ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
        padding: "10px 14px",
        fontSize: 13.5,
        lineHeight: 1.6,
        boxShadow: isBot
          ? "0 2px 10px rgba(30,58,95,0.1)"
          : "0 2px 10px rgba(46,134,171,0.3)",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}>
        {msg.content}
      </div>
      {!isBot && (
        <div style={{
          width: 30, height: 30, borderRadius: "50%",
          background: "rgba(46,134,171,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, flexShrink: 0, marginLeft: 8, marginTop: 2,
        }}>👤</div>
      )}
    </div>
  );
}

// ── Main chatbot widget ──────────────────────────────────────────────
export default function NetVaultChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [greeted, setGreeted] = useState(false);
  const [unread, setUnread] = useState(1);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, showOptions]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      setUnread(0);
    }
  }, [open]);

  // Greet user on first open
  useEffect(() => {
    if (open && !greeted) {
      setGreeted(true);
      setLoading(true);
      setTimeout(() => {
        setMessages([{
          role: "assistant",
          content: "👋 Hello! Welcome to NetVault!\n\nI'm your AI Assistant. I can help you with domain management, hosting, billing, automation, and anything else about NetVault.\n\nPick a topic below or ask me anything! 😊",
        }]);
        setShowOptions(true);
        setLoading(false);
      }, 800);
    }
  }, [open, greeted]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    setInput("");
    setShowOptions(false);
    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    const reply = await askAI(newMessages.map((m) => ({ role: m.role, content: m.content })));
    setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    setShowOptions(true);
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <style>{`
        @keyframes nvBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes nvFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes nvChatOpen {
          from { opacity: 0; transform: scale(0.88) translateY(16px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes nvPulse {
          0% { box-shadow: 0 4px 20px rgba(46,134,171,0.5), 0 0 0 0 rgba(46,134,171,0.5); }
          70% { box-shadow: 0 4px 20px rgba(46,134,171,0.5), 0 0 0 12px rgba(46,134,171,0); }
          100% { box-shadow: 0 4px 20px rgba(46,134,171,0.5), 0 0 0 0 rgba(46,134,171,0); }
        }
        @keyframes nvOptIn {
          from { opacity: 0; transform: translateX(-6px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .nv-opt-btn:hover {
          background: linear-gradient(135deg, #1E3A5F, #2E86AB) !important;
          color: #fff !important;
          border-color: #1E3A5F !important;
          transform: translateX(3px) !important;
        }
        .nv-chat-msgs::-webkit-scrollbar { width: 4px; }
        .nv-chat-msgs::-webkit-scrollbar-track { background: transparent; }
        .nv-chat-msgs::-webkit-scrollbar-thumb { background: #c0d6e8; border-radius: 4px; }
      `}</style>

      {/* ── Launcher button ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 9999,
          width: 56, height: 56, borderRadius: "50%", border: "none",
          background: open
            ? "linear-gradient(135deg, #dc2626, #991b1b)"
            : "linear-gradient(135deg, #1E3A5F, #2E86AB)",
          cursor: "pointer", fontSize: 22,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.3s ease",
          animation: !open ? "nvPulse 2.5s infinite" : "none",
        }}
        title="Chat with NetVault AI"
      >
        {open ? "✕" : "💬"}
        {!open && unread > 0 && (
          <span style={{
            position: "absolute", top: -3, right: -3,
            background: "#ef4444", color: "#fff",
            borderRadius: "50%", width: 18, height: 18,
            fontSize: 10, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid #fff",
          }}>
            {unread}
          </span>
        )}
      </button>

      {/* ── Chat window ── */}
      {open && (
        <div style={{
          position: "fixed", bottom: 96, right: 28, zIndex: 9998,
          width: "min(390px, calc(100vw - 40px))",
          height: "min(560px, calc(100vh - 130px))",
          background: "#ffffff",
          borderRadius: 20,
          boxShadow: "0 20px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(46,134,171,0.15)",
          display: "flex", flexDirection: "column", overflow: "hidden",
          animation: "nvChatOpen 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          fontFamily: "inherit",
        }}>

          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #1E3A5F, #2E86AB)",
            padding: "14px 16px",
            display: "flex", alignItems: "center", gap: 11,
            flexShrink: 0,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, border: "2px solid rgba(255,255,255,0.25)",
              flexShrink: 0,
            }}>🤖</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>NetVault Assistant</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80" }} />
                <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 11 }}>Online · AI Powered</span>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: "rgba(255,255,255,0.15)", border: "none",
                color: "#fff", width: 30, height: 30, borderRadius: "50%",
                cursor: "pointer", fontSize: 14,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >✕</button>
          </div>

          {/* Messages */}
          <div
            className="nv-chat-msgs"
            style={{
              flex: 1, overflowY: "auto",
              padding: "14px 12px 8px",
              background: "#f8fbff",
            }}
          >
            {messages.length === 0 && !loading && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#9ab4c8" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>👋</div>
                <div style={{ fontSize: 13 }}>AI Assistant is ready...</div>
              </div>
            )}

            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}

            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: "linear-gradient(135deg, #1E3A5F, #2E86AB)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                }}>🤖</div>
                <div style={{
                  background: "linear-gradient(135deg, #f0f7ff, #e8f4fd)",
                  borderRadius: "4px 16px 16px 16px",
                  boxShadow: "0 2px 10px rgba(30,58,95,0.1)",
                }}>
                  <TypingDots />
                </div>
              </div>
            )}

            {/* Quick options */}
            {showOptions && !loading && messages.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{
                  fontSize: 10, color: "#9ab4c8", fontWeight: 600,
                  marginBottom: 6, paddingLeft: 38,
                  letterSpacing: 0.5, textTransform: "uppercase",
                }}>
                  Quick Questions
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {QUICK_OPTIONS.map((opt, i) => (
                    <button
                      key={i}
                      className="nv-opt-btn"
                      onClick={() => sendMessage(opt.value)}
                      style={{
                        background: "#fff",
                        border: "1.5px solid #d0e8f5",
                        borderRadius: 9,
                        padding: "8px 12px",
                        fontSize: 12.5,
                        color: "#1E3A5F",
                        fontWeight: 500,
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.2s ease",
                        fontFamily: "inherit",
                        animation: `nvOptIn 0.25s ease ${i * 0.05}s both`,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "10px 12px",
            borderTop: "1px solid #e8f0f8",
            background: "#fff",
            display: "flex", gap: 8, alignItems: "flex-end",
            flexShrink: 0,
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question... (Enter to send)"
              rows={1}
              disabled={loading}
              style={{
                flex: 1,
                border: "1.5px solid #d0e8f5",
                borderRadius: 10,
                padding: "9px 12px",
                fontSize: 13,
                fontFamily: "inherit",
                outline: "none",
                resize: "none",
                lineHeight: 1.5,
                color: "#1a2744",
                background: "#f8fbff",
                maxHeight: 72,
                overflowY: "auto",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#2E86AB")}
              onBlur={(e) => (e.target.style.borderColor = "#d0e8f5")}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{
                width: 38, height: 38,
                background: input.trim() && !loading
                  ? "linear-gradient(135deg, #1E3A5F, #2E86AB)"
                  : "#e2ecf5",
                border: "none", borderRadius: 10,
                cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                color: input.trim() && !loading ? "#fff" : "#9ab4c8",
                fontSize: 16,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.2s ease",
              }}
            >
              ➤
            </button>
          </div>

          {/* Footer */}
          <div style={{
            textAlign: "center", padding: "5px 12px 8px",
            fontSize: 10, color: "#b0c8d8",
            background: "#fff",
            borderTop: "1px solid #f0f6fc",
            flexShrink: 0,
          }}>
            Powered by <strong style={{ color: "#2E86AB" }}>NetVault AI</strong>
          </div>
        </div>
      )}
    </>
  );
}