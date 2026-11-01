import { useEffect, useState } from "react";

import MoodFace from "./moodFace";
import MoodModal from "./MoodModal";
import {
  WEEKDAY_LABELS,
  buildMonthGrid,
  formatLongDate,
  formatMonthTitle,
  getToday,
} from "./calendarUtils";
import { getMood } from "./meUtils";
import { clearMood, getMoods, setMood } from "./moodApi";

function MoodBoard() {
  const [moods, setMoods] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [today, setToday] = useState(() => getToday());
  const [view, setView] = useState(() => {
    const now = getToday();

    return { year: now.year, month: now.month };
  });

  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadMoods() {
      try {
        const entries = await getMoods();

        if (!isCancelled) {
          setMoods(
            Object.fromEntries(entries.map((entry) => [entry.date, entry.mood]))
          );
        }
      } catch (loadError) {
        if (!isCancelled) {
          console.error("Loading moods failed:", loadError);
          setError("Could not load your mood board.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadMoods();

    return () => {
      isCancelled = true;
    };
  }, []);

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

  async function handlePick(dateKey, moodValue) {
    setError("");

    try {
      const saved = await setMood(dateKey, moodValue);

      setMoods((current) => ({ ...current, [saved.date]: saved.mood }));
      setSelectedDate(null);

      return true;
    } catch (saveError) {
      console.error("Saving mood failed:", saveError);

      return false;
    }
  }

  async function handleClear(dateKey) {
    setError("");

    try {
      await clearMood(dateKey);

      setMoods((current) => {
        const next = { ...current };

        delete next[dateKey];

        return next;
      });
      setSelectedDate(null);

      return true;
    } catch (clearError) {
      console.error("Removing mood failed:", clearError);

      return false;
    }
  }

  const cells = buildMonthGrid(view.year, view.month);

  return (
    <div className="me-mood">
      <header className="me-mood-header">
        <div className="me-mood-nav">
          <button
            type="button"
            className="checklist-icon-button calendar-nav-button"
            onClick={() => changeMonth(-1)}
            aria-label="Previous month"
          >
            ‹
          </button>

          <h2 aria-live="polite">{formatMonthTitle(view.year, view.month)}</h2>

          <button
            type="button"
            className="checklist-icon-button calendar-nav-button"
            onClick={() => changeMonth(1)}
            aria-label="Next month"
          >
            ›
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

      {isLoading ? (
        <p className="me-status" role="status">
          Loading your mood board…
        </p>
      ) : (
        <div className="me-mood-grid-wrap">
          <div className="me-mood-weekdays" aria-hidden="true">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className="me-mood-grid">
            {cells.map((cell) => {
              const moodValue = moods[cell.key];
              const mood = moodValue ? getMood(moodValue) : null;
              const isToday = cell.key === today.key;
              const isFuture = cell.key > today.key;

              const classes = [
                "me-mood-cell",
                !cell.inMonth && "outside",
                isToday && "today",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <button
                  key={cell.key}
                  type="button"
                  className={classes}
                  disabled={isFuture}
                  aria-label={`${formatLongDate(cell.key)}, ${
                    mood ? `mood: ${mood.label}` : "no mood logged"
                  }`}
                  aria-current={isToday ? "date" : undefined}
                  onClick={() => setSelectedDate(cell.key)}
                >
                  <span className="me-mood-day">{cell.day}</span>

                  {mood && (
                    <span className="me-mood-face-wrap">
                      <MoodFace mood={mood.value} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedDate && (
        <MoodModal
          dateKey={selectedDate}
          currentMood={moods[selectedDate] || null}
          onPick={(moodValue) => handlePick(selectedDate, moodValue)}
          onClear={() => handleClear(selectedDate)}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}

export default MoodBoard;