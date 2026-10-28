
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
// DATA CONVERSION
// ------------------------------------------------------------

// Convert a Spring Boot CalendarEvent into the format
// expected by the existing React Calendar components.
function convertEvent(event) {
  const start = event.startDatetime;
  const end = event.endDatetime;

  return {
    id: event.eventId,
    title: event.title,
    date: start.substring(0, 10),
    time: start.substring(11, 16),
    endTime: end.substring(11, 16),
  };
}

// Convert frontend date and time values into the
// LocalDateTime format expected by Spring Boot.
function buildEventBody({ title, date, time, endTime }) {
  return new URLSearchParams({
    title: title.trim(),
    startDatetime: `${date}T${time}:00`,
    endDatetime: `${date}T${endTime}:00`,
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

  return events.map(convertEvent);
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

  // Spring Boot now returns HTTP 201 Created
  // and the newly created event as JSON.
  const createdEvent = await response.json();

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

  // The backend currently returns "SUCCESS" for updates,
  // so we return the values that were successfully saved.
  return {
    id,
    title: values.title.trim(),
    date: values.date,
    time: values.time,
    endTime: values.endTime,
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
}
