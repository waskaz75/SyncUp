import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

function StudyBuddyPanel({ onClose }) {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  function renderMessage(message) {
    if (message.role === "user") {
      return <p>{message.text}</p>;
    }

    return (
      <div className="study-buddy-markdown">
        <ReactMarkdown remarkPlugins={[remarkBreaks]}>
          {message.text}
        </ReactMarkdown>
      </div>
    );
  }

  async function handleSend(event) {
    event.preventDefault();

    const nextPrompt = prompt.trim();

    if (!nextPrompt || isLoading) {
      return;
    }

    setError("");
    setMessages((currentMessages) => [
      ...currentMessages,
      { id: `user-${Date.now()}`, role: "user", text: nextPrompt },
    ]);
    setPrompt("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/study-buddy/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ prompt: nextPrompt }),
      });
      const responseText = await response.text();
      let payload;

      try {
        payload = JSON.parse(responseText);
      } catch {
        throw new Error(
          `Study Buddy request failed (HTTP ${response.status}).`
        );
      }

      if (!response.ok || !payload.response) {
        throw new Error(payload.error || "Study Buddy is unavailable.");
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: payload.response,
        },
      ]);
    } catch (requestError) {
      setError(requestError.message || "Study Buddy is unavailable.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="study-buddy-panel" role="tabpanel">
      <header className="chatbot-header">
        <h2>Study Buddy AI</h2>
        <button
          type="button"
          onClick={onClose}
          className="chatbot-close"
          aria-label="Close Study Buddy AI"
        >
          ×
        </button>
      </header>

      <div className="chatbot-messages" aria-live="polite">
        {messages.length === 0 && (
          <article className="chatbot-message assistant">
            <p>Hi! What would you like to study today?</p>
          </article>
        )}

        {messages.map((message) => (
          <article
            key={message.id}
            className={`chatbot-message ${message.role}`}
          >
            {renderMessage(message)}
          </article>
        ))}

        {isLoading && (
          <article className="chatbot-message assistant">
            <div className="ai-loading" role="status" aria-label="Study Buddy is thinking">
              <span className="ai-loading-spinner" aria-hidden="true" />
              <span>Thinking…</span>
            </div>
          </article>
        )}

        {error && (
          <p className="chatbot-error" role="alert">
            {error}
          </p>
        )}
      </div>

      <form className="chatbot-form" onSubmit={handleSend}>
        <label htmlFor="study-buddy-prompt" className="visually-hidden">
          Ask Study Buddy
        </label>
        <input
          id="study-buddy-prompt"
          type="text"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Ask Study Buddy anything"
          aria-label="Ask Study Buddy"
        />
        <button type="submit" disabled={isLoading || !prompt.trim()}>
          Send
        </button>
      </form>
    </section>
  );
}

export default StudyBuddyPanel;
