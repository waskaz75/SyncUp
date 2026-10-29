import { useState } from "react";

import ChatbotPanel from "./ChatbotPanel";

function AIToolsSidebar({ onSetBackground }) {
  const [isOpen, setIsOpen] = useState(false);

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
            className="ai-tools-tab active"
            onClick={() => setIsOpen(true)}
          >
            <span aria-hidden="true">✦</span>
            <span>Background AI</span>
          </button>
        </div>

        <div className="ai-tools-panel">
          <ChatbotPanel
            onClose={closeSidebar}
            onSetBackground={onSetBackground}
          />
        </div>
      </aside>
    </>
  );
}

export default AIToolsSidebar;
