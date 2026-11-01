import { getToday } from "./calendarUtils";
import { USERNAME_KEY } from "./homePageUtils";

const FOCUS_KEY = "syncup_focus_seconds";
const CHECKED_KEY = "syncup_checked_items";
const MOCK_DELAY_MS = 300;

// ------------------------------------------------------------
// Mock helpers (these all disappear when the backend is wired in)
// ------------------------------------------------------------

function wait() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, MOCK_DELAY_MS);
  });
}

function getStorageKey(baseKey) {
  const username = (localStorage.getItem(USERNAME_KEY) || "").trim();

  return `${baseKey}_${username || "guest"}`;
}

function readObject(baseKey) {
  try {
    const stored = JSON.parse(localStorage.getItem(getStorageKey(baseKey)));

    return stored && typeof stored === "object" && !Array.isArray(stored)
      ? stored
      : {};
  } catch {
    return {};
  }
}

function writeObject(baseKey, value) {
  localStorage.setItem(getStorageKey(baseKey), JSON.stringify(value));
}

// ------------------------------------------------------------
// Recording (called by the Timer and the Checklist)
// These never throw: a problem here must not break the timer.
// ------------------------------------------------------------

// Adds seconds of working time to today.
// TODO (Spring Boot): replace the mock below with a fire-and-forget call:
//   fetch("http://localhost:8080/api/activity/focus", {
//     method: "POST",
//     headers: { "Content-Type": "application/x-www-form-urlencoded" },
//     body: new URLSearchParams({ seconds: String(seconds) }),
//   }).catch((error) => console.error("Saving focus time failed:", error));
// The server should decide which date it counts toward.
export function recordFocusSeconds(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return;
  }

  try {
    const log = readObject(FOCUS_KEY);
    const { key } = getToday();

    log[key] = (log[key] || 0) + Math.round(seconds);
    writeObject(FOCUS_KEY, log);
  } catch (error) {
    console.error("Saving focus time failed:", error);
  }
}

// Remembers the day a checklist item was ticked (and forgets it if unticked).
// TODO (Spring Boot): the server can store the completion date itself when the
// checklist item is updated. If it does, delete this function and its call in
// ChecklistPage.jsx, and have getActivity() return the counts.
export function recordChecklistCompletion(itemId, completed) {
  try {
    const log = readObject(CHECKED_KEY);

    if (completed) {
      log[itemId] = getToday().key;
    } else {
      delete log[itemId];
    }

    writeObject(CHECKED_KEY, log);
  } catch (error) {
    console.error("Saving checklist completion failed:", error);
  }
}

// ------------------------------------------------------------
// Reading (called by the Accomplishment Report)
// ------------------------------------------------------------

// Returns:
//   focusSeconds:  { "YYYY-MM-DD": secondsWorked }
//   checkedByDate: { "YYYY-MM-DD": itemsCheckedOff }
// TODO (Spring Boot): replace the mock below with
//   const response = await fetch("http://localhost:8080/api/activity/summary", {
//     method: "GET",
//   });
// then throw if !response.ok. If the server returns a different shape,
// convert it to the one above here, so the components do not change.
export async function getActivity() {
  await wait();

  const completions = readObject(CHECKED_KEY);
  const checkedByDate = {};

  Object.values(completions).forEach((dateKey) => {
    checkedByDate[dateKey] = (checkedByDate[dateKey] || 0) + 1;
  });

  return { focusSeconds: readObject(FOCUS_KEY), checkedByDate };
}