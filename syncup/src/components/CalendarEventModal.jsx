import { useEffect, useRef, useState } from "react";
import ModalShell from "./ModalShell";
import { DEFAULT_TAG, EVENT_TAGS } from "./calendarUtils";

const REQUIRED_MESSAGE = "Please fill in all required fields and try again.";

function CalendarEventModal({
  event = null,
  initialDate = "",
  events,
  onSubmit,
  onClose,
}) {
  const titleRef = useRef(null);
  const dateRef = useRef(null);
  const timeRef = useRef(null);
  const endTimeRef = useRef(null);
  const changeTimeRef = useRef(null);

  const isEdit = Boolean(event);

  const [values, setValues] = useState({
    title: event?.title ?? "",
    date: event?.date ?? initialDate,
    time: event?.time ?? "",
    endTime: event?.endTime ?? "",
    tag: event?.tag ?? DEFAULT_TAG,
  });

  const [invalid, setInvalid] = useState({});
  const [formError, setFormError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [conflict, setConflict] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (conflict) {
      changeTimeRef.current?.focus();
    }
  }, [conflict]);

  function handleClose() {
    if (!isSaving) {
      onClose();
    }
  }

  function updateField(changeEvent) {
    const { name, value } = changeEvent.target;

    setValues((current) => ({ ...current, [name]: value }));
    setInvalid((current) => ({ ...current, [name]: false }));
    setFormError("");
    setSubmitError("");
    setConflict(null);
  }

  async function save() {
    setSubmitError("");
    setIsSaving(true);

    const succeeded = await onSubmit({
      title: values.title.trim(),
      date: values.date,
      time: values.time,
      endTime: values.endTime,
      tag: values.tag,
    });

    // On success the page closes this popup,
    // so we only handle failure.
    if (!succeeded) {
      setSubmitError(
        "Could not save. Your details are still here, so you can try again."
      );
      setIsSaving(false);
    }
  }

  async function handleSubmit(submitEvent) {
    submitEvent.preventDefault();

    if (isSaving || conflict) {
      return;
    }

    const missing = {
      title: !values.title.trim(),
      date: !values.date,
      time: !values.time,
      endTime: !values.endTime,
    };

    if (
      missing.title ||
      missing.date ||
      missing.time ||
      missing.endTime
    ) {
      setInvalid(missing);
      setFormError(REQUIRED_MESSAGE);

      const firstMissing = [
        ["title", titleRef],
        ["date", dateRef],
        ["time", timeRef],
        ["endTime", endTimeRef],
      ].find(([name]) => missing[name]);

      firstMissing?.[1].current?.focus();
      return;
    }

    // Events currently start and end on the same day.
    if (values.endTime <= values.time) {
      setInvalid((current) => ({
        ...current,
        endTime: true,
      }));

      setFormError("End time must be later than start time.");
      endTimeRef.current?.focus();
      return;
    }

    // When editing, an event must not conflict with itself.
    const existing = events.find(
      (item) =>
        item.id !== event?.id &&
        item.date === values.date &&
        item.time === values.time
    );

    if (existing) {
      setConflict(existing);
      return;
    }

    await save();
  }

  function handleChangeTime() {
    setConflict(null);
    timeRef.current?.focus();
  }

  function handleAddAnyway() {
    if (!isSaving) {
      save();
    }
  }

  const heading = isEdit ? "Edit event" : "Create event";
  const submitLabel = isEdit ? "Save" : "Create";
  const conflictLabel = isEdit ? "Save anyway" : "Add anyway";

  return (
    <ModalShell labelledBy="calendar-create-title" onClose={handleClose}>
      <h2 id="calendar-create-title">{heading}</h2>

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="calendar-event-title">Title</label>

        <input
          ref={titleRef}
          id="calendar-event-title"
          name="title"
          type="text"
          value={values.title}
          maxLength={100}
          autoComplete="off"
          readOnly={isSaving}
          aria-required="true"
          aria-invalid={Boolean(invalid.title)}
          onChange={updateField}
        />

        <label htmlFor="calendar-event-date">Date</label>

        <input
          ref={dateRef}
          id="calendar-event-date"
          name="date"
          type="date"
          value={values.date}
          readOnly={isSaving}
          aria-required="true"
          aria-invalid={Boolean(invalid.date)}
          onChange={updateField}
        />

        <label htmlFor="calendar-event-time">Start time</label>

        <input
          ref={timeRef}
          id="calendar-event-time"
          name="time"
          type="time"
          value={values.time}
          readOnly={isSaving}
          aria-required="true"
          aria-invalid={Boolean(invalid.time)}
          onChange={updateField}
        />

        <label htmlFor="calendar-event-end-time">End time</label>

        <input
          ref={endTimeRef}
          id="calendar-event-end-time"
          name="endTime"
          type="time"
          value={values.endTime}
          readOnly={isSaving}
          aria-required="true"
          aria-invalid={Boolean(invalid.endTime)}
          onChange={updateField}
        />
        
        <label htmlFor="calendar-event-tag">Tag</label>

        <select
          id="calendar-event-tag"
          name="tag"
          value={values.tag}
          disabled={isSaving}
          onChange={updateField}
        >
          {EVENT_TAGS.map((tag) => (
            <option key={tag.value} value={tag.value}>
              {tag.label}
            </option>
          ))}
        </select>

        {formError && (
          <p className="checklist-field-error" role="alert">
            {formError}
          </p>
        )}

        {submitError && (
          <p className="checklist-field-error" role="alert">
            {submitError}
          </p>
        )}

        {conflict && (
          <div className="calendar-conflict" role="alert">
            <p>{`You already have '${conflict.title}' at this time.`}</p>

            <div className="calendar-conflict-actions">
              <button
                type="button"
                className="checklist-button"
                onClick={handleAddAnyway}
                disabled={isSaving}
              >
                {isSaving ? "Saving…" : conflictLabel}
              </button>

              <button
                ref={changeTimeRef}
                type="button"
                className="checklist-button checklist-button-secondary"
                onClick={handleChangeTime}
                disabled={isSaving}
              >
                Change time
              </button>
            </div>
          </div>
        )}

        <div className="checklist-modal-actions">
          <button
            type="button"
            className="checklist-button checklist-button-secondary"
            onClick={handleClose}
            disabled={isSaving}
          >
            Cancel
          </button>

          {!conflict && (
            <button
              type="submit"
              className="checklist-button"
              disabled={isSaving}
            >
              {isSaving ? "Saving…" : submitLabel}
            </button>
          )}
        </div>
      </form>
    </ModalShell>
  );
}

export default CalendarEventModal;
