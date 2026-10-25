
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || ""}/api/checklist`;

export const NOT_FOUND_CODE = "NOT_FOUND";
export const DUPLICATE_TASK_CODE = "DUPLICATE_TASK";

// Retrieve the session ID created after successful login and 2FA.
function getSessionId() {
  const sessionId = localStorage.getItem("syncup_session_id");

  if (!sessionId) {
    throw new Error("You must be logged in to access your checklist.");
  }

  return sessionId;
}

// Build the backend URL with the user's session ID.
function buildUrl(path = "") {
  const url = new URL(`${API_BASE_URL}${path}`);

  url.searchParams.set("sessionId", getSessionId());

  return url.toString();
}

// Convert a Spring Boot ChecklistItem into the format React expects.
function convertItem(item) {
  return {
    id: item.itemId,
    text: item.title,
    completed: item.completed,
  };
}

// Handle unsuccessful backend responses.
async function handleResponse(response) {
  const result = await response.text();

  if (!response.ok) {
    const error = new Error(result || "Checklist request failed.");

    if (response.status === 404) {
      error.code = NOT_FOUND_CODE;
    }

    if (response.status === 409) {
      error.code = DUPLICATE_TASK_CODE;
    }

    throw error;
  }

  // The current PUT and DELETE endpoints return plain-text results.
  if (result !== "SUCCESS") {
    if (
      result === "Task not found." ||
      result === "Item not found." ||
      result === "Checklist item not found."
    ) {
      const error = new Error(result);
      error.code = NOT_FOUND_CODE;
      throw error;
    }

    // Prevent validation or database failure messages returned
    // with HTTP 200 from being treated as successful operations.
    throw new Error(result || "Checklist request failed.");
  }

  return result;
}

// ------------------------------------------------------------
// GET: Retrieve all checklist items
// ------------------------------------------------------------
export async function getItems() {
  const response = await fetch(buildUrl("/items"));

  if (!response.ok) {
    await handleResponse(response);
  }

  const items = await response.json();

  return items.map(convertItem);
}

// ------------------------------------------------------------
// POST: Create a new checklist item
// ------------------------------------------------------------
export async function createItem(text) {
  const response = await fetch(buildUrl("/items"), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      title: text.trim(),
    }),
  });

  if (!response.ok) {
    await handleResponse(response);
  }

  // Spring Boot now returns HTTP 201 and the created item as JSON.
  const createdItem = await response.json();

  return convertItem(createdItem);
}

// ------------------------------------------------------------
// PUT: Update an existing checklist item
// ------------------------------------------------------------
export async function updateItem(id, changes) {
  // Retrieve the existing item so we preserve its title
  // when only its completion status changes.
  const items = await getItems();

  const existingItem = items.find((item) => item.id === id);

  if (!existingItem) {
    const error = new Error("Task not found.");
    error.code = NOT_FOUND_CODE;
    throw error;
  }

  const updatedItem = {
    ...existingItem,
    ...changes,
  };

  if (updatedItem.text !== undefined) {
    updatedItem.text = updatedItem.text.trim();
  }

  const response = await fetch(buildUrl(`/items/${id}`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      title: updatedItem.text,
      completed: String(updatedItem.completed),
    }),
  });

  await handleResponse(response);

  return updatedItem;
}

// ------------------------------------------------------------
// DELETE: Delete a checklist item
// ------------------------------------------------------------
export async function deleteItem(id) {
  const response = await fetch(buildUrl(`/items/${id}`), {
    method: "DELETE",
  });

  await handleResponse(response);
}
