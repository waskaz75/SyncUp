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
    label: "Comms Channel",
    path: "/comms",
  },
  {
    label: "Storage",
    path: "/storage",
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
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
  const response = await fetch(`${apiBaseUrl}/api/images/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ prompt: prompt.trim() }),
  });

  const payload = await response.json();

  if (!response.ok || !payload.imageUrl) {
    throw new Error(payload.error || "Image generation failed.");
  }

  return payload.imageUrl;
}

export function getImageThemeColor(source) {
  return new Promise((resolve) => {
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const context = canvas.getContext("2d", { willReadFrequently: true });

      if (!context) {
        resolve(null);
        return;
      }

      context.drawImage(image, 0, 0, 1, 1);
      const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
      resolve({ red, green, blue });
    };

    image.onerror = () => resolve(null);
    image.src = source;
  });
}
