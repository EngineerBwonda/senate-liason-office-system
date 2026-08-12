"use client";

import { useState } from "react";
import { Plus, UploadCloud, X } from "lucide-react";

import { createClient } from "@/utils/supabase/client";
import styles from "./style.module.css";

function buildFilePath(fileName: string) {
  const fileExt = fileName.split(".").pop() ?? "bin";
  return `${crypto.randomUUID()}.${fileExt}`;
}

export default function UploadDocButton() {
  const [open, setOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [uploading, setUploading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const supabase = createClient();

  function resetAndClose() {
    setTitle("");
    setDescription("");
    setFile(null);
    setSubmitError(null);
    setOpen(false);
  }

  // Same two steps as the original inline form: upload the file, then
  // insert the row that points at it. Nothing about this logic changed —
  // it just now lives inside a modal instead of on the page directly.
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    if (!file) {
      setSubmitError("Please choose a file to upload.");
      return;
    }

    setUploading(true);

    const filePath = buildFilePath(file.name);

    const { error: uploadError } = await supabase.storage
      .from("document")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      setSubmitError(uploadError.message);
      setUploading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSubmitError("Please sign in before uploading a document.");
      setUploading(false);
      return;
    }

    const userEmail = user.email || "unknown@gmail.com";

    const { error: insertError } = await supabase.from("boss doc").insert({
      title,
      description,
      file: filePath,
      user_name: userEmail,
    });

    if (insertError) {
      console.error("Error inserting record:", insertError);
      setSubmitError(insertError.message);
      setUploading(false);
      return;
    }

    setUploading(false);
    resetAndClose();

    // No manual refetch needed — the realtime INSERT event in
    // office-doc-client.tsx will add the new record to the list.
  }

  return (
    <>
      <button className={styles.newDocButton} onClick={() => setOpen(true)}>
        <Plus size={16} />
        New Document
      </button>

      {open && (
        <div className={styles.overlay} onClick={resetAndClose}>
          <div
            className={`${styles.modal} ${styles.formModal}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <p className={styles.modalTitle}>Upload a document</p>
              <button
                onClick={resetAndClose}
                className={styles.modalCloseButton}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className={styles.input}
              />
              <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={styles.textarea}
              />
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
                className={styles.fileInput}
              />

              {submitError && <p className={styles.errorText}>{submitError}</p>}

              <button
                type="submit"
                disabled={uploading}
                className={styles.submitButton}
              >
                <UploadCloud size={16} />
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
