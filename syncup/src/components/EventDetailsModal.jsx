import { useEffect, useMemo, useRef, useState } from "react";

import ModalShell from "./ModalShell";
import { formatFullDate, formatTime12, getTagInfo, sortEvents } from "./calendarUtils";

function EventDetailsModal({
  dateKey,
  eventId = null,
  events,
  onClose,
  onDelete,
  onEdit,
  onAddEvent,
}) {
  const titleRef = useRef(null);
  const deleteRef = useRef(null);
  const noRef = useRef(null);
  const wasConfirmingRef = useRef(false);

  const [selectedId, setSelectedId] = useState(eventId);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const startedFromList = eventId === null;

  const dayEvents = useMemo(
    () => sortEvents(events.filter((event) => event.date === dateKey)),
    [events, dateKey]
  );

  const selected = dayEvents.find((event) => event.id === selectedId) || null;

  useEffect(() => {
    titleRef.current?.focus();
  }, [selectedId]);

  useEffect(() => {
    if (isConfirming) {
      noRef.current?.focus();
    } else if (wasConfirmingRef.current) {
      deleteRef.current?.focus();
    }

    wasConfirmingRef.current = isConfirming;
  }, [isConfirming]);

  function handleClose() {
    if (!isDeleting) {
      onClose();
    }
  }

  async function handleConfirmDelete() {
    if (isDeleting || !selected) {
      return;
    }

    setIsDeleting(true);

    await onDelete(selected);
  }

  function showEvent(id) {
    setIsConfirming(false);
    setSelectedId(id);
  }


  if (selected) {
    return (
      <ModalShell labelledBy="calendar-details-title" onClose={handleClose}>
        <h2 id="calendar-details-title" ref={titleRef} tabIndex={-1}>
          {selected.title}
        </h2>

        <dl className="calendar-details-list">
          <div>
            <dt>Date</dt>
            <dd>{formatFullDate(selected.date)}</dd>
          </div>

          <div>
            <dt>Time</dt>
            <dd>{formatTime12(selected.time)}</dd>
          </div>

          <div>
            <dt>Tag</dt>
            <dd>
              <span
                className={`calendar-tag-chip tag-${getTagInfo(selected.tag).value}`}
              >
                {getTagInfo(selected.tag).label}
              </span>
            </dd>
          </div>
        </dl>

        {isConfirming ? (
          <div
            className="calendar-confirm"
            role="group"
            aria-label="Confirm delete"
          >
            <span>Delete this event?</span>

            <button
              type="button"
              className="checklist-confirm-button"
              onClick={handleConfirmDelete}
              aria-disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Yes"}
            </button>

            <button
              ref={noRef}
              type="button"
              className="checklist-confirm-button"
              onClick={() => setIsConfirming(false)}
              aria-disabled={isDeleting}
            >
              No
            </button>
          </div>
        ) : (
            <div className="checklist-modal-actions">
                {startedFromList && (
                <button
                    type="button"
                    className="checklist-button checklist-button-secondary"
                    onClick={() => showEvent(null)}
                >
                    Back to day
                </button>
                )}

                <button
                ref={deleteRef}
                type="button"
                className="checklist-button checklist-button-secondary"
                onClick={() => setIsConfirming(true)}
                >
                Delete
                </button>

                <button
                type="button"
                className="checklist-button checklist-button-secondary"
                onClick={() => onEdit(selected)}
                >
                Edit
                </button>

                <button
                type="button"
                className="checklist-button"
                onClick={handleClose}
                >
                Close
                </button>
            </div>
        )}
      </ModalShell>
    );
  }

  return (
    <ModalShell labelledBy="calendar-details-title" onClose={handleClose}>
      <h2 id="calendar-details-title" ref={titleRef} tabIndex={-1}>
        {formatFullDate(dateKey)}
      </h2>

      {dayEvents.length === 0 ? (
        <p>No events on this day.</p>
      ) : (
        <ul className="calendar-day-list">
          {dayEvents.map((event) => (
            <li key={event.id}>
              <button
                type="button"
                className="calendar-day-list-button"
                onClick={() => showEvent(event.id)}
              >
                <span
                  className={`calendar-tag-dot tag-${getTagInfo(event.tag).value}`}
                  aria-hidden="true"
                />
                <strong>{formatTime12(event.time)}</strong>
                <span>{event.title}</span>
                <span className="calendar-day-list-tag">
                  {getTagInfo(event.tag).label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="checklist-modal-actions">
        <button
          type="button"
          className="checklist-button checklist-button-secondary"
          onClick={() => onAddEvent(dateKey)}
        >
          + Add event
        </button>

        <button
          type="button"
          className="checklist-button"
          onClick={handleClose}
        >
          Close
        </button>
      </div>
    </ModalShell>
  );
}

export default EventDetailsModal;