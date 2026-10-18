import { USERNAME_KEY } from "./homePageUtils";

const CHECKLIST_STORAGE_KEY = "syncup_checklist_items";
const MOCK_DELAY_MS = 300;

export const NOT_FOUND_CODE = "NOT_FOUND";

function wait() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, MOCK_DELAY_MS);
  });
}

function getStorageKey() {
  const username = (localStorage.getItem(USERNAME_KEY) || "").trim();

  return `${CHECKLIST_STORAGE_KEY}_${username || "guest"}`;
}

function readItems() {
  try {
    const stored = JSON.parse(localStorage.getItem(getStorageKey()));

    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function writeItems(items) {
  localStorage.setItem(getStorageKey(), JSON.stringify(items));
}

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createNotFoundError() {
  const error = new Error("Item not found");
  error.code = NOT_FOUND_CODE;

  return error;
}

// ------------------------------------------------------------
// Public API
// ------------------------------------------------------------

// TODO (Spring Boot): replace the mock below with
//   const response = await fetch("http://localhost:8080/api/checklist", {
//     method: "GET",
//   });
// then throw if !response.ok, and return the items from the response.
export async function getItems() {
  await wait();

  return readItems();
}

// TODO (Spring Boot): replace the mock below with
//   const response = await fetch("http://localhost:8080/api/checklist", {
//     method: "POST",
//     headers: { "Content-Type": "application/x-www-form-urlencoded" },
//     body: new URLSearchParams({ text }),
//   });
// then throw if !response.ok, and return the created item.
export async function createItem(text) {
  await wait();

  const newItem = {
    id: createId(),
    text: text.trim(),
    completed: false,
  };

  writeItems([...readItems(), newItem]);

  return newItem;
}

// TODO (Spring Boot): replace the mock below with
//   const response = await fetch(`http://localhost:8080/api/checklist/${id}`, {
//     method: "PUT",
//     headers: { "Content-Type": "application/x-www-form-urlencoded" },
//     body: new URLSearchParams(changes), // values must be strings
//   });
// If the response is 404, throw an error with code NOT_FOUND_CODE.
export async function updateItem(id, changes) {
  await wait();

  const items = readItems();
  const index = items.findIndex((item) => item.id === id);

  if (index === -1) {
    throw createNotFoundError();
  }

  const { text, completed } = changes;

  const updatedItem = {
    ...items[index],
    ...(text !== undefined && { text: text.trim() }),
    ...(completed !== undefined && { completed }),
  };

  items[index] = updatedItem;
  writeItems(items);

  return updatedItem;
}

// TODO (Spring Boot): replace the mock below with
//   const response = await fetch(`http://localhost:8080/api/checklist/${id}`, {
//     method: "DELETE",
//   });
// If the response is 404, throw an error with code NOT_FOUND_CODE.
export async function deleteItem(id) {
  await wait();

  const items = readItems();

  if (!items.some((item) => item.id === id)) {
    throw createNotFoundError();
  }

  writeItems(items.filter((item) => item.id !== id));
}