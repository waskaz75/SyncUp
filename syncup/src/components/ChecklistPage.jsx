import { useCallback, useEffect, useState } from "react";

import ChecklistItem from "./ChecklistItem";
import ChecklistModal from "./ChecklistModal";
import {
  NOT_FOUND_CODE,
  createItem,
  deleteItem,
  getItems,
  updateItem,
} from "./checklistApi";

function ChecklistPage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // null, { mode: "create" }, or { mode: "edit", item }
  const [modal, setModal] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const loadItems = useCallback(async () => {
    try {
      setItems(await getItems());
    } catch (loadError) {
      console.error("Loading checklist failed:", loadError);
      setError("Could not load your checklist.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // One place decides what error message to show.
  async function handleApiError(apiError, fallbackMessage) {
    if (apiError?.code === NOT_FOUND_CODE) {
      setError("That item no longer exists.");
      await loadItems();
      return;
    }

    console.error(fallbackMessage, apiError);
    setError(fallbackMessage);
  }

  // ---------------- Create / Edit (shared modal) ----------------

  // Returns true when saved (modal closes), false when it failed
  // (modal stays open so the typed text is kept).
  async function handleModalSubmit(text) {
    setError("");

    try {
      if (modal.mode === "create") {
        const created = await createItem(text);

        setItems((current) => [...current, created]);
      } else {
        const targetId = modal.item.id;
        const updated = await updateItem(targetId, { text });

        setItems((current) =>
          current.map((item) => (item.id === targetId ? updated : item))
        );
      }

      setModal(null);
      return true;
    } catch (saveError) {
      if (saveError?.code === NOT_FOUND_CODE) {
        setModal(null);
        await handleApiError(saveError, "Could not save your changes.");
        return true;
      }

      console.error("Saving item failed:", saveError);
      setError("Could not save your changes.");
      return false;
    }
  }

  // ---------------- Tick off ----------------

  async function handleToggle(item) {
    const completed = !item.completed;

    setError("");

    // Optimistic: update the screen first.
    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id ? { ...entry, completed } : entry
      )
    );

    try {
      await updateItem(item.id, { completed });
    } catch (toggleError) {
      // Undo the optimistic change.
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? { ...entry, completed: item.completed }
            : entry
        )
      );

      await handleApiError(toggleError, "Could not update that item.");
    }
  }

  // ---------------- Delete ----------------

  async function handleConfirmDelete(item) {
    setError("");

    try {
      await deleteItem(item.id);

      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setPendingDeleteId(null);
    } catch (deleteError) {
      setPendingDeleteId(null);
      await handleApiError(deleteError, "Could not delete that item.");
    }
  }

  // ---------------- Render ----------------

  function renderList() {
    if (isLoading) {
      return (
        <p className="checklist-status" role="status">
          Loading your checklist…
        </p>
      );
    }

    if (items.length === 0) {
      return (
        <p className="checklist-status">
          Nothing here yet. Add your first item.
        </p>
      );
    }

    return (
      <ul className="checklist-list">
        {items.map((item) => (
          <ChecklistItem
            key={item.id}
            item={item}
            isConfirmingDelete={pendingDeleteId === item.id}
            onToggle={handleToggle}
            onEdit={(selected) => setModal({ mode: "edit", item: selected })}
            onRequestDelete={(selected) => setPendingDeleteId(selected.id)}
            onCancelDelete={() => setPendingDeleteId(null)}
            onConfirmDelete={handleConfirmDelete}
          />
        ))}
      </ul>
    );
  }

  return (
    <section className="checklist-page" aria-labelledby="checklist-heading">
      <div className="checklist-panel">
        <header className="checklist-header">
          <h1 id="checklist-heading">Checklist</h1>

          <button
            type="button"
            className="checklist-button"
            onClick={() => setModal({ mode: "create" })}
          >
            + Add item
          </button>
        </header>

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

        <div className="checklist-list-wrap">{renderList()}</div>
      </div>

      {modal && (
        <ChecklistModal
          mode={modal.mode}
          initialText={modal.mode === "edit" ? modal.item.text : ""}
          onSubmit={handleModalSubmit}
          onClose={() => setModal(null)}
        />
      )}
    </section>
  );
}

export default ChecklistPage;