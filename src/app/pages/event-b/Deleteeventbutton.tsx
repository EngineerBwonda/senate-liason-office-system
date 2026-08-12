"use client";

import { useState, useTransition } from "react";
import { Trash2, Check, X } from "lucide-react";
import { deleteEvent } from "./Action";
import styles from "./Events.module.css";

export default function DeleteEventButton({ eventId }: { eventId: string }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteEvent(eventId);
      if (result?.error) {
        setError(result.error);
        setIsConfirming(false);
      }
      // on success the row disappears via revalidatePath, nothing else to do
    });
  }

  if (isConfirming) {
    return (
      <div className={styles.confirmRow}>
        <span className={styles.confirmLabel}>Delete?</span>
        <button
          type="button"
          aria-label="Confirm delete"
          className={`${styles.iconButton} ${styles.iconButtonDanger}`}
          onClick={handleDelete}
          disabled={isPending}
        >
          {isPending ? (
            <span
              className="spinner-border spinner-border-sm"
              role="status"
              aria-hidden="true"
              style={{ width: "0.8rem", height: "0.8rem" }}
            ></span>
          ) : (
            <Check style={{ width: "0.9rem", height: "0.9rem" }} />
          )}
        </button>
        <button
          type="button"
          aria-label="Cancel delete"
          className={styles.iconButton}
          onClick={() => setIsConfirming(false)}
          disabled={isPending}
        >
          <X style={{ width: "0.9rem", height: "0.9rem" }} />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        aria-label="Delete event"
        className={`${styles.iconButton} ${styles.iconButtonDanger}`}
        onClick={() => setIsConfirming(true)}
      >
        <Trash2 style={{ width: "0.9rem", height: "0.9rem" }} />
      </button>
      {error && <div className={styles.deleteError}>{error}</div>}
    </>
  );
}
