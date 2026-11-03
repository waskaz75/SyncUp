
import { useEffect, useMemo, useRef, useState } from "react";
import CommsAvatar from "./commsAvatar";
import { useProfilePicture } from "./useProfilePicture";

import {
  MAX_MESSAGE_LENGTH,
  getMessages,
  sendMessage,
  subscribeToMessages,
} from "./commsApi";
import { formatMessageTime, groupMessagesByDate } from "./commsUtils";
import { useUser } from "./homePageUtils";

const EMPTY_MESSAGE = "Please type a message to send.";
const SEND_FAILED_MESSAGE =
  "Your message could not be sent. It is still in the box, so you can try again.";

function ChatChannel({
  isActive,
  conversation,
  onAddMember,
  onStartCall,
  isInCall = false,
}) {
  const username = useUser();
  const myPicture = useProfilePicture();

  const conversationName =
    conversation?.type === "DIRECT"
      ? conversation.members?.find(
          (member) => member.username !== username
        )?.username || "Direct message"
      : conversation?.name;

  const memberNames =
    conversation?.members
      ?.map((member) => member.username)
      .filter(Boolean)
      .join(", ") || "No members";

  const inputRef = useRef(null);
  const messageEndRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(conversation));
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const groups = useMemo(
    () => groupMessagesByDate(messages),
    [messages]
  );

  useEffect(() => {
    if (!conversation) {
      setMessages([]);
      setIsLoading(false);
      return undefined;
    }

    let isCancelled = false;

    async function loadMessages() {
      setIsLoading(true);
      setError("");

      try {
        const loaded = await getMessages(conversation.id);

        if (!isCancelled) {
          setMessages(loaded);
        }
      } catch (loadError) {
        if (!isCancelled) {
          console.error("Loading messages failed:", loadError);
          setError("Could not load the messages.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadMessages();

    const unsubscribe = subscribeToMessages(
      conversation.id,
      setMessages
    );

    return () => {
      isCancelled = true;
      unsubscribe();
    };
  }, [conversation?.id]);

  // Keep the newest message visible when messages arrive
  // or when returning to this conversation.
  useEffect(() => {
    if (isActive) {
      messageEndRef.current?.scrollIntoView({
        block: "end",
      });
    }
  }, [messages, isLoading, isActive]);

  async function handleSend(event) {
    event.preventDefault();

    if (isSending || !conversation) {
      return;
    }

    const trimmed = text.trim();

    if (!trimmed) {
      setError(EMPTY_MESSAGE);
      inputRef.current?.focus();
      return;
    }

    setError("");
    setIsSending(true);

    try {
      const sent = await sendMessage(
        conversation.id,
        trimmed
      );

      setMessages((current) =>
        current.some((message) => message.id === sent.id)
          ? current
          : [...current, sent]
      );

      setText("");
    } catch (sendError) {
      console.error(
        "Sending message failed:",
        sendError
      );

      setError(
        sendError.message || SEND_FAILED_MESSAGE
      );
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }

  return (
    <section
      className="comms-view"
      aria-labelledby="comms-chat-title"
    >
      <header className="comms-view-header comms-chat-header">
        <div className="comms-chat-header-text">
          <h2 id="comms-chat-title">
            {conversation?.type === "DIRECT" ? "@" : "#"}{" "}
            {conversationName || "Text conversations"}
          </h2>

          <p className="comms-recipient">
            {conversation?.type === "DIRECT"
              ? "To:"
              : "Members:"}{" "}
            <strong>
              {conversation?.type === "DIRECT"
                ? conversationName
                : memberNames}
            </strong>
          </p>
        </div>

        {conversation && (
          <div
            className="comms-chat-header-actions"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className="checklist-button checklist-button-secondary comms-call-button"
              onClick={onStartCall}
              aria-label={
                isInCall
                  ? "Return to voice call"
                  : `Open voice call for ${conversationName}`
              }
              title={
                isInCall
                  ? "Return to voice call"
                  : "Start voice call"
              }
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.19 18a19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.09 3.18 2 2 0 0 1 4.08 1h3a2 2 0 0 1 2 1.72c.12.96.34 1.9.65 2.81a2 2 0 0 1-.45 2.11L8 8.91a16 16 0 0 0 6 6l1.27-1.28a2 2 0 0 1 2.11-.45c.91.31 1.85.53 2.81.65A2 2 0 0 1 22 16.92Z" />
              </svg>

              <span>
                {isInCall ? "In call" : "Call"}
              </span>
            </button>

            {conversation.type === "GROUP" && (
              <button
                type="button"
                className="checklist-button comms-add-member"
                onClick={onAddMember}
              >
                + Add member
              </button>
            )}
          </div>
        )}
      </header>

      <div
        className="comms-messages"
        role="log"
        aria-live="polite"
        aria-label="Text chat messages"
      >
        {isLoading && (
          <p
            className="comms-empty"
            role="status"
          >
            Loading messages…
          </p>
        )}

        {!isLoading && messages.length === 0 && (
          <p className="comms-empty">
            No messages yet. Say hello to start
            the conversation.
          </p>
        )}

        {groups.map((group) => (
          <section
            key={group.key}
            className="comms-date-group"
            aria-label={group.label}
          >
            <h3 className="comms-date">
              {group.label}
            </h3>

            {group.messages.map((message) => {
              const isMine =
                message.author === username;

              return (
                <article
                  key={message.id}
                  className={`comms-message ${
                    isMine ? "mine" : ""
                  }`}
                >
                  <CommsAvatar
                    picture={
                      isMine
                        ? myPicture
                        : message.authorPicture
                    }
                    name={message.author}
                  />

                  <div className="comms-bubble">
                    <p className="comms-meta">
                      <span className="comms-author">
                        {message.author}
                      </span>

                      <time
                        className="comms-time"
                        dateTime={message.sentAt}
                      >
                        {formatMessageTime(
                          message.sentAt
                        )}
                      </time>
                    </p>

                    <p className="comms-text">
                      {message.text}
                    </p>
                  </div>
                </article>
              );
            })}
          </section>
        ))}

        <div ref={messageEndRef} />
      </div>

      {error && (
        <div
          className="checklist-banner comms-banner"
          role="alert"
        >
          <p>{error}</p>

          <button
            type="button"
            className="checklist-banner-dismiss"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {conversation && (
        <form
          className="chatbot-form"
          onSubmit={handleSend}
          noValidate
        >
          <label
            htmlFor="comms-message-input"
            className="visually-hidden"
          >
            Message
          </label>

          <input
            ref={inputRef}
            id="comms-message-input"
            type="text"
            value={text}
            maxLength={MAX_MESSAGE_LENGTH}
            autoComplete="off"
            readOnly={isSending}
            placeholder={`Message ${conversationName}`}
            aria-label={`Message ${conversationName}`}
            aria-required="true"
            aria-invalid={error === EMPTY_MESSAGE}
            onChange={(event) => {
              setText(event.target.value);

              if (error === EMPTY_MESSAGE) {
                setError("");
              }
            }}
          />

          <button
            type="submit"
            disabled={isSending}
          >
            {isSending ? "Sending…" : "Send"}
          </button>
        </form>
      )}
    </section>
  );
}

export default ChatChannel;
