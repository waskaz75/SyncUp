function StorageSidebar({
  folders,
  filesByFolder,
  isLoading,
  selectedFolderId,
  openFileId,
  expandedIds,
  onSelectFolder,
  onToggleFolder,
  onOpenFile,
  onNewFolder,
}) {
  return (
    <aside className="storage-sidebar" aria-labelledby="storage-sidebar-title">
      <div className="storage-sidebar-header">
        <h2 id="storage-sidebar-title">Folders</h2>

        <button
          type="button"
          className="checklist-button storage-new-folder"
          onClick={onNewFolder}
        >
          + New folder
        </button>
      </div>

      {!isLoading && folders.length === 0 && (
        <p className="storage-sidebar-note">No folders yet.</p>
      )}

      <ul className="storage-folder-list">
        {folders.map((folder) => {
          const folderFiles = filesByFolder[folder.id] || [];
          const isExpanded = expandedIds.includes(folder.id);
          const isSelected = folder.id === selectedFolderId;
          const listId = `storage-folder-files-${folder.id}`;

          return (
            <li key={folder.id}>
              <div
                className={`storage-folder-row ${isSelected ? "selected" : ""}`}
              >
                <button
                  type="button"
                  className="storage-chevron-button"
                  aria-expanded={isExpanded}
                  aria-controls={isExpanded ? listId : undefined}
                  aria-label={`${isExpanded ? "Collapse" : "Expand"} folder ${
                    folder.name
                  }`}
                  onClick={() => onToggleFolder(folder.id)}
                >
                  <span
                    className={`storage-chevron ${isExpanded ? "open" : ""}`}
                    aria-hidden="true"
                  >
                    ›
                  </span>
                </button>

                <button
                  type="button"
                  className="storage-folder-button"
                  aria-current={isSelected ? "true" : undefined}
                  onClick={() => onSelectFolder(folder.id)}
                >
                  <span className="storage-folder-name">{folder.name}</span>
                  <span className="storage-folder-count">
                    {folderFiles.length}
                  </span>
                </button>
              </div>

              {isExpanded && (
                <ul id={listId} className="storage-file-list">
                  {folderFiles.length === 0 ? (
                    <li className="storage-sidebar-note">Empty</li>
                  ) : (
                    folderFiles.map((file) => (
                      <li key={file.id}>
                        <button
                          type="button"
                          className={`storage-file-link ${
                            file.id === openFileId ? "open" : ""
                          }`}
                          aria-current={
                            file.id === openFileId ? "true" : undefined
                          }
                          title={file.name}
                          onClick={() => onOpenFile(file)}
                        >
                          {file.name}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

export default StorageSidebar;