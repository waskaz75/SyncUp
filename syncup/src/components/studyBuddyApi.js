const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export const PROMPT_ERROR_CODE = "BAD_PROMPT";

export async function sendStudyBuddyPrompt(prompt) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api/study-buddy/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ prompt }),
    });
  } catch {
    throw new Error("Could not connect to Study Buddy.");
  }

  const responseText = await response.text();

  let payload = null;

  try {
    payload = JSON.parse(responseText);
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.response) {
    const error = new Error(
      payload?.error || `Study Buddy request failed (HTTP ${response.status}).`
    );

    if (response.status >= 400 && response.status < 500) {
      error.code = PROMPT_ERROR_CODE;
    }

    throw error;
  }

  return payload.response;
}