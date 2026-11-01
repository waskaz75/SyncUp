import { formatLongDate, parseDateKey, toDateKey } from "./calendarUtils";

// ------------------------------------------------------------
// Moods
// ------------------------------------------------------------

export const MOODS = [
  { value: "great", label: "Great", score: 5 },
  { value: "good", label: "Good", score: 4 },
  { value: "okay", label: "Okay", score: 3 },
  { value: "low", label: "Low", score: 2 },
  { value: "awful", label: "Awful", score: 1 },
];

export function normalizeMood(value) {
  return MOODS.some((mood) => mood.value === value) ? value : null;
}

export function getMood(value) {
  return MOODS.find((mood) => mood.value === value) || MOODS[2];
}

export function scoreToMood(score) {
  const rounded = Math.min(5, Math.max(1, Math.round(score)));

  return MOODS.find((mood) => mood.score === rounded);
}

// ------------------------------------------------------------
// Time formatting
// ------------------------------------------------------------

export function formatDuration(seconds) {
  if (seconds <= 0) {
    return "0m";
  }

  const totalMinutes = Math.floor(seconds / 60);

  if (totalMinutes < 1) {
    return "<1m";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

// ------------------------------------------------------------
// Weekly / monthly report
// ------------------------------------------------------------

const WEEKDAYS_MONDAY_FIRST = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function keyFromDate(date) {
  return toDateKey(date.getFullYear(), date.getMonth(), date.getDate());
}

function getWeekKeys(todayKey) {
  const { year, month, day } = parseDateKey(todayKey);
  const daysSinceMonday = (new Date(year, month, day).getDay() + 6) % 7;

  return Array.from({ length: 7 }, (_, index) =>
    keyFromDate(new Date(year, month, day - daysSinceMonday + index))
  );
}

function getMonthKeys(todayKey) {
  const { year, month } = parseDateKey(todayKey);
  const count = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: count }, (_, index) =>
    toDateKey(year, month, index + 1)
  );
}

function formatPeriodLabel(period, keys) {
  const first = parseDateKey(keys[0]);
  const last = parseDateKey(keys[keys.length - 1]);

  if (period === "month") {
    return new Date(first.year, first.month, 1).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }

  const short = ({ year, month, day }) =>
    new Date(year, month, day).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

  return `${short(first)} – ${short(last)}, ${last.year}`;
}

export function buildReport(period, todayKey, activity, moods) {
  const keys = period === "week" ? getWeekKeys(todayKey) : getMonthKeys(todayKey);

  const moodByDate = {};

  moods.forEach((entry) => {
    moodByDate[entry.date] = entry.mood;
  });

  const days = keys.map((key, index) => {
    const isFuture = key > todayKey;
    const moodValue = isFuture ? null : moodByDate[key] || null;

    return {
      key,
      label: period === "week" ? WEEKDAYS_MONDAY_FIRST[index] : String(index + 1),
      fullLabel: formatLongDate(key),
      focusSeconds: isFuture ? 0 : activity.focusSeconds[key] || 0,
      checked: isFuture ? 0 : activity.checkedByDate[key] || 0,
      moodValue,
      moodScore: moodValue ? getMood(moodValue).score : null,
      isToday: key === todayKey,
      isFuture,
    };
  });

  const moodDays = days.filter((day) => day.moodScore !== null);

  return {
    days,
    label: formatPeriodLabel(period, keys),
    totalFocusSeconds: days.reduce((sum, day) => sum + day.focusSeconds, 0),
    totalChecked: days.reduce((sum, day) => sum + day.checked, 0),
    moodDayCount: moodDays.length,
    averageMood:
      moodDays.length === 0
        ? null
        : moodDays.reduce((sum, day) => sum + day.moodScore, 0) /
          moodDays.length,
  };
}