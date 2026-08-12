"use client";

import { useEffect, useState } from "react";
import { PlusCircle, X } from "lucide-react";
import EventForm from "./Eventform";
import styles from "./EventModal.module.css";

export default function EventModal() {
  const [isOpen, setIsOpen] = useState(false);

  // Close on Escape key
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
        className={`btn btn-primary ${styles.triggerButton}`}
        onClick={() => setIsOpen(true)}
        style={{
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <PlusCircle style={{ width: "1rem", height: "1rem" }} />
        Add Event
      </button>

      {isOpen && (
        <div
          className={styles.overlay}
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
            <EventForm onSuccess={() => setIsOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
