import { useCallback, useEffect, useMemo, useState } from "react";

import CalendarEventModal from "./CalendarEventModal";
import CalendarGrid from "./CalendarGrid";
import EventDetailsModal from "./EventDetailsModal";
import {
  NOT_FOUND_CODE,
  createEvent,
  deleteEvent,
  getEvents,
  updateEvent,
} from "./calendarApi";
import {
  formatMonthTitle,
  getToday,
  groupEventsByDate,
  parseDateKey,
} from "./calendarUtils";

const COMPACT_QUERY = "(max-width: 599px)";

function useIsCompact() {
  const [isCompact, setIsCompact] = useState(
    () => window.matchMedia(COMPACT_QUERY).matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(COMPACT_QUERY);

    function handleChange(event) {
      setIsCompact(event.matches);
    }

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return isCompact;
}

function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [today, setToday] = useState(() => getToday());
  const [view, setView] = useState(() => {
    const now = getToday();

    return { year: now.year, month: now.month };
  });

  const [eventModal, setEventModal] = useState(null);
  const [details, setDetails] = useState(null);

  const isCompact = useIsCompact();
  const eventsByDate = useMemo(() => groupEventsByDate(events), [events]);

  const loadEvents = useCallback(async () => {
    try {
      setEvents(await getEvents());
    } catch (loadError) {
      console.error("Loading calendar failed:", loadError);
      setError("Could not load your calendar.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);


  function changeMonth(offset) {
    setView((current) => {
      const next = new Date(current.year, current.month + offset, 1);

      return { year: next.getFullYear(), month: next.getMonth() };
    });
  }

  function goToToday() {
    const now = getToday();

    setToday(now);
    setView({ year: now.year, month: now.month });
  }

  async function handleSaveEvent(values) {
    const editing = eventModal?.event ?? null;

    setError("");

    try {
      const saved = editing
        ? await updateEvent(editing.id, values)
        : await createEvent(values);

      const { year, month } = parseDateKey(saved.date);

      setEvents((current) =>
        editing
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [...current, saved]
      );
      setView({ year, month });
      setEventModal(null);

      return true;
    } catch (saveError) {
      if (editing && saveError?.code === NOT_FOUND_CODE) {
        setEventModal(null);
        setError("That event no longer exists.");
        await loadEvents();

        return true;
      }

      console.error("Saving event failed:", saveError);
      setError(
        editing ? "Could not update your event." : "Could not create your event."
      );

      return false;
    }
  }


  async function handleDeleteEvent(event) {
    setError("");

    try {
      await deleteEvent(event.id);

      setEvents((current) => current.filter((item) => item.id !== event.id));
    } catch (deleteError) {
      if (deleteError?.code === NOT_FOUND_CODE) {
        setError("That event no longer exists.");
        await loadEvents();
      } else {
        console.error("Deleting event failed:", deleteError);
        setError("Could not delete that event.");
      }
    } finally {
      setDetails(null);
    }
  }


  return (
    <section className="calendar-page" aria-labelledby="calendar-heading">
      <div className="calendar-panel">
        <header className="calendar-header">
          <div className="calendar-nav">
            <button
              type="button"
              className="checklist-icon-button calendar-nav-button"
              onClick={() => changeMonth(-1)}
              aria-label="Previous month"
            >
              ‹
            </button>

            <h1 id="calendar-heading" tabIndex={-1} aria-live="polite">
              {formatMonthTitle(view.year, view.month)}
            </h1>

            <button
              type="button"
              className="checklist-icon-button calendar-nav-button"
              onClick={() => changeMonth(1)}
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <div className="calendar-actions">
            <button
              type="button"
              className="checklist-button checklist-button-secondary"
              onClick={goToToday}
            >
              Today
            </button>

            <button
              type="button"
              className="checklist-button"
              onClick={() => setEventModal({ date: "", event: null })}
            >
              + Create event
            </button>
          </div>
        </header>

        {error && (
          <div className="checklist-banner" role="alert">
            <p>{error}</p>

            <button
              type="button"
              className="checklist-banner-dismiss"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        <div className="calendar-body">
          {isLoading ? (
            <p className="calendar-status calendar-loading" role="status">
              Loading your calendar…
            </p>
          ) : (
            <>
              {events.length === 0 && (
                <p className="calendar-status">
                  No events yet. Create your first event.
                </p>
              )}

              <CalendarGrid
                year={view.year}
                month={view.month}
                eventsByDate={eventsByDate}
                todayKey={today.key}
                isCompact={isCompact}
                onCreateOnDate={(date) => setEventModal({ date, event: null })}
                onShowDay={(dateKey) => setDetails({ dateKey, eventId: null })}
                onSelectEvent={(event) =>
                  setDetails({ dateKey: event.date, eventId: event.id })
                }
              />
            </>
          )}
        </div>
      </div>

      {eventModal && (
        <CalendarEventModal
          event={eventModal.event}
          initialDate={eventModal.date}
          events={events}
          onSubmit={handleSaveEvent}
          onClose={() => setEventModal(null)}
        />
      )}

      {details && (
        <EventDetailsModal
          dateKey={details.dateKey}
          eventId={details.eventId}
          events={events}
          onClose={() => setDetails(null)}
          onDelete={handleDeleteEvent}
          onEdit={(event) => {
            setDetails(null);
            setEventModal({ date: event.date, event });
          }}
          onAddEvent={(dateKey) => {
            setDetails(null);
            setEventModal({ date: dateKey, event: null });
          }}
        />
      )}
    </section>
  );
}

export default CalendarPage;