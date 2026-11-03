
import { useEffect, useState } from "react";

import ChatChannel from "./ChatChannel";
import CommsSidebar from "./CommsSidebar";
import VoiceChannel from "./VoiceChannel";
import AddMemberModal from "./AddMemberModal";
import { addConversationMember, getConversations } from "./commsApi";

const NO_VOICE = {
  isJoined: false,
  conversationId: null,
  people: [],
  screenActive: false,
};

function CommsPage() {
  const [channel, setChannel] = useState("chat");
  const [voice, setVoice] = useState(NO_VOICE);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [callConversationId, setCallConversationId] = useState(null);
  const [isCallVisible, setIsCallVisible] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  useEffect(() => {
    getConversations()
      .then((loaded) => {
        setConversations(loaded);
        setActiveConversationId(
          (current) => current || loaded[0]?.id || null
        );
      })
      .catch((error) =>
        console.error("Loading conversations failed:", error)
      );
  }, []);

  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId
  );

  const callConversation = conversations.find(
    (conversation) => conversation.id === callConversationId
  );

  function selectChannel(
    nextChannel,
    conversationId = activeConversationId
  ) {
    if (conversationId) {
      setActiveConversationId(conversationId);
    }

    if (nextChannel === "voice") {
      openVoiceCall(conversationId);
      return;
    }

    setChannel("chat");
    setIsCallVisible(false);
  }

  function openVoiceCall(conversationId = activeConversationId) {
    if (!conversationId) {
      return;
    }

    // A connected call belongs to its original conversation.
    // Switching text conversations must not change that call.
    if (voice.isJoined && voice.conversationId) {
      setCallConversationId(voice.conversationId);
    } else {
      setCallConversationId(conversationId);
    }

    setChannel("chat");
    setIsCallVisible(true);
  }

  function closeVoicePanel() {
    // Hide the call interface without disconnecting.
    setIsCallVisible(false);
  }

  function addConversation(conversation) {
    setConversations((current) => [
      ...current.filter((item) => item.id !== conversation.id),
      conversation,
    ]);

    setActiveConversationId(conversation.id);
    setChannel("chat");
    setIsCallVisible(false);
  }

  function updateConversation(conversation) {
    setConversations((current) =>
      current.map((item) =>
        item.id === conversation.id ? conversation : item
      )
    );
  }

  async function handleAddMember(username) {
    try {
      const updated = await addConversationMember(
        activeConversationId,
        username
      );

      updateConversation(updated);
      setIsAddMemberOpen(false);

      return { ok: true };
    } catch (addError) {
      console.error(
        "Adding conversation member failed:",
        addError
      );

      return {
        ok: false,
        message:
          addError.message || "Could not add that member.",
      };
    }
  }

  return (
    <section
      className="comms-page"
      aria-labelledby="comms-heading"
    >
      <div className="comms-panel">
        <h1
          id="comms-heading"
          className="visually-hidden"
        >
          Comms Channel
        </h1>

        <div className="comms-layout">
          <CommsSidebar
            activeChannel={channel}
            voice={voice}
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelect={selectChannel}
            onConversationCreated={addConversation}
          />

          <div className="comms-main">
            <div
              className="comms-view-wrap"
              hidden={isCallVisible}
            >
              <ChatChannel
                key={
                  activeConversationId || "no-conversation"
                }
                isActive={!isCallVisible}
                conversation={activeConversation}
                onAddMember={() =>
                  setIsAddMemberOpen(true)
                }
                onStartCall={() =>
                  openVoiceCall(activeConversationId)
                }
                isInCall={
                  voice.isJoined &&
                  voice.conversationId ===
                    activeConversationId
                }
              />
            </div>

            <div
              className="comms-view-wrap"
              hidden={!isCallVisible}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  padding: "12px 16px",
                  borderBottom:
                    "1px solid var(--border-color, #ddd)",
                }}
              >
                <div>
                  <strong>
                    {callConversation?.name ||
                      "Conversation voice call"}
                  </strong>
                </div>

                <button
                  type="button"
                  className="checklist-button checklist-button-secondary"
                  onClick={closeVoicePanel}
                >
                  Back to messages
                </button>
              </div>
            </div>

            {/*
              Keep VoiceChannel mounted while switching between
              messages and voice. Unmounting it would disconnect
              the call.
            */}
            <div
              className="comms-view-wrap"
              hidden={!isCallVisible}
            >
              <VoiceChannel
                conversationId={callConversationId}
                onVoiceChange={setVoice}
              />
            </div>

            {voice.isJoined && !isCallVisible && (
              <div
                className="comms-controls"
                role="status"
              >
                <span>
                  Voice call active
                  {callConversation?.name
                    ? ` — ${callConversation.name}`
                    : ""}
                </span>

                <button
                  type="button"
                  className="checklist-button checklist-button-secondary"
                  onClick={() =>
                    openVoiceCall(
                      voice.conversationId ||
                        callConversationId
                    )
                  }
                >
                  Return to call
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isAddMemberOpen &&
        activeConversation?.type === "GROUP" && (
          <AddMemberModal
            groupName={activeConversation.name}
            onSubmit={handleAddMember}
            onClose={() =>
              setIsAddMemberOpen(false)
            }
          />
        )}
    </section>
  );
}

export default CommsPage;
