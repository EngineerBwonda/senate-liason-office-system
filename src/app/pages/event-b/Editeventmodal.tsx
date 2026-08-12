"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Pencil, X } from "lucide-react";
import EventForm, { type EditableEvent } from "./Eventform";
import styles from "./EventModal.module.css";
import cardStyles from "./Events.module.css";

export default function EditEventModal({ event }: { event: EditableEvent }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        aria-label="Edit event"
        className={cardStyles.iconButton}
        onClick={() => setIsOpen(true)}
      >
        <Pencil style={{ width: "0.9rem", height: "0.9rem" }} />
      </button>

      {isOpen &&
        createPortal(
          <div
            className={styles.overlay}
            role="dialog"
            aria-modal="true"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsOpen(false);
            }}
          >
            <div className={styles.modalBox}>
              <button
                type="button"
                aria-label="Close"
                className={styles.closeButton}
                onClick={() => setIsOpen(false)}
              >
                <X style={{ width: "1.1rem", height: "1.1rem" }} />
              </button>
              <EventForm event={event} onSuccess={() => setIsOpen(false)} />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
