import { useEffect, useRef, useState } from "react";

import ModalShell from "./ModalShell";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// onSubmit(email) returns { ok: true } when saved (the page closes this
// popup) or { ok: false, message } when it failed (the popup stays open).
function AddMemberModal({ groupName, onSubmit, onClose }) {
  const inputRef = useRef(null);

  const [email, setEmail] = useState("");
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

    const trimmed = email.trim().toLowerCase();

    if (!trimmed) {
      setError("Please enter an email address.");
      inputRef.current?.focus();
      return;
    }

    if (!EMAIL_PATTERN.test(trimmed)) {
      setError("Enter a valid email address.");
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
        <label htmlFor="add-member-email">Email address</label>

        <input
          ref={inputRef}
          id="add-member-email"
          type="email"
          value={email}
          maxLength={254}
          autoComplete="email"
          readOnly={isSaving}
          placeholder="person@example.com"
          aria-required="true"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "add-member-error" : undefined}
          onChange={(event) => {
            setEmail(event.target.value);
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