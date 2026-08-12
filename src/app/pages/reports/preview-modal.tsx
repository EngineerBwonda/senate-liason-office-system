"use client";

import { X } from "lucide-react";
import styles from "./style.module.css";

export default function PreviewModal({
  url,
  title,
  onClose,
}: {
  url: string;
  title: string;
  onClose: () => void;
}) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <p className={styles.modalTitle}>{title}</p>
          <button onClick={onClose} className={styles.modalCloseButton}>
            <X size={18} />
          </button>
        </div>

        {/* Works well for PDFs and images. Some file types (e.g. .docx)
            may not render inline and will just show a download prompt —
            that's a browser limitation, not a bug in this code. */}
        <iframe src={url} className={styles.modalFrame} title={title} />
      </div>
    </div>
  );
}
