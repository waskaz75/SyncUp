import { useState } from "react";

import ChatbotPanel from "./ChatbotPanel";
import StudyBuddyPanel from "./StudyBuddyPanel";

const AI_TOOLS = {
  background: "background",
  studyBuddy: "studyBuddy",
};

function AIToolsSidebar({ onSetBackground }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTool, setActiveTool] = useState(AI_TOOLS.background);

  function toggleTool(tool) {
    setActiveTool(tool);
    setIsOpen(true);
  }

  function closeSidebar() {
    setIsOpen(false);
  }

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          className="floating-button chat-toggle"
          onClick={() => setIsOpen(true)}
          aria-label="Open AI tools"
        >
          Chat
        </button>
      )}

      <aside
        className={`ai-tools-sidebar ${isOpen ? "open" : ""}`}
        aria-label="AI tools"
      >
        <div className="ai-tools-tabs" role="tablist" aria-label="AI tools">
          <button
            type="button"
            role="tab"
            aria-selected={activeTool === AI_TOOLS.background}
            className={`ai-tools-tab ${
              activeTool === AI_TOOLS.background ? "active" : ""
            }`}
            onClick={() => toggleTool(AI_TOOLS.background)}
          >
            <span aria-hidden="true">✦</span>
            <span>Background AI</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTool === AI_TOOLS.studyBuddy}
            className={`ai-tools-tab ${
              activeTool === AI_TOOLS.studyBuddy ? "active" : ""
            }`}
            onClick={() => toggleTool(AI_TOOLS.studyBuddy)}
          >
            <span aria-hidden="true">☼</span>
            <span>Study Buddy AI</span>
          </button>
        </div>

        <div className="ai-tools-panel">
          {activeTool === AI_TOOLS.background && (
            <ChatbotPanel
              onClose={closeSidebar}
              onSetBackground={onSetBackground}
            />
          )}

          {activeTool === AI_TOOLS.studyBuddy && (
            <StudyBuddyPanel onClose={closeSidebar} />
          )}
        </div>
      </aside>
    </>
  );
}

export default AIToolsSidebar;
