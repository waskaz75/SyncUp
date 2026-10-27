const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || ""}/api/files`;

export const MAX_UPLOAD_SIZE = 20 * 1024 * 1024;
export const NOT_FOUND_CODE = "NOT_FOUND";

function getSessionId() {
  const sessionId = localStorage.getItem("syncup_session_id");
  if (!sessionId) {
    throw new Error("You must be logged in to access your storage.");
  }
  return sessionId;
}

function buildUrl(path = "") {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);
  url.searchParams.set("sessionId", getSessionId());
  return url.toString();
}

async function handleResponse(response) {
  if (response.ok) return;
  const message = await response.text();
  const error = new Error(message || "Storage request failed.");
  if (response.status === 404) error.code = NOT_FOUND_CODE;
  throw error;
}

function convertFolder(folder) {
  return { id: folder.folderId, name: folder.folderName };
}

function convertFile(file) {
  return {
    id: file.fileId,
    folderId: file.folderId,
    name: file.fileName,
    type: file.fileType || "application/octet-stream",
    size: file.fileSize,
    uploadedAt: file.uploadedAt,
  };
}

export async function getFolders() {
  const response = await fetch(buildUrl("/folders"));
  await handleResponse(response);
  return (await response.json()).map(convertFolder);
}

export async function createFolder(name) {
  const response = await fetch(buildUrl("/folders"), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ name: name.trim() }),
  });
  await handleResponse(response);
  return convertFolder(await response.json());
}

export async function getFiles() {
  const response = await fetch(buildUrl());
  await handleResponse(response);
  return (await response.json()).map(convertFile);
}

export async function uploadFile(folderId, file) {
  const formData = new FormData();
  formData.append("file", file);
  const url = new URL(buildUrl("/upload"));
  if (folderId) url.searchParams.set("folderId", folderId);
  const response = await fetch(url, { method: "POST", body: formData });
  await handleResponse(response);
  return convertFile(await response.json());
}

export async function getFileBlob(id) {
  const response = await fetch(buildUrl(`/${id}/download`));
  await handleResponse(response);
  return response.blob();
}

export async function deleteFile(id) {
  const response = await fetch(buildUrl(`/${id}`), { method: "DELETE" });
  await handleResponse(response);
}

export async function deleteFolder(id) {
  const response = await fetch(buildUrl(`/folders/${id}`), {
    method: "DELETE",
  });
  await handleResponse(response);
}
