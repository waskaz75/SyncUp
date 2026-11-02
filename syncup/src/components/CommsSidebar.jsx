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
  onConversationUpdated,
}) {
  const showPeople = voice.isJoined && voice.screenActive;
  const username = useUser();
  const [composer, setComposer] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [groupEmails, setGroupEmails] = useState([]);
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
    setEmail("");
    setGroupEmails([]);
  }

  function addGroupEmail() {
    const nextEmail = email.trim().toLowerCase();

    if (!nextEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    if (groupEmails.includes(nextEmail)) {
      setError("That email has already been added.");
      return;
    }

    setGroupEmails((current) => [...current, nextEmail]);
    setEmail("");
    setError("");
  }

  async function handleCreate(event) {
    event.preventDefault();

    if (composer === "group" && groupEmails.length === 0) {
      setError("Add at least one member email before creating the group.");
      return;
    }

    try {
      const conversation =
        composer === "group"
          ? await createGroup(name, groupEmails)
          : await createDirectMessage(email.trim());
      onConversationCreated(conversation);
      setComposer(null);
    } catch (createError) {
      console.error("Creating conversation failed:", createError);
      setError(createError.message || "Could not create that conversation.");
    }
  }

  async function handleAddMember(event) {
    event.preventDefault();
    try {
      const conversation = await addConversationMember(
        memberConversationId,
        memberEmail.trim()
      );
      onConversationUpdated(conversation);
      setMemberConversationId(null);
      setMemberEmail("");
      setError("");
    } catch (addError) {
      console.error("Adding conversation member failed:", addError);
      setError(addError.message || "Could not add that member.");
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
                  <label htmlFor="group-member-email">
                    Add a member by email
                  </label>
                  <input
                    id="group-member-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="person@example.com"
                    aria-label="Group member email address"
                    autoComplete="email"
                  />
                  <button type="button" onClick={addGroupEmail}>
                    Add email
                  </button>
                  {groupEmails.length > 0 && (
                    <ul aria-label="Added group members">
                      {groupEmails.map((memberEmail) => (
                        <li key={memberEmail}>{memberEmail}</li>
                      ))}
                    </ul>
                  )}
                  <p>Enter another email to add another person.</p>
                </>
              ) : (
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="person@example.com"
                  aria-label="Person's email address"
                  autoComplete="email"
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