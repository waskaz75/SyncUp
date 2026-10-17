import { useState } from "react";

export const LOGIN_KEY = "syncup_logged_in";
export const SESSION_KEY = "syncup_session_id";
export const USERNAME_KEY = "syncup_username";

export const BACKGROUND_STORAGE_KEY = "syncup_home_background";
export const DEFAULT_BACKGROUND_SRC = "/default-background.svg";

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
    label: "Timer",
    path: "/timer",
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

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-label="Generated background">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7656b7"/>
      <stop offset="50%" stop-color="#d27fc0"/>
      <stop offset="100%" stop-color="#332b50"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#bg)"/>
  <text x="50%" y="50%" text-anchor="middle" fill="#ffffff" font-size="58" font-family="DM Sans, Arial, sans-serif" font-weight="700">${safePrompt}</text>
</svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
