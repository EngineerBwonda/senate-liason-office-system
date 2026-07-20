// components/ui/ToastContainer.tsx
"use client";

import { useEffect } from "react";
import styles from "../styles/toastcontainer.module.css";

export default function ToastContainer() {
  useEffect(() => {
    const handleShowToast = () => {
      const toastElement = document.getElementById("liveToast");
      if (toastElement) {
        // @ts-expect-error - Bootstrap global
        const bsToast = new bootstrap.Toast(toastElement);
        bsToast.show();
      }
    };

    window.addEventListener("showToast", handleShowToast);
    return () => window.removeEventListener("showToast", handleShowToast);
  }, []);

  return (
    <div className={styles.container}>
      <div
        id="liveToast"
        className={`${styles.toast} toast align-items-center text-white bg-primary border-0`}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        <div className="d-flex">
          <div className="toast-body">
            <i className="bi bi-check-circle-fill me-2"></i>
            Action completed successfully
          </div>
          <button
            type="button"
            className="btn-close btn-close-white me-2 m-auto"
            data-bs-dismiss="toast"
          ></button>
        </div>
      </div>
    </div>
  );
}
