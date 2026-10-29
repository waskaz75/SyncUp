import { useEffect, useRef, useState } from "react";

import { generateBackgroundImage } from "./homePageUtils";

function ChatbotPanel({ onSetBackground }) {
  const messageEndRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "intro",
      role: "assistant",
      text: "Hi, I'm Synco! Describe your perfect study background as detailed as possible and I can generate your dream display ₊ ⊹ ° .",
    },
  ]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isLoading, isOpen]);

  async function handleSend(event) {
    event.preventDefault();

    const nextPrompt = prompt.trim();

    if (!nextPrompt || isLoading) {
      return;
    }

    setError("");

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `user-${Date.now()}`,
        role: "user",
        text: nextPrompt,
      },
    ]);

    setPrompt("");
    setIsLoading(true);

    try {
      const imageUrl = await generateBackgroundImage(nextPrompt);

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: "Here is your generated image preview. Choose whether to use it as your background.",
          imageUrl,
        },
      ]);
    } catch {
      setError("Unable to generate image right now.");
    } finally {
      setIsLoading(false);
    }
  }

  function downloadImage(imageUrl) {
    const downloadLink = document.createElement("a");

    downloadLink.href = imageUrl;
    downloadLink.download = "syncup-generated-background.png";

    document.body.append(downloadLink);
    downloadLink.click();
    downloadLink.remove();
  }

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          className="floating-button chat-toggle"
          onClick={() => setIsOpen(true)}
          aria-label="Open background chat"
        >
          Chat
        </button>
      )}

      <aside
        className={`chatbot-panel ${isOpen ? "open" : ""}`}
        aria-label="Background chatbot"
      >
        <header className="chatbot-header">
          <h2>Background Builder</h2>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="chatbot-close"
            aria-label="Close chat"
          >
            ×
          </button>
        </header>

        <div className="chatbot-messages" aria-live="polite">
          {messages.map((message) => (
            <article
              key={message.id}
              className={`chatbot-message ${message.role}`}
            >
              <p>{message.text}</p>

              {message.imageUrl && (
                <div className="chatbot-preview-wrap">
                  <img
                    src={message.imageUrl}
                    alt="Generated background preview"
                    className="chatbot-preview-image"
                  />

                  <div className="chatbot-preview-actions">
                    <button
                      type="button"
                      onClick={() => onSetBackground(message.imageUrl)}
                      aria-label="Set generated image as background"
                    >
                      Set as background
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadImage(message.imageUrl)}
                      aria-label="Download generated image"
                    >
                      Download
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}

          {isLoading && (
            <article className="chatbot-message assistant">
              <p>Generating background…</p>
            </article>
          )}

          {error && (
            <p className="chatbot-error" role="alert">
              {error}
            </p>
          )}

          <div ref={messageEndRef} />
        </div>

        <form className="chatbot-form" onSubmit={handleSend}>
          <label htmlFor="chat-prompt" className="visually-hidden">
            Background prompt
          </label>

          <input
            id="chat-prompt"
            type="text"
            aria-label="Type a prompt for background generation"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Describe your ideal study background"
          />

          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            aria-label="Send prompt"
          >
            Send
          </button>
        </form>
      </aside>
    </>
  );
}

export default ChatbotPanel;
