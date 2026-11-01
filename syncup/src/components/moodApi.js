import { USERNAME_KEY } from "./homePageUtils";
import { normalizeMood } from "./meUtils";

const MOODS_KEY = "syncup_moods";
const MOCK_DELAY_MS = 300;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// ------------------------------------------------------------
// Mock helpers (these all disappear when the backend is wired in)
// ------------------------------------------------------------

function wait() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, MOCK_DELAY_MS);
  });
}

function getStorageKey() {
  const username = (localStorage.getItem(USERNAME_KEY) || "").trim();

  return `${MOODS_KEY}_${username || "guest"}`;
}

function readMoods() {
  try {
    const stored = JSON.parse(localStorage.getItem(getStorageKey()));

    return stored && typeof stored === "object" && !Array.isArray(stored)
      ? stored
      : {};
  } catch {
    return {};
  }
}

function writeMoods(moods) {
  localStorage.setItem(getStorageKey(), JSON.stringify(moods));
}

// ------------------------------------------------------------
// Public API
// ------------------------------------------------------------

// Returns [{ date: "YYYY-MM-DD", mood: "great" | "good" | ... }]
// TODO (Spring Boot): replace the mock below with
//   const response = await fetch("http://localhost:8080/api/mood", {
//     method: "GET",
//   });
// then throw if !response.ok, and return the entries from the response.
export async function getMoods() {
  await wait();

  return Object.entries(readMoods())
    .filter(([date, mood]) => DATE_PATTERN.test(date) && normalizeMood(mood))
    .map(([date, mood]) => ({ date, mood }));
}

// Saves (or replaces) the mood for one date.
// TODO (Spring Boot): replace the mock below with
//   const response = await fetch(`http://localhost:8080/api/mood/${date}`, {
//     method: "PUT",
//     headers: { "Content-Type": "application/x-www-form-urlencoded" },
//     body: new URLSearchParams({ mood }),
//   });
// then throw if !response.ok, and return { date, mood }.
export async function setMood(date, mood) {
  await wait();

  if (!DATE_PATTERN.test(date) || !normalizeMood(mood)) {
    throw new Error("Invalid mood entry");
  }

  writeMoods({ ...readMoods(), [date]: mood });

  return { date, mood };
}

// Removes the mood for one date.
// TODO (Spring Boot): replace the mock below with
//   const response = await fetch(`http://localhost:8080/api/mood/${date}`, {
//     method: "DELETE",
//   });
// then throw if !response.ok.
export async function clearMood(date) {
  await wait();

  const moods = readMoods();

  delete moods[date];
  writeMoods(moods);
}