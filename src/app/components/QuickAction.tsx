// components/dashboard/QuickActions.tsx
"use client";

import Link from "next/link";
import styles from "../styles/quickaction.module.css";

export default function QuickActions() {
  const actions = [
    { icon: "bi-journal-plus", label: "Receive Minutes" },
    { icon: "bi-upload", label: "Upload Report" },
    { icon: "bi-envelope-paper", label: "View Corresp." },
    { icon: "bi-chat", label: "Open Chat" },
    { icon: "bi-calendar-plus", label: "Schedule Meeting" },
    { icon: "bi-images", label: "View Gallery" },
  ];

  return (
    <div className={styles.grid}>
      {actions.map((action, index) => (
        <div key={index} className={styles.col}>
          <Link
            href="#"
            className={styles.actionBtn}
            onClick={(e) => {
              e.preventDefault();
              window.dispatchEvent(new CustomEvent("showToast"));
            }}
          >
            <i className={`${action.icon} ${styles.actionIcon}`}></i>
            <small>{action.label}</small>
          </Link>
        </div>
      ))}
    </div>
  );
}
