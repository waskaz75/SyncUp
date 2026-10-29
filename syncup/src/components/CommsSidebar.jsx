import CommsAvatar from "./commsAvatar";

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

function CommsSidebar({ activeChannel, voice, onSelect }) {
  const showPeople = voice.isJoined && voice.screenActive;

  return (
    <aside className="comms-sidebar" aria-labelledby="comms-sidebar-title">
      <h2 id="comms-sidebar-title">Channels</h2>

      <ul className="comms-sidebar-list">
        <li>
          <button
            type="button"
            className={`comms-channel-button ${
              activeChannel === "chat" ? "active" : ""
            }`}
            aria-current={activeChannel === "chat" ? "true" : undefined}
            onClick={() => onSelect("chat")}
          >
            <span className="comms-channel-icon" aria-hidden="true">
              #
            </span>
            <span>Text chat</span>
          </button>
        </li>

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