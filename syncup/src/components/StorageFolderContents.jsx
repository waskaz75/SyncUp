import { useRef } from "react";

import { formatFileSize, getTypeLabel } from "./storageUtils";

function StorageFolderContents({
  folder,
  files,
  isUploading,
  headingRef,
  onUpload,
  onOpenFile,
  selectedFileIds,
  onToggleFileSelection,
  hasSelection,
  onDeleteSelected,
}) {
  const inputRef = useRef(null);

  function openFilePicker() {
    if (!isUploading) {
      inputRef.current?.click();
    }
  }

  function handleFileChange(event) {
    const selected = Array.from(event.target.files || []);

    event.target.value = "";

    if (selected.length > 0) {
      onUpload(folder.id, selected);
    }
  }

  return (
    <section className="storage-content" aria-labelledby="storage-folder-title">
      <header className="storage-content-header">
        <h2 id="storage-folder-title" ref={headingRef} tabIndex={-1}>
          {folder.name}
        </h2>

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
        {!hasSelection && (
          <button
            type="button"
            className="checklist-button"
            onClick={openFilePicker}
            aria-disabled={isUploading}
          >
            {isUploading ? "Uploading…" : "Upload files"}
          </button>
        )}
        <input
          ref={inputRef}
          className="visually-hidden"
          type="file"
          multiple
          tabIndex={-1}
          onChange={handleFileChange}
        />
      </header>

      {files.length === 0 ? (
        <p className="storage-status">
          This folder is empty. Upload your first file.
        </p>
      ) : (
        <ul className="storage-file-rows">
          {files.map((file) => (
            <li key={file.id}>
              <input
                type="checkbox"
                className="storage-selection-checkbox"
                checked={selectedFileIds.includes(file.id)}
                onChange={() => onToggleFileSelection(file.id)}
                aria-label={`Select file ${file.name}`}
              />
              <button
                type="button"
                className="storage-file-row"
                onClick={() => onOpenFile(file)}
              >
                <span className="storage-file-row-name">{file.name}</span>

                <span className="storage-file-row-meta">
                  {`${getTypeLabel(file)} · ${formatFileSize(file.size)}`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default StorageFolderContents;