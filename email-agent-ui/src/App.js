import { useState, useRef, useEffect } from "react";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const messagesEndRef = useRef(null);

  // Check if user is returning from Google login
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionToken = params.get("session");
    if (sessionToken) {
      setSession(sessionToken);
      // Clean up URL
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLogin = () => {
    window.location.href = "http://localhost:8000/login";
  };

  const handleLogout = () => {
    setSession(null);
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => [m.role, m.content]),
          session: session
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.error }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    }

    setLoading(false);
  };

  // Login Screen
  if (!session) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#000000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        gap: "24px"
      }}>
        {/* Logo and Title */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "16px"
        }}>
          <div style={{
            width: "64px",
            height: "64px",
            background: "linear-gradient(135deg, #2563eb, #1e40af)",
            borderRadius: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "34px"
          }}>✉️</div>
          <h1 style={{
            margin: 0,
            color: "white",
            fontSize: "42px",
            fontWeight: "700",
            letterSpacing: "-1px"
          }}>MailBot</h1>
        </div>

        <p style={{ color: "#555555", fontSize: "15px", margin: 0 }}>
          Your AI email assistant
        </p>

        {/* Login Button */}
        <button onClick={handleLogin} style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          background: "white",
          border: "none",
          borderRadius: "12px",
          padding: "14px 24px",
          fontSize: "15px",
          fontWeight: "600",
          color: "#1a1a1a",
          cursor: "pointer"
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>
      </div>
    );
  }

  // Chat Screen
  return (
    <div style={{
      minHeight: "100vh",
      background: "#000000",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: "20px"
    }}>

      {/* Logo, Title and Logout */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        marginBottom: "32px",
        width: "100%",
        maxWidth: "620px",
        justifyContent: "center",
        position: "relative"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "16px"
        }}>
          <div style={{
            width: "64px",
            height: "64px",
            background: "linear-gradient(135deg, #2563eb, #1e40af)",
            borderRadius: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "34px"
          }}>✉️</div>
          <h1 style={{
            margin: 0,
            color: "white",
            fontSize: "42px",
            fontWeight: "700",
            letterSpacing: "-1px"
          }}>MailBot</h1>
        </div>

        {/* Logout Button */}
        <button onClick={handleLogout} style={{
          position: "absolute",
          right: 0,
          background: "#111111",
          border: "1px solid #2a2a2a",
          borderRadius: "10px",
          padding: "8px 14px",
          fontSize: "13px",
          color: "#888888",
          cursor: "pointer"
        }}>
          Logout
        </button>
      </div>

      {/* Suggestions - only show when no messages */}
      {messages.length === 0 && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          width: "100%",
          maxWidth: "620px",
          marginBottom: "16px"
        }}>
          <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#555555", textAlign: "center" }}>
            Try one of these
          </p>
          {[
            "Draft an email to my manager asking for time off",
            "Write a follow-up email to a client",
            "Draft a professional apology email"
          ].map((suggestion, i) => (
            <button key={i} onClick={() => setInput(suggestion)} style={{
              background: "#111111",
              border: "1px solid #2a2a2a",
              borderRadius: "10px",
              padding: "10px 16px",
              fontSize: "13px",
              color: "#888888",
              cursor: "pointer",
              textAlign: "left"
            }}>{suggestion}</button>
          ))}
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div style={{
          width: "100%",
          maxWidth: "620px",
          maxHeight: "55vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          marginBottom: "16px",
          paddingRight: "4px"
        }}>
          {messages.map((msg, index) => (
            <div key={index} style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              gap: "10px",
              alignItems: "flex-end"
            }}>
              {msg.role === "assistant" && (
                <div style={{
                  width: "32px", height: "32px",
                  background: "linear-gradient(135deg, #2563eb, #1e40af)",
                  borderRadius: "10px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "14px", flexShrink: 0
                }}>✉️</div>
              )}
              <div style={{
                maxWidth: "75%",
                padding: "12px 16px",
                borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background: msg.role === "user" ? "linear-gradient(135deg, #2563eb, #1e40af)" : "#1e1e1e",
                color: "white",
                fontSize: "14px",
                lineHeight: "1.6",
                whiteSpace: "pre-wrap",
                border: msg.role === "assistant" ? "1px solid #2a2a2a" : "none"
              }}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
              <div style={{
                width: "32px", height: "32px",
                background: "linear-gradient(135deg, #2563eb, #1e40af)",
                borderRadius: "10px",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "14px"
              }}>✉️</div>
              <div style={{
                background: "#1e1e1e",
                border: "1px solid #2a2a2a",
                borderRadius: "18px 18px 18px 4px",
                padding: "12px 16px",
                display: "flex", gap: "4px", alignItems: "center"
              }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: "6px", height: "6px",
                    background: "#555555",
                    borderRadius: "50%",
                    animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`
                  }}></div>
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input Box */}
      <div style={{
        width: "100%",
        maxWidth: "620px",
        display: "flex",
        gap: "10px",
        alignItems: "flex-end"
      }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="e.g. Draft an email to my manager asking for Friday off..."
          rows={1}
          style={{
            flex: 1,
            border: "1.5px solid #2a2a2a",
            borderRadius: "12px",
            padding: "14px 18px",
            fontSize: "14px",
            outline: "none",
            color: "white",
            background: "#111111",
            resize: "none",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            lineHeight: "1.5",
            maxHeight: "120px",
            overflowY: "auto"
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            background: loading ? "#333333" : "linear-gradient(135deg, #2563eb, #1e40af)",
            color: "white",
            border: "none",
            borderRadius: "12px",
            padding: "14px 20px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
            whiteSpace: "nowrap"
          }}
        >
          Send ➤
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        textarea::placeholder { color: #444444; }
      `}</style>
    </div>
  );
}