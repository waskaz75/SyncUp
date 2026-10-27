const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || ""}/api/profile`;

function getSessionId() {
  const sessionId = localStorage.getItem("syncup_session_id");
  if (!sessionId) {
    throw new Error("You must be logged in to access your profile.");
  }
  return sessionId;
}

function buildUrl() {
  const url = new URL(`${API_BASE_URL}/picture`, window.location.origin);
  url.searchParams.set("sessionId", getSessionId());
  return url.toString();
}

async function getPictureResponse() {
  const response = await fetch(buildUrl());
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error((await response.text()) || "Profile request failed.");
  }
  return response;
}

export async function getProfilePicture() {
  const response = await getPictureResponse();
  if (!response) return "";
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export async function updateProfilePicture(file) {
  const formData = new FormData();
  formData.append("picture", file);
  const response = await fetch(buildUrl(), {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    throw new Error((await response.text()) || "Profile picture update failed.");
  }
  return getProfilePicture();
}
