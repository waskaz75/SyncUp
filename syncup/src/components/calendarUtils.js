const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const DEFAULT_TAG = "general";

export const EVENT_TAGS = [
  { value: "general", label: "General" },
  { value: "high-priority", label: "High Priority" },
  { value: "flex-priority", label: "Flexible Priority" },
  { value: "low-priority", label: "Low Priority" },
];

export function normalizeTag(tag) {
  return EVENT_TAGS.some((item) => item.value === tag) ? tag : DEFAULT_TAG;
}

export function getTagInfo(tag) {
  const value = normalizeTag(tag);

  return EVENT_TAGS.find((item) => item.value === value);
}

function pad(number) {
  return String(number).padStart(2, "0");
}

export function toDateKey(year, month, day) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

export function parseDateKey(key) {
  const [year, month, day] = key.split("-").map(Number);

  return { year, month: month - 1, day };
}

export function getToday() {
  const now = new Date();

  return {
    year: now.getFullYear(),
    month: now.getMonth(),
    key: toDateKey(now.getFullYear(), now.getMonth(), now.getDate()),
  };
}

export function formatMonthTitle(year, month) {
  return `${MONTH_NAMES[month]} ${year}`;
}

export function formatLongDate(key) {
  const { year, month, day } = parseDateKey(key);

  return `${MONTH_NAMES[month]} ${day}, ${year}`;
}

export function formatFullDate(key) {
  const { year, month, day } = parseDateKey(key);

  const weekday = new Date(year, month, day).toLocaleDateString("en-US", {
    weekday: "long",
  });

  return `${weekday}, ${formatLongDate(key)}`;
}

export function formatTime12(time) {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour = hours % 12 || 12;

  return `${hour}:${pad(minutes)} ${suffix}`;
}

export function buildMonthGrid(year, month) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const date = new Date(year, month, 1 - firstWeekday + index);

    return {
      key: toDateKey(date.getFullYear(), date.getMonth(), date.getDate()),
      day: date.getDate(),
      inMonth: date.getMonth() === month,
    };
  });
}

export function sortEvents(events) {
  return [...events].sort(
    (a, b) => a.time.localeCompare(b.time) || a.title.localeCompare(b.title)
  );
}

export function groupEventsByDate(events) {
  const groups = {};

  events.forEach((event) => {
    if (!groups[event.date]) {
      groups[event.date] = [];
    }

    groups[event.date].push(event);
  });

  Object.keys(groups).forEach((key) => {
    groups[key] = sortEvents(groups[key]);
  });

  return groups;
}