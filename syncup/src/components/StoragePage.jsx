import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import StorageFileViewer from "./StorageFileViewer";
import StorageFolderContents from "./StorageFolderContents";
import StorageFolderModal from "./StorageFolderModal";
import StorageSidebar from "./StorageSidebar";
import {
  MAX_UPLOAD_SIZE,
  NOT_FOUND_CODE,
  createFolder,
  getFiles,
  getFolders,
  uploadFile,
} from "./storageApi";

function StoragePage() {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [expandedIds, setExpandedIds] = useState([]);
  const [openFileId, setOpenFileId] = useState(null);

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const headingRef = useRef(null);
  const focusHeadingRef = useRef(false);

  const loadAll = useCallback(async () => {
    try {
      const [loadedFolders, loadedFiles] = await Promise.all([
        getFolders(),
        getFiles(),
      ]);

      setFolders(loadedFolders);
      setFiles(loadedFiles);
    } catch (loadError) {
      console.error("Loading storage failed:", loadError);
      setError("Could not load your storage.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const filesByFolder = useMemo(() => {
    const groups = {};

    files.forEach((file) => {
      if (!groups[file.folderId]) {
        groups[file.folderId] = [];
      }

      groups[file.folderId].push(file);
    });

    Object.keys(groups).forEach((folderId) => {
      groups[folderId].sort((a, b) => a.name.localeCompare(b.name));
    });

    return groups;
  }, [files]);

  const selectedFolder =
    folders.find((folder) => folder.id === selectedFolderId) || null;
  const openFile = files.find((file) => file.id === openFileId) || null;
  const openFileFolder = openFile
    ? folders.find((folder) => folder.id === openFile.folderId)
    : null;
  useEffect(() => {
    if (focusHeadingRef.current) {
      headingRef.current?.focus();
      focusHeadingRef.current = false;
    }
  }, [openFileId]);

  // ---------------- Folders ----------------

  function expandFolder(folderId) {
    setExpandedIds((current) =>
      current.includes(folderId) ? current : [...current, folderId]
    );
  }

  function handleSelectFolder(folderId) {
    setSelectedFolderId(folderId);
    setOpenFileId(null);
    expandFolder(folderId);
  }

  function handleToggleFolder(folderId) {
    setExpandedIds((current) =>
      current.includes(folderId)
        ? current.filter((id) => id !== folderId)
        : [...current, folderId]
    );
  }

  async function handleCreateFolder(name) {
    setError("");

    try {
      const created = await createFolder(name);

      setFolders((current) => [...current, created]);
      handleSelectFolder(created.id);
      setIsFolderModalOpen(false);

      return true;
    } catch (createError) {
      console.error("Creating folder failed:", createError);
      setError("Could not create the folder.");

      return false;
    }
  }

  // ---------------- Files ----------------

  function handleOpenFile(file) {
    if (file.id !== openFileId) {
      focusHeadingRef.current = true;
    }

    setSelectedFolderId(file.folderId);
    expandFolder(file.folderId);
    setOpenFileId(file.id);
  }

  function handleBack() {
    focusHeadingRef.current = true;
    setOpenFileId(null);
  }

  async function handleUpload(folderId, selectedFiles) {
    setError("");
    setIsUploading(true);

    const tooLarge = [];
    const failed = [];

    for (const file of selectedFiles) {
      if (file.size > MAX_UPLOAD_SIZE) {
        tooLarge.push(file.name);
        continue;
      }

      try {
        const saved = await uploadFile(folderId, file);

        setFiles((current) => [...current, saved]);
      } catch (uploadError) {
        if (uploadError?.code === NOT_FOUND_CODE) {
          setError("That folder no longer exists.");
          await loadAll();
          setIsUploading(false);
          return;
        }

        console.error("Uploading file failed:", uploadError);
        failed.push(file.name);
      }
    }

    const messages = [];

    if (tooLarge.length > 0) {
      messages.push(
        `Too large (${MAX_UPLOAD_SIZE / (1024 * 1024)}MB max): ${tooLarge.join(
          ", "
        )}.`
      );
    }

    if (failed.length > 0) {
      messages.push(`Could not upload: ${failed.join(", ")}.`);
    }

    if (messages.length > 0) {
      setError(messages.join(" "));
    }

    setIsUploading(false);
  }

  function renderMain() {
    if (isLoading) {
      return (
        <p className="storage-status" role="status">
          Loading your storage…
        </p>
      );
    }

    if (openFile) {
      return (
        <StorageFileViewer
          key={openFile.id}
          file={openFile}
          folderName={openFileFolder?.name ?? "folder"}
          headingRef={headingRef}
          onBack={handleBack}
        />
      );
    }

    if (selectedFolder) {
      return (
        <StorageFolderContents
          folder={selectedFolder}
          files={filesByFolder[selectedFolder.id] || []}
          isUploading={isUploading}
          headingRef={headingRef}
          onUpload={handleUpload}
          onOpenFile={handleOpenFile}
        />
      );
    }

    if (folders.length === 0) {
      return (
        <p className="storage-status">
          No folders yet. Create a folder to start storing your study
          materials.
        </p>
      );
    }

    return (
      <p className="storage-status">
        Select a folder on the left to see what's inside.
      </p>
    );
  }

  return (
    <section className="storage-page" aria-labelledby="storage-heading">
      <div className="storage-panel">
        {error && (
          <div className="checklist-banner" role="alert">
            <p>{error}</p>

            <button
              type="button"
              className="checklist-banner-dismiss"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        <div className="storage-layout">
          <StorageSidebar
            folders={folders}
            filesByFolder={filesByFolder}
            isLoading={isLoading}
            selectedFolderId={selectedFolderId}
            openFileId={openFileId}
            expandedIds={expandedIds}
            onSelectFolder={handleSelectFolder}
            onToggleFolder={handleToggleFolder}
            onOpenFile={handleOpenFile}
            onNewFolder={() => setIsFolderModalOpen(true)}
          />

          <div className="storage-main">{renderMain()}</div>
        </div>
      </div>

      {isFolderModalOpen && (
        <StorageFolderModal
          folders={folders}
          onSubmit={handleCreateFolder}
          onClose={() => setIsFolderModalOpen(false)}
        />
      )}
    </section>
  );
}

export default StoragePage;