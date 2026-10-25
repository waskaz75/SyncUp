import { useEffect, useRef, useState } from "react";

import { ALLOWED_IMAGE_TYPES, useUser } from "./homePageUtils";
import { getProfilePicture, updateProfilePicture } from "./profileApi";

const MAX_PROFILE_FILE_SIZE = 5 * 1024 * 1024;

function PencilIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

// Shows the picture, or a colored circle with the first letter.
function Avatar({ picture, username, alt = "", large = false }) {
  const className = `profile-avatar ${large ? "large" : ""}`;

  if (picture) {
    return <img src={picture} alt={alt} className={className} />;
  }

  return (
    <span
      className={`${className} profile-avatar-fallback`}
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : "true"}
    >
      {username.charAt(0).toUpperCase()}
    </span>
  );
}

function ProfileMenu({ onLogout }) {
  const username = useUser();

  const menuRef = useRef(null);
  const toggleRef = useRef(null);
  const closeRef = useRef(null);
  const inputRef = useRef(null);
  const wasOpenRef = useRef(false);
  const restoreFocusRef = useRef(false);

  const [isOpen, setIsOpen] = useState(false);
  const [picture, setPicture] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  // Load the saved picture once.
  useEffect(() => {
    let isCancelled = false;

    async function loadPicture() {
      try {
        const savedPicture = await getProfilePicture();

        if (!isCancelled) {
          setPicture(savedPicture);
        }
      } catch (loadError) {
        // Not fatal: the letter avatar is shown instead.
        console.error("Loading profile picture failed:", loadError);
      }
    }

    loadPicture();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Focus management. The small avatar disappears while the menu is open,
  // so keyboard focus moves to the close button, and comes back afterwards.
  useEffect(() => {
    if (isOpen) {
      closeRef.current?.focus();
    } else if (wasOpenRef.current && restoreFocusRef.current) {
      toggleRef.current?.focus();
    }

    wasOpenRef.current = isOpen;
  }, [isOpen]);

  function openMenu() {
    setError("");
    setIsOpen(true);
  }

  // restoreFocus = true for Escape and the × button (keyboard-style closes).
  function closeMenu(restoreFocus) {
    restoreFocusRef.current = restoreFocus;
    setIsOpen(false);
  }

  // While open: close on Escape or on a click outside the menu.
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        restoreFocusRef.current = false;
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        restoreFocusRef.current = true;
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function openFilePicker() {
    if (!isUploading) {
      inputRef.current?.click();
    }
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];

    // Reset so choosing the same file again still triggers onChange.
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Please choose a PNG, JPG, or WEBP image.");
      return;
    }

    if (file.size > MAX_PROFILE_FILE_SIZE) {
      setError("Image must be 5MB or smaller.");
      return;
    }

    setError("");
    setIsUploading(true);

    try {
      setPicture(await updateProfilePicture(file));
    } catch (uploadError) {
      console.error("Updating profile picture failed:", uploadError);
      setError("Could not update your picture. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div ref={menuRef} className={`profile-menu ${isOpen ? "open" : ""}`}>
      {!isOpen && (
        <button
          ref={toggleRef}
          type="button"
          className="profile-toggle"
          aria-label="Open profile menu"
          aria-expanded="false"
          onClick={openMenu}
        >
          <Avatar picture={picture} username={username} />
        </button>
      )}

      {isOpen && (
        <section
          id="profile-card"
          className="profile-card"
          aria-labelledby="profile-card-title"
        >
          <div className="profile-card-header">
            <h2 id="profile-card-title" className="profile-card-title">
              Profile
            </h2>

            <button
              ref={closeRef}
              type="button"
              className="profile-close"
              onClick={() => closeMenu(true)}
              aria-label="Close profile menu"
            >
              ×
            </button>
          </div>

          <div className="profile-picture-wrap">
            <Avatar
              picture={picture}
              username={username}
              alt={`${username}'s profile picture`}
              large
            />

            <button
              type="button"
              className="profile-edit-button"
              onClick={openFilePicker}
              aria-label="Change profile picture"
              aria-disabled={isUploading}
            >
              <PencilIcon />
            </button>
          </div>

          {isUploading && (
            <p className="profile-message" role="status">
              Saving picture…
            </p>
          )}

          {error && (
            <p className="profile-message" role="alert">
              {error}
            </p>
          )}

          <p className="profile-username">{username}</p>

          <button
            type="button"
            className="checklist-button checklist-button-secondary profile-signout"
            onClick={onLogout}
          >
            Sign out
          </button>

          <input
            ref={inputRef}
            className="visually-hidden"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            tabIndex={-1}
            onChange={handleFileChange}
          />
        </section>
      )}
    </div>
  );
}

export default ProfileMenu;