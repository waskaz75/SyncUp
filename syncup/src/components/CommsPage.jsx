import { useEffect, useState } from "react";

import ChatChannel from "./ChatChannel";
import CommsSidebar from "./CommsSidebar";
import VoiceChannel from "./VoiceChannel";
import AddMemberModal from "./AddMemberModal";
import { addConversationMember, getConversations } from "./commsApi";

const NO_VOICE = { isJoined: false, people: [], screenActive: false };

function CommsPage() {
  const [channel, setChannel] = useState("chat");
  const [voice, setVoice] = useState(NO_VOICE);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  useEffect(() => {
    getConversations()
      .then((loaded) => {
        setConversations(loaded);
        setActiveConversationId((current) => current || loaded[0]?.id || null);
      })
      .catch((error) => console.error("Loading conversations failed:", error));
  }, []);

  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId
  );

  function selectChannel(nextChannel, conversationId = activeConversationId) {
    setChannel(nextChannel);
    if (conversationId) {
      setActiveConversationId(conversationId);
    }
  }

  function addConversation(conversation) {
    setConversations((current) => [
      ...current.filter((item) => item.id !== conversation.id),
      conversation,
    ]);
    setActiveConversationId(conversation.id);
    setChannel("chat");
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
      console.error("Adding conversation member failed:", addError);

      return {
        ok: false,
        message: addError.message || "Could not add that member.",
      };
    }
  }

  return (
    <section className="comms-page" aria-labelledby="comms-heading">
      <div className="comms-panel">
        <h1 id="comms-heading" className="visually-hidden">
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
            <div className="comms-view-wrap" hidden={channel !== "chat"}>
              <ChatChannel
                key={activeConversationId || "no-conversation"}
                isActive={channel === "chat"}
                conversation={activeConversation}
                onAddMember={() => setIsAddMemberOpen(true)}
              />
            </div>

            <div className="comms-view-wrap" hidden={channel !== "voice"}>
              <VoiceChannel onVoiceChange={setVoice} />
            </div>
          </div>
        </div>
      </div>

      {isAddMemberOpen && activeConversation?.type === "GROUP" && (
        <AddMemberModal
          groupName={activeConversation.name}
          onSubmit={handleAddMember}
          onClose={() => setIsAddMemberOpen(false)}
        />
      )}
    </section>
  );
}

export default CommsPage;