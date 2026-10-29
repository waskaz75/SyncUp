import {
  WEEKDAY_LABELS,
  buildMonthGrid,
  formatLongDate,
  formatTime12,
  getTagInfo,
} from "./calendarUtils";

const MAX_VISIBLE_EVENTS = 2;

function CalendarGrid({
  year,
  month,
  eventsByDate,
  todayKey,
  isCompact,
  onCreateOnDate,
  onShowDay,
  onSelectEvent,
}) {
  const cells = buildMonthGrid(year, month);

  return (
    <div>
      <div className="calendar-weekdays" aria-hidden="true">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="calendar-grid">
        {cells.map((cell) => {
          const dayEvents = eventsByDate[cell.key] || [];
          const count = dayEvents.length;
          const isToday = cell.key === todayKey;

          const classes = [
            "calendar-day",
            !cell.inMonth && "outside",
            isToday && "today",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div key={cell.key} className={classes}>
              <button
                type="button"
                className="calendar-day-button"
                aria-label={`${formatLongDate(cell.key)}, ${count} ${
                  count === 1 ? "event" : "events"
                }`}
                aria-current={isToday ? "date" : undefined}
                onClick={() =>
                  isCompact ? onShowDay(cell.key) : onCreateOnDate(cell.key)
                }
              >
                <span className="calendar-day-number">{cell.day}</span>

                {!isCompact && (
                  <span className="calendar-day-plus" aria-hidden="true">
                    +
                  </span>
                )}

                {isCompact && count > 0 && (
                  <span className="calendar-day-count" aria-hidden="true">
                    {count}
                  </span>
                )}
              </button>

              {!isCompact && count > 0 && (
                <div className="calendar-day-events">
                  {dayEvents.slice(0, MAX_VISIBLE_EVENTS).map((event) => {
                    const tag = getTagInfo(event.tag);
                    const label = `${formatTime12(event.time)} ${event.title}`;

                    return (
                      <button
                        key={event.id}
                        type="button"
                        className={`calendar-pill tag-${tag.value}`}
                        title={`${label} (${tag.label})`}
                        aria-label={`${label}, ${tag.label}`}
                        onClick={() => onSelectEvent(event)}
                      >
                        {label}
                      </button>
                    );
                  })}

                  {count > MAX_VISIBLE_EVENTS && (
                    <button
                      type="button"
                      className="calendar-more"
                      onClick={() => onShowDay(cell.key)}
                    >
                      {`+${count - MAX_VISIBLE_EVENTS} more`}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CalendarGrid;