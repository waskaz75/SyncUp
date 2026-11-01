import { useRef, useState } from "react";

import AccomplishmentReport from "./AccomplishmentReport";
import MoodBoard from "./MoodBoard";

const TABS = [
  { id: "mood", label: "Mood Board" },
  { id: "report", label: "Accomplishment Report" },
];

function MePage() {
  const [activeTab, setActiveTab] = useState("mood");
  const tabRefs = useRef({});

  function handleKeyDown(event, index) {
    let nextIndex = null;

    if (event.key === "ArrowRight") {
      nextIndex = (index + 1) % TABS.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + TABS.length) % TABS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = TABS.length - 1;
    }

    if (nextIndex === null) {
      return;
    }

    event.preventDefault();

    const nextTab = TABS[nextIndex];

    setActiveTab(nextTab.id);
    tabRefs.current[nextTab.id]?.focus();
  }

  return (
    <section className="me-page" aria-labelledby="me-heading">
      <h1 id="me-heading" className="visually-hidden">
        Me
      </h1>

      <div className="me-folder">
        <div className="me-tabs" role="tablist" aria-label="Me sections">
          {TABS.map((tab, index) => (
            <button
              key={tab.id}
              ref={(element) => {
                tabRefs.current[tab.id] = element;
              }}
              id={`me-tab-${tab.id}`}
              type="button"
              role="tab"
              className="me-tab"
              aria-selected={activeTab === tab.id}
              aria-controls="me-panel"
              tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div
          id="me-panel"
          className="me-content"
          role="tabpanel"
          aria-labelledby={`me-tab-${activeTab}`}
        >
          {activeTab === "mood" ? <MoodBoard /> : <AccomplishmentReport />}
        </div>
      </div>
    </section>
  );
}

export default MePage;