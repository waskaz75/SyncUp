import { useState } from "react";

export const LOGIN_KEY = "syncup_logged_in";
export const SESSION_KEY = "syncup_session_id";
export const USERNAME_KEY = "syncup_username";

export const BACKGROUND_STORAGE_KEY = "syncup_home_background";
export const DEFAULT_BACKGROUND_SRC = "/default2-bg.jpg";

export const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
];

export const MAX_BACKGROUND_FILE_SIZE = 5 * 1024 * 1024;

export const HOME_ROUTES = [
  {
    label: "Home",
    path: "/",
  },
  {
    label: "Checklist",
    path: "/checklist",
  },
  {
    label: "Calendar",
    path: "/calendar",
  },
  {
    label: "Timer",
    path: "/timer",
  },
  {
    label: "Study Buddy AI",
    path: "/study-buddy",
  },
  {
    label: "Comms Channel",
    path: "/comms",
  },
];

export function normalizeRoute(pathname) {
  if (!pathname || pathname === "") {
    return "/";
  }

  return pathname.endsWith("/") && pathname !== "/"
    ? pathname.slice(0, -1)
    : pathname;
}

export function routeExists(pathname) {
  return HOME_ROUTES.some((route) => route.path === pathname);
}

export function sanitizeBackgroundSource(source) {
  if (typeof source !== "string") {
    return DEFAULT_BACKGROUND_SRC;
  }

  const value = source.trim();

  if (!value) {
    return DEFAULT_BACKGROUND_SRC;
  }

  if (value.startsWith("/") || value.startsWith("blob:")) {
    return value;
  }

  if (
    value.startsWith("data:image/png") ||
    value.startsWith("data:image/jpeg") ||
    value.startsWith("data:image/webp")
  ) {
    return value;
  }

  return DEFAULT_BACKGROUND_SRC;
}

export function useUser() {
  const [user] = useState(() => {
    const storedUser = localStorage.getItem(USERNAME_KEY);

    if (storedUser && storedUser.trim()) {
      return storedUser.trim();
    }
    return "Guest";
  });

  return user;
}

export async function generateBackgroundImage(prompt) {
  // TODO: Replace with backend image generation integration.
  await new Promise((resolve) => {
    window.setTimeout(resolve, 900);
  });

  const safePrompt = prompt.slice(0, 42);
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 900;

  const context = canvas.getContext("2d");
  if (!context) {
    return DEFAULT_BACKGROUND_SRC;
  }

  const gradient = context.createLinearGradient(0, 0, 1600, 900);
  gradient.addColorStop(0, "#7656b7");
  gradient.addColorStop(0.5, "#d27fc0");
  gradient.addColorStop(1, "#332b50");

  context.fillStyle = gradient;
  context.fillRect(0, 0, 1600, 900);

  context.fillStyle = "rgba(255, 255, 255, 0.22)";
  context.beginPath();
  context.arc(220, 150, 180, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#ffffff";
  context.font = "700 60px DM Sans, sans-serif";
  context.textAlign = "center";
  context.fillText(safePrompt, 800, 470);

  return canvas.toDataURL("image/png");
}
