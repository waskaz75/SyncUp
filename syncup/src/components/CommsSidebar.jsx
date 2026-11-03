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
  const showPeople = voice.isJoined && voice.screenActive;
  const username = useUser();
  const [composer, setComposer] = useState(null);
  const [name, setName] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [groupUsernames, setGroupUsernames] = useState([]);
  const [error, setError] = useState("");

  function conversationName(conversation) {
    if (conversation.type !== "DIRECT") {
      return conversation.name;
    }
    return (
      conversation.members.find((member) => member.username !== username)
        ?.username || "Direct message"
    );
  }

  async function openComposer(type) {
    setComposer(type);
    setError("");
    setName("");
    setUsernameInput("");
    setGroupUsernames([]);
  }

  function addGroupUsername() {
    const nextUsername = usernameInput.trim();

    if (!/^[A-Za-z0-9_]{3,20}$/.test(nextUsername)) {
      setError("Enter a valid username (3–20 letters, numbers, or underscores).");
      return;
    }

    if (groupUsernames.includes(nextUsername)) {
      setError("That username has already been added.");
      return;
    }

    setGroupUsernames((current) => [...current, nextUsername]);
    setUsernameInput("");
    setError("");
  }

  async function handleCreate(event) {
    event.preventDefault();

    if (composer === "group" && groupUsernames.length === 0) {
      setError("Add at least one member username before creating the group.");
      return;
    }

    try {
      const conversation =
        composer === "group"
          ? await createGroup(name, groupUsernames)
          : await createDirectMessage(usernameInput.trim());
      onConversationCreated(conversation);
      setComposer(null);
    } catch (createError) {
      console.error("Creating conversation failed:", createError);
      setError(createError.message || "Could not create that conversation.");
    }
  }

  return (
    <aside className="comms-sidebar" aria-labelledby="comms-sidebar-title">
      <h2 id="comms-sidebar-title">Channels</h2>

      <ul className="comms-sidebar-list">
        {conversations.map((conversation) => (
          <li key={conversation.id}>
            <button
              type="button"
              className={`comms-channel-button ${
                activeChannel === "chat" &&
                activeConversationId === conversation.id
                  ? "active"
                  : ""
              }`}
              aria-current={
                activeConversationId === conversation.id ? "true" : undefined
              }
              onClick={() => onSelect("chat", conversation.id)}
            >
              <span className="comms-channel-icon" aria-hidden="true">
                {conversation.type === "DIRECT" ? "@" : "#"}
              </span>
              <span>{conversationName(conversation)}</span>
            </button>
          </li>
        ))}

        <li className="comms-conversation-actions">
          <button type="button" class="checklist-button" onClick={() => openComposer("group")}>
            + Group
          </button>
          <button type="button" onClick={() => openComposer("direct")}>
            + Message
          </button>
        </li>

        {composer && (
          <li>
            <form
              className="comms-conversation-form"
              onSubmit={handleCreate}
            >
              <h3>{composer === "group" ? "New group" : "New message"}</h3>
              {composer === "group" && (
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Group name"
                  aria-label="Group name"
                  required
                  maxLength={100}
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
                    onChange={(event) => setUsernameInput(event.target.value)}
                    placeholder="username"
                    aria-label="Group member username"
                  />
                  <button type="button" onClick={addGroupUsername}>
                    Add username
                  </button>
                  {groupUsernames.length > 0 && (
                    <ul aria-label="Added group members">
                      {groupUsernames.map((memberUsername) => (
                        <li key={memberUsername}>{memberUsername}</li>
                      ))}
                    </ul>
                  )}
                  <p>Enter another username to add another person.</p>
                </>
              ) : (
                <input
                  value={usernameInput}
                  onChange={(event) => setUsernameInput(event.target.value)}
                  placeholder="username"
                  aria-label="Person's username"
                  required
                />
              )}
              {error && <p role="alert">{error}</p>}
              <button type="submit">
                {composer === "group" ? "Create group" : "Start message"}
              </button>
              <button type="button" onClick={() => setComposer(null)}>
                Cancel
              </button>
            </form>
          </li>
        )}

        <li>
          <button
            type="button"
            className={`comms-channel-button ${
              activeChannel === "voice" ? "active" : ""
            }`}
            aria-current={activeChannel === "voice" ? "true" : undefined}
            onClick={() => onSelect("voice")}
          >
            <span className="comms-channel-icon">
              <SpeakerIcon />
            </span>
            <span>Voice channel</span>

            {voice.isJoined && <span className="comms-live-badge">Live</span>}
          </button>

          {showPeople && (
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
                    <span className="comms-voice-person-muted">Muted</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </li>
      </ul>
    </aside>
  );
}

export default CommsSidebar;