import { useEffect, useState } from "react";

import { getFileBlob } from "./storageApi";
import { getPreview } from "./storageUtils";

const MAX_TEXT_CHARS = 200000;

function StorageFileViewer({
  file,
  folderName,
  headingRef,
  onBack,
  hasSelection,
  onDeleteSelected,
}) {
  const [status, setStatus] = useState("loading");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [isTruncated, setIsTruncated] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const preview = getPreview(file);

  useEffect(() => {
    let isCancelled = false;
    let objectUrl = "";

    async function loadFile() {
      try {
        const blob = await getFileBlob(file.id);
        const shown = getPreview(file);
        const typedBlob = shown.mime
          ? new Blob([blob], { type: shown.mime })
          : blob;

        let content = "";

        if (shown.kind === "text") {
          content = await typedBlob.text();
        }

        if (isCancelled) {
          return;
        }

        objectUrl = URL.createObjectURL(typedBlob);

        setUrl(objectUrl);
        setText(content.slice(0, MAX_TEXT_CHARS));
        setIsTruncated(content.length > MAX_TEXT_CHARS);
        setStatus("ready");
      } catch (loadError) {
        if (!isCancelled) {
          console.error("Opening file failed:", loadError);
          setErrorMessage(loadError.message);
          setStatus("error");
        }
      }
    }

    loadFile();

    return () => {
      isCancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [file]);

  function renderBody() {
    if (status === "loading") {
      return (
        <p className="storage-status" role="status">
          Opening file…
        </p>
      );
    }

    if (status === "error") {
      return (
        <p className="storage-status" role="alert">
          {errorMessage || "Could not open this file. Go back and try again."}
        </p>
      );
    }

    switch (preview.kind) {
      case "image":
        return (
          <img src={url} alt={file.name} className="storage-viewer-image" />
        );

      case "pdf":
        return (
          <iframe
            src={url}
            title={file.name}
            className="storage-viewer-frame"
          />
        );

      case "text":
        return (
          <>
            <pre
              className="storage-viewer-text"
              tabIndex={0}
              aria-label={`Contents of ${file.name}`}
            >
              {text}
            </pre>

            {isTruncated && (
              <p className="storage-viewer-note">
                Showing the first {MAX_TEXT_CHARS.toLocaleString()} characters.
                Download the file to read all of it.
              </p>
            )}
          </>
        );

      case "audio":
        return <audio src={url} controls className="storage-viewer-media" />;

      case "video":
        return (
          <video
            src={url}
            controls
            className="storage-viewer-image"
            aria-label={file.name}
          />
        );

      default:
        return (
          <p className="storage-status">
            This file type can't be previewed here. Use Download to open it on
            your device.
          </p>
        );
    }
  }

  return (
    <section className="storage-viewer" aria-labelledby="storage-viewer-title">
      <div className="storage-viewer-top">
        <button
          type="button"
          className="checklist-button checklist-button-secondary"
          onClick={onBack}
        >
          {`← Back to ${folderName}`}
        </button>

        {status === "ready" && !hasSelection && (
          <a
            className="checklist-button storage-download"
            href={url}
            download={file.name}
          >
            Download
          </a>
        )}
        {hasSelection && (
          <button
            type="button"
            className="checklist-button storage-trash-button"
            onClick={onDeleteSelected}
            aria-label="Delete selected items"
            title="Delete selected items"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 6h18" />
              <path d="M8 6V4h8v2" />
              <path d="m19 6-1 14H6L5 6" />
              <path d="M10 11v5M14 11v5" />
            </svg>
            Delete
          </button>
        )}
      </div>

      <h2
        id="storage-viewer-title"
        className="storage-viewer-title"
        ref={headingRef}
        tabIndex={-1}
      >
        {file.name}
      </h2>

      <div className="storage-viewer-body">{renderBody()}</div>
    </section>
  );
}

export default StorageFileViewer;