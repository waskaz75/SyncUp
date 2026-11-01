import { useEffect, useMemo, useState } from "react";

import BarChart from "./BarChart";
import MoodFace from "./moodFace";
import { getActivity } from "./activityApi";
import { getToday } from "./calendarUtils";
import { buildReport, formatDuration, getMood, scoreToMood } from "./meUtils";
import { getMoods } from "./moodApi";

function AccomplishmentReport() {
  const [period, setPeriod] = useState("week"); 
  const [activity, setActivity] = useState({
    focusSeconds: {},
    checkedByDate: {},
  });
  const [moods, setMoods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [todayKey] = useState(() => getToday().key);

  useEffect(() => {
    let isCancelled = false;

    async function loadReport() {
      try {
        const [loadedActivity, loadedMoods] = await Promise.all([
          getActivity(),
          getMoods(),
        ]);

        if (!isCancelled) {
          setActivity(loadedActivity);
          setMoods(loadedMoods);
        }
      } catch (loadError) {
        if (!isCancelled) {
          console.error("Loading report failed:", loadError);
          setError("Could not load your report.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadReport();

    return () => {
      isCancelled = true;
    };
  }, []);

  const report = useMemo(
    () => buildReport(period, todayKey, activity, moods),
    [period, todayKey, activity, moods]
  );

  // ---- Chart data ----

  const maxFocus = Math.max(...report.days.map((day) => day.focusSeconds));
  const maxChecked = Math.max(...report.days.map((day) => day.checked));

  const focusDays = report.days.map((day) => ({
    ...day,
    value: day.focusSeconds,
    valueText: formatDuration(day.focusSeconds),
    color: "var(--chart-focus)",
  }));

  const moodDays = report.days.map((day) => ({
    ...day,
    value: day.moodScore,
    valueText: day.moodValue
      ? getMood(day.moodValue).label
      : "No mood logged",
    color: day.moodValue ? `var(--mood-${day.moodValue})` : undefined,
  }));

  const checkedDays = report.days.map((day) => ({
    ...day,
    value: day.checked,
    valueText: `${day.checked} ${day.checked === 1 ? "item" : "items"}`,
    color: "var(--chart-checked)",
  }));

  const labelEvery = period === "week" ? 1 : 2;
  const averageMoodInfo =
    report.averageMood === null ? null : scoreToMood(report.averageMood);
  const hasNothing =
    report.totalFocusSeconds === 0 &&
    report.totalChecked === 0 &&
    report.moodDayCount === 0;

  return (
    <div className="me-report">
      <div className="me-report-toolbar">
        <div>
          <h2>{period === "week" ? "Weekly report" : "Monthly report"}</h2>
          <p className="me-report-range">{report.label}</p>
        </div>

        <div className="me-period-toggle" role="group" aria-label="Report period">
          <button
            type="button"
            aria-pressed={period === "week"}
            onClick={() => setPeriod("week")}
          >
            This week
          </button>

          <button
            type="button"
            aria-pressed={period === "month"}
            onClick={() => setPeriod("month")}
          >
            This month
          </button>
        </div>
      </div>

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
          Loading your report…
        </p>
      ) : (
        <>
          <ul className="me-summary">
            <li className="me-summary-card">
              <p className="me-summary-label">Time worked</p>
              <p className="me-summary-value">
                {formatDuration(report.totalFocusSeconds)}
              </p>
              <p className="me-summary-note">Counted by the Timer</p>
            </li>

            <li className="me-summary-card">
              <p className="me-summary-label">Average mood</p>

              {averageMoodInfo ? (
                <>
                  <p className="me-summary-value">
                    <MoodFace
                      mood={averageMoodInfo.value}
                      title={averageMoodInfo.label}
                    />
                    <span>{report.averageMood.toFixed(1)} / 5</span>
                  </p>
                  <p className="me-summary-note">
                    {`${averageMoodInfo.label}, from ${report.moodDayCount} ${
                      report.moodDayCount === 1 ? "day" : "days"
                    } logged`}
                  </p>
                </>
              ) : (
                <>
                  <p className="me-summary-value">–</p>
                  <p className="me-summary-note">No moods logged yet</p>
                </>
              )}
            </li>

            <li className="me-summary-card">
              <p className="me-summary-label">Items checked off</p>
              <p className="me-summary-value">{report.totalChecked}</p>
              <p className="me-summary-note">From your Checklist</p>
            </li>
          </ul>

          {hasNothing && (
            <p className="me-status">
              Nothing logged yet. Run the Timer, tick off Checklist items, or
              pick a mood on the Mood Board, and it will show up here.
            </p>
          )}

          <div className="me-charts">
            <BarChart
              title="Time worked"
              unitLabel="Time"
              days={focusDays}
              maxValue={Math.max(3600, Math.ceil(maxFocus / 1800) * 1800)}
              formatAxis={formatDuration}
              labelEvery={labelEvery}
            />

            <BarChart
              title="Mood"
              unitLabel="Mood"
              days={moodDays}
              maxValue={5}
              formatAxis={String}
              labelEvery={labelEvery}
            />

            <BarChart
              title="Items checked off"
              unitLabel="Items"
              days={checkedDays}
              maxValue={Math.max(4, maxChecked)}
              formatAxis={String}
              labelEvery={labelEvery}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default AccomplishmentReport;