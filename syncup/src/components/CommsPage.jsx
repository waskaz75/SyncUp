import { useState } from "react";

import ChatChannel from "./ChatChannel";
import CommsSidebar from "./CommsSidebar";
import VoiceChannel from "./VoiceChannel";

const NO_VOICE = { isJoined: false, people: [], screenActive: false };

function CommsPage() {
  const [channel, setChannel] = useState("chat");
  const [voice, setVoice] = useState(NO_VOICE);

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
            onSelect={setChannel}
          />

          <div className="comms-main">
            <div className="comms-view-wrap" hidden={channel !== "chat"}>
              <ChatChannel isActive={channel === "chat"} />
            </div>

            <div className="comms-view-wrap" hidden={channel !== "voice"}>
              <VoiceChannel onVoiceChange={setVoice} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CommsPage;