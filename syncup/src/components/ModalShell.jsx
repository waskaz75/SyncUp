import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE_SELECTOR =
  "button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])";

function ModalShell({ labelledBy, className = "", onClose, children }) {
  const dialogRef = useRef(null);

  const [trigger] = useState(() => document.activeElement);

  useEffect(() => {
    return () => {
      if (trigger instanceof HTMLElement && trigger.isConnected) {
        trigger.focus();
      } else {
        document.getElementById("calendar-heading")?.focus();
      }
    };
  }, [trigger]);

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusable = dialogRef.current?.querySelectorAll(FOCUSABLE_SELECTOR);

    if (!focusable || focusable.length === 0) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return createPortal(
    <div className="checklist-modal-backdrop">
      <div
        ref={dialogRef}
        className={`checklist-modal calendar-modal ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onKeyDown={handleKeyDown}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

export default ModalShell;