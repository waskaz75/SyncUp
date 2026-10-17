import { useEffect, useRef, useState } from "react";

import {
  ALLOWED_IMAGE_TYPES,
  MAX_BACKGROUND_FILE_SIZE,
} from "./homePageUtils";

function BackgroundUploadButton({
  onBackgroundChange,
}) {
  const inputRef = useRef(null);
  const objectUrlRef = useRef("");

  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  function openFilePicker() {
    inputRef.current?.click();
  }

  function setPreviewFromFile(file) {
    const nextObjectUrl = URL.createObjectURL(file);

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    objectUrlRef.current = nextObjectUrl;
    onBackgroundChange(nextObjectUrl, {
      persist: false,
    });

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        onBackgroundChange(reader.result, {
          persist: true,
        });
      }

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = "";
      }
    };

    reader.readAsDataURL(file);
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Please upload a PNG, JPG, or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_BACKGROUND_FILE_SIZE) {
      setError("Image must be 5MB or smaller.");
      event.target.value = "";
      return;
    }

    setError("");
    setPreviewFromFile(file);
    event.target.value = "";
  }

  return (
    <div className="background-upload-wrap">
      {error && (
        <p className="background-upload-error" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        className="floating-button background-upload-button"
        aria-label="Change background"
        onClick={openFilePicker}
      >
        <span aria-hidden="true">✎</span>
        <span>Change background</span>
      </button>

      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
      />
    </div>
  );
}

export default BackgroundUploadButton;
