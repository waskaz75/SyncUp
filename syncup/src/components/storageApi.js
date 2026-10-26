import { USERNAME_KEY } from "./homePageUtils";

const FOLDERS_KEY = "syncup_storage_folders";
const FILES_KEY = "syncup_storage_files";
const DB_NAME = "syncup_storage";
const DB_STORE = "files";
const MOCK_DELAY_MS = 300;

export const MAX_UPLOAD_SIZE = 20 * 1024 * 1024;
export const NOT_FOUND_CODE = "NOT_FOUND";

function wait() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, MOCK_DELAY_MS);
  });
}

function getUserSuffix() {
  const username = (localStorage.getItem(USERNAME_KEY) || "").trim();

  return username || "guest";
}

function readList(baseKey) {
  try {
    const stored = JSON.parse(
      localStorage.getItem(`${baseKey}_${getUserSuffix()}`)
    );

    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function writeList(baseKey, list) {
  localStorage.setItem(`${baseKey}_${getUserSuffix()}`, JSON.stringify(list));
}

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createNotFoundError(message) {
  const error = new Error(message);
  error.code = NOT_FOUND_CODE;

  return error;
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      request.result.createObjectStore(DB_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveBlob(id, blob) {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(DB_STORE, "readwrite");

    transaction.objectStore(DB_STORE).put(blob, id);

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error || new Error("Saving the file was aborted"));
    };
  });
}

async function loadBlob(id) {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(DB_STORE, "readonly");
    const request = transaction.objectStore(DB_STORE).get(id);

    transaction.oncomplete = () => {
      database.close();
      resolve(request.result);
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

// TODO (Spring Boot): replace the mock below with
//   const response = await fetch("http://localhost:8080/api/storage/folders", {
//     method: "GET",
//   });
// then throw if !response.ok, and return the folders: [{ id, name }].
export async function getFolders() {
  await wait();

  return readList(FOLDERS_KEY);
}

// TODO (Spring Boot): replace the mock below with
//   const response = await fetch("http://localhost:8080/api/storage/folders", {
//     method: "POST",
//     headers: { "Content-Type": "application/x-www-form-urlencoded" },
//     body: new URLSearchParams({ name }),
//   });
// then throw if !response.ok, and return the created folder.
export async function createFolder(name) {
  await wait();

  const newFolder = { id: createId(), name: name.trim() };

  writeList(FOLDERS_KEY, [...readList(FOLDERS_KEY), newFolder]);

  return newFolder;
}

// Returns the details of every file (no contents):
// [{ id, folderId, name, type, size, uploadedAt }]
// TODO (Spring Boot): replace the mock below with
//   const response = await fetch("http://localhost:8080/api/storage/files", {
//     method: "GET",
//   });
// then throw if !response.ok, and return the file list from the response.
export async function getFiles() {
  await wait();

  return readList(FILES_KEY);
}

// TODO (Spring Boot): replace the mock below with
//   const formData = new FormData();
//   formData.append("file", file);
//   const response = await fetch(
//     `http://localhost:8080/api/storage/folders/${folderId}/files`,
//     {
//       method: "POST",
//       body: formData, // do NOT set Content-Type; the browser adds it for files
//     }
//   );
// If the response is 404, throw an error with code NOT_FOUND_CODE.
// Otherwise return the created file details from the response.
export async function uploadFile(folderId, file) {
  await wait();

  if (!readList(FOLDERS_KEY).some((folder) => folder.id === folderId)) {
    throw createNotFoundError("Folder not found");
  }

  const details = {
    id: createId(),
    folderId,
    name: file.name,
    type: file.type,
    size: file.size,
    uploadedAt: new Date().toISOString(),
  };

  await saveBlob(details.id, file);

  writeList(FILES_KEY, [...readList(FILES_KEY), details]);

  return details;
}

// Returns the file's contents as a Blob.
// TODO (Spring Boot): replace the mock below with
//   const response = await fetch(`http://localhost:8080/api/storage/files/${id}`, {
//     method: "GET",
//   });
// If the response is 404, throw an error with code NOT_FOUND_CODE.
// Otherwise return await response.blob().
export async function getFileBlob(id) {
  await wait();

  if (!readList(FILES_KEY).some((file) => file.id === id)) {
    throw createNotFoundError("File not found");
  }

  const blob = await loadBlob(id);

  if (!blob) {
    throw createNotFoundError("File contents not found");
  }

  return blob;
}