import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE_SELECTOR =
  "button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])";

function ChecklistModal({ mode, initialText = "", onSubmit, onClose }) {
  const dialogRef = useRef(null);
  const inputRef = useRef(null);

  const [text, setText] = useState(initialText);
  const [validationError, setValidationError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isEdit = mode === "edit";
  const title = isEdit ? "Edit item" : "Add item";
  const submitLabel = isEdit ? "Save" : "Create";

  // On open: remember who had focus, then focus the input.
  // On close: give focus back to that element.
  useEffect(() => {
    const trigger = document.activeElement;

    inputRef.current?.focus();

    return () => {
      if (trigger instanceof HTMLElement) {
        trigger.focus();
      }
    };
  }, []);

  function handleClose() {
    if (!isSaving) {
      onClose();
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      handleClose();
      return;
    }

    // Focus trap: Tab wraps around inside the dialog.
    if (event.key !== "Tab") {
      return;
    }

    const focusable = dialogRef.current?.querySelectorAll(FOCUSABLE_SELECTOR);

    if (!focusable || focusable.length === 0) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    const trimmed = text.trim();

    if (!trimmed) {
      setSubmitError("");
      setValidationError("Please enter some text for this item.");
      inputRef.current?.focus();
      return;
    }

    setValidationError("");
    setSubmitError("");
    setIsSaving(true);

    const succeeded = await onSubmit(trimmed);

    // On success the page closes this modal, so we only handle failure.
    if (!succeeded) {
      setSubmitError(
        "Could not save. Your text is still here, so you can try again."
      );
      setIsSaving(false);
    }
  }

  return createPortal(
    <div className="checklist-modal-backdrop">
      <div
        ref={dialogRef}
        className="checklist-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="checklist-modal-title"
        onKeyDown={handleKeyDown}
      >
        <h2 id="checklist-modal-title">{title}</h2>

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="checklist-modal-input">Item</label>

          <input
            ref={inputRef}
            id="checklist-modal-input"
            type="text"
            value={text}
            maxLength={200}
            autoComplete="off"
            readOnly={isSaving}
            aria-required="true"
            aria-invalid={Boolean(validationError)}
            aria-describedby={
              validationError ? "checklist-modal-error" : undefined
            }
            onChange={(event) => {
              setText(event.target.value);
              setValidationError("");
            }}
          />

          {validationError && (
            <p
              id="checklist-modal-error"
              className="checklist-field-error"
              role="alert"
            >
              {validationError}
            </p>
          )}

          {submitError && (
            <p className="checklist-field-error" role="alert">
              {submitError}
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
              {isSaving ? "Saving…" : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default ChecklistModal;