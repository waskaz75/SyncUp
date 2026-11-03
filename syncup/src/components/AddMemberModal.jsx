import { useEffect, useRef, useState } from "react";

import ModalShell from "./ModalShell";

const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;

// onSubmit(username) returns { ok: true } when saved (the page closes this
// popup) or { ok: false, message } when it failed (the popup stays open).
function AddMemberModal({ groupName, onSubmit, onClose }) {
  const inputRef = useRef(null);

  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleClose() {
    if (!isSaving) {
      onClose();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    const trimmed = username.trim();

    if (!trimmed) {
      setError("Please enter a username.");
      inputRef.current?.focus();
      return;
    }

    if (!USERNAME_PATTERN.test(trimmed)) {
      setError("Enter a valid username (3–20 letters, numbers, or underscores).");
      inputRef.current?.focus();
      return;
    }

    setError("");
    setIsSaving(true);

    const result = await onSubmit(trimmed);

    // On success the page closes this popup, so we only handle failure.
    if (!result.ok) {
      setError(result.message);
      setIsSaving(false);
      inputRef.current?.focus();
    }
  }

  return (
    <ModalShell labelledBy="add-member-title" onClose={handleClose}>
      <h2 id="add-member-title">Add member</h2>

      {groupName && <p className="me-modal-date">{`To ${groupName}`}</p>}

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="add-member-username">Username</label>

        <input
          ref={inputRef}
          id="add-member-username"
          value={username}
          maxLength={20}
          readOnly={isSaving}
          placeholder="username"
          aria-required="true"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "add-member-error" : undefined}
          onChange={(event) => {
            setUsername(event.target.value);
            setError("");
          }}
        />

        {error && (
          <p
            id="add-member-error"
            className="checklist-field-error"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="checklist-modal-actions">
          <button
            type="button"
            className="checklist-button checklist-button-secondary"
            onClick={handleClose}
            aria-disabled={isSaving}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="checklist-button"
            aria-disabled={isSaving}
          >
            {isSaving ? "Adding…" : "Add member"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export default AddMemberModal;