import { useEffect, useRef } from "react";

function PencilIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function ChecklistItem({
  item,
  isConfirmingDelete,
  onToggle,
  onEdit,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}) {
  const trashRef = useRef(null);
  const noRef = useRef(null);
  const wasConfirmingRef = useRef(false);

  // Keep keyboard focus sensible when the buttons swap places.
  useEffect(() => {
    if (isConfirmingDelete) {
      noRef.current?.focus();
    } else if (wasConfirmingRef.current) {
      trashRef.current?.focus();
    }

    wasConfirmingRef.current = isConfirmingDelete;
  }, [isConfirmingDelete]);

  const checkboxId = `checklist-item-${item.id}`;

  return (
    <li className={`checklist-item ${item.completed ? "completed" : ""}`}>
      <input
        id={checkboxId}
        className="checklist-checkbox"
        type="checkbox"
        checked={item.completed}
        onChange={() => onToggle(item)}
      />

      <label htmlFor={checkboxId} className="checklist-item-text">
        {item.text}
      </label>

      {isConfirmingDelete ? (
        <div
          className="checklist-confirm"
          role="group"
          aria-label={`Confirm delete: ${item.text}`}
        >
          <span>Delete?</span>

          <button
            type="button"
            className="checklist-confirm-button"
            onClick={() => onConfirmDelete(item)}
          >
            Yes
          </button>

          <button
            ref={noRef}
            type="button"
            className="checklist-confirm-button"
            onClick={onCancelDelete}
          >
            No
          </button>
        </div>
      ) : (
        <div className="checklist-item-actions">
          <button
            type="button"
            className="checklist-icon-button"
            onClick={() => onEdit(item)}
            aria-label={`Edit item: ${item.text}`}
          >
            <PencilIcon />
          </button>

          <button
            ref={trashRef}
            type="button"
            className="checklist-icon-button"
            onClick={() => onRequestDelete(item)}
            aria-label={`Delete item: ${item.text}`}
          >
            <TrashIcon />
          </button>
        </div>
      )}
    </li>
  );
}

export default ChecklistItem;