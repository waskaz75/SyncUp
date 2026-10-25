import { USERNAME_KEY } from "./homePageUtils";

const PROFILE_PICTURE_KEY = "syncup_profile_picture";
const MOCK_DELAY_MS = 300;
const AVATAR_SIZE = 256;

// ------------------------------------------------------------
// Mock helpers (these all disappear when the backend is wired in)
// ------------------------------------------------------------

function wait() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, MOCK_DELAY_MS);
  });
}

function getStorageKey() {
  const username = (localStorage.getItem(USERNAME_KEY) || "").trim();
  return `${PROFILE_PICTURE_KEY}_${username || "guest"}`;
}

function isSafePicture(value) {
  return (
    typeof value === "string" &&
    /^data:image\/(png|jpeg|webp);base64,/.test(value)
  );
}

function resizeToSquareDataUrl(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const side = Math.min(image.naturalWidth, image.naturalHeight);
      const sourceX = (image.naturalWidth - side) / 2;
      const sourceY = (image.naturalHeight - side) / 2;

      const canvas = document.createElement("canvas");
      canvas.width = AVATAR_SIZE;
      canvas.height = AVATAR_SIZE;

      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Canvas is not supported"));
        return;
      }

      context.drawImage(
        image,
        sourceX,
        sourceY,
        side,
        side,
        0,
        0,
        AVATAR_SIZE,
        AVATAR_SIZE
      );

      resolve(canvas.toDataURL("image/webp", 0.9));
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read the image"));
    };

    image.src = objectUrl;
  });
}

// ------------------------------------------------------------
// Public API
// ------------------------------------------------------------

// TODO (Spring Boot): replace the mock below with
//   const response = await fetch("http://localhost:8080/api/profile/picture", {
//     method: "GET",
//   });
// then throw if !response.ok, and return the picture URL
// (return "" when the user has no picture yet).
export async function getProfilePicture() {
  await wait();

  const stored = localStorage.getItem(getStorageKey());

  return isSafePicture(stored) ? stored : "";
}

// TODO (Spring Boot): replace the mock below with
//   const formData = new FormData();
//   formData.append("picture", file);
//   const response = await fetch("http://localhost:8080/api/profile/picture", {
//     method: "POST",
//     body: formData, // do NOT set Content-Type; the browser adds it for files
//   });
// then throw if !response.ok, and return the new picture URL.
export async function updateProfilePicture(file) {
  await wait();

  const pictureUrl = await resizeToSquareDataUrl(file);

  localStorage.setItem(getStorageKey(), pictureUrl);

  return pictureUrl;
}