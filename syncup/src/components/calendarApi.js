import { USERNAME_KEY } from "./homePageUtils";

const CALENDAR_STORAGE_KEY = "syncup_calendar_events";
const MOCK_DELAY_MS = 300;

export const NOT_FOUND_CODE = "NOT_FOUND";

function wait() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, MOCK_DELAY_MS);
  });
}

function getStorageKey() {
  const username = (localStorage.getItem(USERNAME_KEY) || "").trim();

  return `${CALENDAR_STORAGE_KEY}_${username || "guest"}`;
}

function readEvents() {
  try {
    const stored = JSON.parse(localStorage.getItem(getStorageKey()));

    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function writeEvents(events) {
  localStorage.setItem(getStorageKey(), JSON.stringify(events));
}

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `event-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createNotFoundError() {
  const error = new Error("Event not found");
  error.code = NOT_FOUND_CODE;

  return error;
}

// TODO (Spring Boot): replace the mock below with
//   const response = await fetch("http://localhost:8080/api/calendar", {
//     method: "GET",
//   });
// then throw if !response.ok, and return the events from the response.
export async function getEvents() {
  await wait();

  return readEvents();
}

// TODO (Spring Boot): replace the mock below with
//   const response = await fetch("http://localhost:8080/api/calendar", {
//     method: "POST",
//     headers: { "Content-Type": "application/x-www-form-urlencoded" },
//     body: new URLSearchParams({ title, date, time }),
//   });
// then throw if !response.ok, and return the created event.
export async function createEvent({ title, date, time }) {
  await wait();

  const newEvent = {
    id: createId(),
    title: title.trim(),
    date,
    time,
  };

  writeEvents([...readEvents(), newEvent]);

  return newEvent;
}

// TODO (Spring Boot): replace the mock below with
//   const response = await fetch(`http://localhost:8080/api/calendar/${id}`, {
//     method: "PUT",
//     headers: { "Content-Type": "application/x-www-form-urlencoded" },
//     body: new URLSearchParams({ title, date, time }),
//   });
// If the response is 404, throw an error with code NOT_FOUND_CODE.
// Otherwise return the updated event from the response.
export async function updateEvent(id, { title, date, time }) {
  await wait();

  const events = readEvents();
  const index = events.findIndex((event) => event.id === id);

  if (index === -1) {
    throw createNotFoundError();
  }

  const updatedEvent = {
    ...events[index],
    title: title.trim(),
    date,
    time,
  };

  events[index] = updatedEvent;
  writeEvents(events);

  return updatedEvent;
}

// TODO (Spring Boot): replace the mock below with
//   const response = await fetch(`http://localhost:8080/api/calendar/${id}`, {
//     method: "DELETE",
//   });
// If the response is 404, throw an error with code NOT_FOUND_CODE.
export async function deleteEvent(id) {
  await wait();

  const events = readEvents();

  if (!events.some((event) => event.id === id)) {
    throw createNotFoundError();
  }

  writeEvents(events.filter((event) => event.id !== id));
}