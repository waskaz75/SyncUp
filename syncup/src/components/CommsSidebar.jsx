
import { useState } from "react";
import CommsAvatar from "./commsAvatar";
import { createDirectMessage, createGroup } from "./commsApi";
import { useUser } from "./homePageUtils";

function SpeakerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M11 5 6 9H2v6h4l5 4Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M19 5a10 10 0 0 1 0 14" />
    </svg>
  );
}

function CommsSidebar({
  activeChannel,
  voice,
  conversations,
  activeConversationId,
  onSelect,
  onConversationCreated,
}) {
  const username = useUser();

  const [composer, setComposer] = useState(null);
  const [name, setName] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [groupUsernames, setGroupUsernames] = useState([]);
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const activeCallConversation = conversations.find(
    (conversation) => conversation.id === voice?.conversationId
  );

  function conversationName(conversation) {
    if (conversation.type !== "DIRECT") {
      return conversation.name;
    }

    return (
      conversation.members?.find(
        (member) => member.username !== username
      )?.username || "Direct message"
    );
  }

  function openComposer(type) {
    setComposer(type);
    setError("");
    setName("");
    setUsernameInput("");
    setGroupUsernames([]);
  }

  function closeComposer() {
    setComposer(null);
    setError("");
    setName("");
    setUsernameInput("");
    setGroupUsernames([]);
  }

  function addGroupUsername() {
    const nextUsername = usernameInput.trim();

    if (!/^[A-Za-z0-9_]{3,20}$/.test(nextUsername)) {
      setError(
        "Enter a valid username (3–20 letters, numbers, or underscores)."
      );
      return;
    }

    if (
      groupUsernames.some(
        (member) =>
          member.toLowerCase() === nextUsername.toLowerCase()
      )
    ) {
      setError("That username has already been added.");
      return;
    }

    if (nextUsername.toLowerCase() === username?.toLowerCase()) {
      setError("You are already a member of this group.");
      return;
    }

    setGroupUsernames((current) => [...current, nextUsername]);
    setUsernameInput("");
    setError("");
  }

  async function handleCreate(event) {
    event.preventDefault();

    if (isCreating) {
      return;
    }

    if (composer === "group") {
      if (!name.trim()) {
        setError("Enter a group name.");
        return;
      }

      if (groupUsernames.length === 0) {
        setError(
          "Add at least one member username before creating the group."
        );
        return;
      }
    } else if (!usernameInput.trim()) {
      setError("Enter a username.");
      return;
    }

    setError("");
    setIsCreating(true);

    try {
      const conversation =
        composer === "group"
          ? await createGroup(name.trim(), groupUsernames)
          : await createDirectMessage(usernameInput.trim());

      onConversationCreated(conversation);
      closeComposer();
    } catch (createError) {
      console.error(
        "Creating conversation failed:",
        createError
      );

      setError(
        createError.message || "Could not create that conversation."
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <aside
      className="comms-sidebar"
      aria-labelledby="comms-sidebar-title"
    >
      <h2 id="comms-sidebar-title">Channels</h2>

      <ul className="comms-sidebar-list">
        {conversations.map((conversation) => {
          const isSelected =
            activeChannel === "chat" &&
            activeConversationId === conversation.id;

          const hasActiveCall =
            voice?.isJoined &&
            voice?.conversationId === conversation.id;

          return (
            <li key={conversation.id}>
              <button
                type="button"
                className={`comms-channel-button ${
                  isSelected ? "active" : ""
                }`}
                aria-current={
                  isSelected ? "true" : undefined
                }
                onClick={() =>
                  onSelect("chat", conversation.id)
                }
              >
                <span
                  className="comms-channel-icon"
                  aria-hidden="true"
                >
                  {conversation.type === "DIRECT" ? "@" : "#"}
                </span>

                <span>{conversationName(conversation)}</span>

                {hasActiveCall && (
                  <span
                    className="comms-live-badge"
                    title="You are in this conversation's voice call"
                  >
                    Live
                  </span>
                )}
              </button>

              {hasActiveCall &&
                voice.screenActive &&
                voice.people?.length > 0 && (
                  <ul
                    className="comms-voice-people"
                    aria-label={`In voice (${voice.people.length})`}
                  >
                    {voice.people.map((person) => (
                      <li
                        key={person.id}
                        className={`comms-voice-person ${
                          person.speaking ? "speaking" : ""
                        }`}
                      >
                        <CommsAvatar
                          picture={person.picture}
                          name={person.username}
                          className="comms-avatar-small"
                        />

                        <span className="comms-voice-person-name">
                          {person.isSelf
                            ? `${person.username} (you)`
                            : person.username}
                        </span>

                        {person.isMuted && (
                          <span className="comms-voice-person-muted">
                            Muted
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
            </li>
          );
        })}

        {conversations.length === 0 && (
          <li>
            <p className="comms-empty">
              No conversations yet. Create a group or start a message.
            </p>
          </li>
        )}

        <li className="comms-conversation-actions">
          <button
            type="button"
            className="checklist-button"
            onClick={() => openComposer("group")}
            disabled={isCreating}
          >
            + Group
          </button>

          <button
            type="button"
            onClick={() => openComposer("direct")}
            disabled={isCreating}
          >
            + Message
          </button>
        </li>

        {composer && (
          <li>
            <form
              className="comms-conversation-form"
              onSubmit={handleCreate}
            >
              <h3>
                {composer === "group"
                  ? "New group"
                  : "New message"}
              </h3>

              {composer === "group" && (
                <input
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Group name"
                  aria-label="Group name"
                  required
                  maxLength={100}
                  disabled={isCreating}
                />
              )}

              {composer === "group" ? (
                <>
                  <label htmlFor="group-member-username">
                    Add a member by username
                  </label>

                  <input
                    id="group-member-username"
                    value={usernameInput}
                    onChange={(event) =>
                      setUsernameInput(event.target.value)
                    }
                    placeholder="username"
                    aria-label="Group member username"
                    disabled={isCreating}
                  />

                  <button
                    type="button"
                    onClick={addGroupUsername}
                    disabled={isCreating}
                  >
                    Add username
                  </button>

                  {groupUsernames.length > 0 && (
                    <ul aria-label="Added group members">
                      {groupUsernames.map((memberUsername) => (
                        <li key={memberUsername}>
                          {memberUsername}
                        </li>
                      ))}
                    </ul>
                  )}

                  <p>
                    Enter another username to add another person.
                  </p>
                </>
              ) : (
                <input
                  value={usernameInput}
                  onChange={(event) =>
                    setUsernameInput(event.target.value)
                  }
                  placeholder="username"
                  aria-label="Person's username"
                  required
                  disabled={isCreating}
                />
              )}

              {error && (
                <p role="alert">{error}</p>
              )}

              <button
                type="submit"
                disabled={isCreating}
              >
                {isCreating
                  ? "Creating…"
                  : composer === "group"
                    ? "Create group"
                    : "Start message"}
              </button>

              <button
                type="button"
                onClick={closeComposer}
                disabled={isCreating}
              >
                Cancel
              </button>
            </form>
          </li>
        )}
      </ul>

      {voice?.isJoined && (
        <div
          className="comms-sidebar-call-status"
          role="status"
          style={{
            padding: "12px",
            borderTop: "1px solid var(--border-color, #ddd)",
            marginTop: "12px",
          }}
        >
          <div
            style={{
              marginTop: "5px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <SpeakerIcon />
            <strong className="voice-connected">Voice connected</strong>
          </div>

          <p style={{ marginTop: "10px", marginBottom: "8px", fontSize: "17px", fontWeight: "bold" }}>
            {activeCallConversation
              ? conversationName(activeCallConversation)
              : "Active conversation"}
          </p>

          <button
            type="button"
            className="checklist-button checklist-button-secondary"
            onClick={() =>
              onSelect(
                "voice",
                voice.conversationId || activeConversationId
              )
            }
          >
            Return to call
          </button>
        </div>
      )}
    </aside>
  );
}

export default CommsSidebar;
