import { useEffect, useRef, useState } from "react";

import ModalShell from "./ModalShell";

function StorageFolderModal({ folders, onSubmit, onClose }) {
  const inputRef = useRef(null);

  const [name, setName] = useState("");
  const [validationError, setValidationError] = useState("");
  const [submitError, setSubmitError] = useState("");
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

    const trimmed = name.trim();

    if (!trimmed) {
      setSubmitError("");
      setValidationError("Please enter a folder name.");
      inputRef.current?.focus();
      return;
    }

    const alreadyExists = folders.some(
      (folder) => folder.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (alreadyExists) {
      setSubmitError("");
      setValidationError(`A folder named "${trimmed}" already exists.`);
      inputRef.current?.focus();
      return;
    }

    setValidationError("");
    setSubmitError("");
    setIsSaving(true);

    const succeeded = await onSubmit(trimmed);

    if (!succeeded) {
      setSubmitError(
        "Could not create the folder. Your text is still here, so you can try again."
      );
      setIsSaving(false);
    }
  }

  return (
    <ModalShell labelledBy="storage-folder-modal-title" onClose={handleClose}>
      <h2 id="storage-folder-modal-title">New folder</h2>

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="storage-folder-name">Folder name</label>

        <input
          ref={inputRef}
          id="storage-folder-name"
          type="text"
          value={name}
          maxLength={60}
          autoComplete="off"
          readOnly={isSaving}
          aria-required="true"
          aria-invalid={Boolean(validationError)}
          aria-describedby={
            validationError ? "storage-folder-error" : undefined
          }
          onChange={(event) => {
            setName(event.target.value);
            setValidationError("");
          }}
        />

        {validationError && (
          <p
            id="storage-folder-error"
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
            {isSaving ? "Creating…" : "Create"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export default StorageFolderModal;