import { USERNAME_KEY } from "./homePageUtils";
import { DEFAULT_TAG, normalizeTag } from "./calendarUtils";

const API_BASE_URL = `${(import.meta.env.VITE_API_BASE_URL || "").replace(
  /\/+$/,
  ""
)}/api/calendar`;

export const NOT_FOUND_CODE = "NOT_FOUND";

// ------------------------------------------------------------
// AUTHENTICATION
// ------------------------------------------------------------

// Retrieve the session ID created after successful login and 2FA.
function getSessionId() {
  const sessionId = localStorage.getItem("syncup_session_id");

  if (!sessionId) {
    throw new Error("You must be logged in to access your calendar.");
  }

  return sessionId;
}

// Build the backend URL with the user's session ID.
function buildUrl(path = "") {
  const url = new URL(
    `${API_BASE_URL}${path}`,
    window.location.origin
  );

  url.searchParams.set("sessionId", getSessionId());

  return url.toString();
}

// ------------------------------------------------------------
// TEMPORARY TAG STORAGE
// TODO (Spring Boot): the backend CalendarEvent has no "tag" field yet.
// Until it does, tags are remembered here, keyed by event ID.
// When the backend returns and saves `tag`, delete this whole section,
// plus the saveTag/removeTag calls below.
// ------------------------------------------------------------

function getTagStorageKey() {
  const username = (localStorage.getItem(USERNAME_KEY) || "").trim();

  return `syncup_calendar_event_tags_${username || "guest"}`;
}

function readTagMap() {
  try {
    const stored = JSON.parse(localStorage.getItem(getTagStorageKey()));

    return stored && typeof stored === "object" ? stored : {};
  } catch {
    return {};
  }
}

function saveTag(id, tag) {
  localStorage.setItem(
    getTagStorageKey(),
    JSON.stringify({ ...readTagMap(), [id]: normalizeTag(tag) })
  );
}

function removeTag(id) {
  const tagMap = readTagMap();

  delete tagMap[id];
  localStorage.setItem(getTagStorageKey(), JSON.stringify(tagMap));
}

// ------------------------------------------------------------
// DATA CONVERSION
// ------------------------------------------------------------

function convertEvent(event, tagMap = readTagMap()) {
  const start = event.startDatetime;
  const end = event.endDatetime;

  return {
    id: event.eventId,
    title: event.title,
    date: start.substring(0, 10),
    time: start.substring(11, 16),
    endTime: end.substring(11, 16),
    // TODO (Spring Boot): once the backend returns `tag`, use only event.tag.
    tag: normalizeTag(event.tag || tagMap[event.eventId] || DEFAULT_TAG),
  };
}

function buildEventBody({ title, date, time, endTime, tag }) {
  return new URLSearchParams({
    title: title.trim(),
    startDatetime: `${date}T${time}:00`,
    endDatetime: `${date}T${endTime}:00`,
    // TODO (Spring Boot): add a `tag` parameter to the create/update endpoints.
    tag: normalizeTag(tag),
  });
}

// ------------------------------------------------------------
// ERROR HANDLING
// ------------------------------------------------------------

// Handle unsuccessful backend responses and plain-text results.
async function handleResponse(response) {
  const result = await response.text();

  if (!response.ok) {
    const error = new Error(result || "Calendar request failed.");

    if (response.status === 404) {
      error.code = NOT_FOUND_CODE;
    }

    throw error;
  }

  // PUT and DELETE currently return "SUCCESS" as plain text.
  if (result !== "SUCCESS") {
    if (
      result === "Event not found" ||
      result === "Event not found or no changes were made"
    ) {
      const error = new Error(result);
      error.code = NOT_FOUND_CODE;
      throw error;
    }

    throw new Error(result || "Calendar request failed.");
  }

  return result;
}

// ------------------------------------------------------------
// GET: Retrieve all calendar events
// ------------------------------------------------------------
export async function getEvents() {
  const response = await fetch(buildUrl("/events"));

  if (!response.ok) {
    await handleResponse(response);
  }

  const events = await response.json();
  const tagMap = readTagMap();

  return events.map((event) => convertEvent(event, tagMap));
}

// ------------------------------------------------------------
// POST: Create a new calendar event
// ------------------------------------------------------------
export async function createEvent(values) {
  const response = await fetch(buildUrl("/events"), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: buildEventBody(values),
  });

  if (!response.ok) {
    await handleResponse(response);
  }

  const createdEvent = await response.json();

  saveTag(createdEvent.eventId, values.tag); // TODO: remove with the backend

  return convertEvent(createdEvent);
}

// ------------------------------------------------------------
// PUT: Update an existing calendar event
// ------------------------------------------------------------
export async function updateEvent(id, values) {
  const response = await fetch(buildUrl(`/events/${id}`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: buildEventBody(values),
  });

  await handleResponse(response);
  saveTag(id, values.tag); // TODO: remove with the backend

  return {
    id,
    title: values.title.trim(),
    date: values.date,
    time: values.time,
    endTime: values.endTime,
    tag: normalizeTag(values.tag),
  };
}

// ------------------------------------------------------------
// DELETE: Remove a calendar event
// ------------------------------------------------------------
export async function deleteEvent(id) {
  const response = await fetch(buildUrl(`/events/${id}`), {
    method: "DELETE",
  });

  await handleResponse(response);
  removeTag(id); // TODO: remove with the backend
}
