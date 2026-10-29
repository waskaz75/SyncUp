import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

import { PROMPT_ERROR_CODE, sendStudyBuddyPrompt } from "./studyBuddyApi";

const EMPTY_PROMPT_MESSAGE = "Please enter a question or topic to send.";
const BAD_PROMPT_MESSAGE =
  "Study Buddy couldn't answer that. Please enter an appropriate prompt and try again.";
const UNAVAILABLE_MESSAGE =
  "Study Buddy is unavailable right now. Please try again in a moment.";

function StudyBuddyPage() {
  const messageEndRef = useRef(null);
  const inputRef = useRef(null);

  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isLoading]);

  async function handleSend(event) {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    const nextPrompt = prompt.trim();

    if (!nextPrompt) {
      setError(EMPTY_PROMPT_MESSAGE);
      inputRef.current?.focus();
      return;
    }

    setError("");
    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: "user", text: nextPrompt },
    ]);
    setPrompt("");
    setIsLoading(true);

    try {
      const answer = await sendStudyBuddyPrompt(nextPrompt);

      setMessages((current) => [
        ...current,
        { id: `assistant-${Date.now()}`, role: "assistant", text: answer },
      ]);
    } catch (requestError) {
      console.error("Study Buddy request failed:", requestError);

      setError(
        requestError?.code === PROMPT_ERROR_CODE
          ? BAD_PROMPT_MESSAGE
          : UNAVAILABLE_MESSAGE
      );

      setPrompt(nextPrompt);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

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

  return (
    <section className="studybuddy-page" aria-labelledby="studybuddy-heading">
      <div className="studybuddy-panel">
        <header className="studybuddy-header">
          <h1 id="studybuddy-heading">Study Buddy AI</h1>
          <p>Ask a question, get an explanation, or plan your next study session.</p>
        </header>

        <div
          className="chatbot-messages studybuddy-messages"
          role="log"
          aria-live="polite"
          aria-label="Conversation with Study Buddy"
        >
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
              <div
                className="ai-loading"
                role="status"
                aria-label="Study Buddy is thinking"
              >
                <span className="ai-loading-spinner" aria-hidden="true" />
                <span>Thinking…</span>
              </div>
            </article>
          )}

          <div ref={messageEndRef} />
        </div>

        {error && (
          <p className="chatbot-error studybuddy-error" role="alert">
            {error}
          </p>
        )}

        <form className="chatbot-form" onSubmit={handleSend} noValidate>
          <label htmlFor="studybuddy-prompt" className="visually-hidden">
            Ask Study Buddy
          </label>

          <input
            ref={inputRef}
            id="studybuddy-prompt"
            type="text"
            value={prompt}
            maxLength={2000}
            autoComplete="off"
            readOnly={isLoading}
            placeholder="Ask Study Buddy anything"
            aria-required="true"
            aria-invalid={error === EMPTY_PROMPT_MESSAGE}
            onChange={(event) => {
              setPrompt(event.target.value);
              setError("");
            }}
          />

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Sending…" : "Send"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default StudyBuddyPage;