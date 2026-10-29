import { useEffect, useState } from "react";
import { getProfilePicture } from "./profileApi";

export const PROFILE_PICTURE_CHANGED_EVENT = "syncup:profile-picture-changed";

export function useProfilePicture() {
  const [picture, setPicture] = useState("");

  useEffect(() => {
    let isCancelled = false;

    async function loadPicture() {
      try {
        const saved = await getProfilePicture();

        if (!isCancelled) {
          setPicture(saved);
        }
      } catch (loadError) {
        console.error("Loading profile picture failed:", loadError);
      }
    }

    loadPicture();
    window.addEventListener(PROFILE_PICTURE_CHANGED_EVENT, loadPicture);

    return () => {
      isCancelled = true;
      window.removeEventListener(PROFILE_PICTURE_CHANGED_EVENT, loadPicture);
    };
  }, []);

  return picture;
}