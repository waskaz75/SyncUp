import { useEffect, useRef, useState } from "react";

import ModalShell from "./ModalShell";
import MoodFace from "./moodFace";
import { formatFullDate } from "./calendarUtils";
import { MOODS } from "./meUtils";

function MoodModal({ dateKey, currentMood, onPick, onClear, onClose }) {
  const optionsRef = useRef(null);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const target =
      optionsRef.current?.querySelector('[aria-pressed="true"]') ||
      optionsRef.current?.querySelector("button");

    target?.focus();
  }, []);

  function handleClose() {
    if (!isSaving) {
      onClose();
    }
  }

  async function run(action) {
    if (isSaving) {
      return;
    }

    setError("");
    setIsSaving(true);

    const succeeded = await action();

    if (!succeeded) {
      setError("Could not save your mood. Please try again.");
      setIsSaving(false);
    }
  }

  return (
    <ModalShell labelledBy="mood-modal-title" onClose={handleClose}>
      <h2 id="mood-modal-title">How did you feel?</h2>
      <p className="me-modal-date">{formatFullDate(dateKey)}</p>

      <div
        ref={optionsRef}
        className="me-mood-options"
        role="group"
        aria-label="Pick a mood"
      >
        {MOODS.map((mood) => (
          <button
            key={mood.value}
            type="button"
            className="me-mood-option"
            aria-pressed={currentMood === mood.value}
            aria-disabled={isSaving}
            onClick={() => run(() => onPick(mood.value))}
          >
            <MoodFace mood={mood.value} />
            <span>{mood.label}</span>
          </button>
        ))}
      </div>

      {error && (
        <p className="checklist-field-error" role="alert">
          {error}
        </p>
      )}

      <div className="checklist-modal-actions">
        {currentMood && (
          <button
            type="button"
            className="checklist-button checklist-button-secondary"
            aria-disabled={isSaving}
            onClick={() => run(onClear)}
          >
            Remove mood
          </button>
        )}

        <button
          type="button"
          className="checklist-button checklist-button-secondary"
          aria-disabled={isSaving}
          onClick={handleClose}
        >
          Cancel
        </button>
      </div>
    </ModalShell>
  );
}

export default MoodModal;