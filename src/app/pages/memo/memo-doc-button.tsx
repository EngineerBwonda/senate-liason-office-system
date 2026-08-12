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
  const [fileName, setFileName] = useState("");

  const [uploading, setUploading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const supabase = createClient();

  function resetAndClose() {
    setTitle("");
    setDescription("");
    setFile(null);
    setFileName("");
    setSubmitError(null);
    setOpen(false);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    setFile(selectedFile);
    setFileName(selectedFile?.name ?? "");
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

    const { error: insertError } = await supabase.from("boss doc").insert({
      title,
      description,
      file: filePath,
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
        <div
          className={styles.overlay}
          onClick={() => {
            if (!uploading) resetAndClose();
          }}
        >
          <div
            className={`${styles.modal} ${styles.formModal}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <p className={styles.modalTitle}>Upload a document</p>
              <button
                type="button"
                onClick={resetAndClose}
                className={styles.modalCloseButton}
                disabled={uploading}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="memo-title">
                  Title
                </label>
                <input
                  id="memo-title"
                  type="text"
                  placeholder="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="memo-description">
                  Description
                </label>
                <textarea
                  id="memo-description"
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={styles.textarea}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="memo-file">
                  File
                </label>
                <div className={styles.fileUploadArea}>
                  <input
                    id="memo-file"
                    type="file"
                    onChange={handleFileChange}
                    required
                    className={styles.fileInput}
                    disabled={uploading}
                  />
                  <div className={styles.fileDropZone}>
                    {fileName ? (
                      <div className={styles.fileSelected}>
                        <UploadCloud
                          size={18}
                          className={styles.fileSelectedIcon}
                        />
                        <span className={styles.fileSelectedName}>
                          {fileName}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setFile(null);
                            setFileName("");
                          }}
                          className={styles.fileRemove}
                          disabled={uploading}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <UploadCloud size={28} className={styles.uploadIcon} />
                        <p className={styles.uploadText}>
                          Drag and drop or{" "}
                          <span className={styles.uploadLink}>browse</span>
                        </p>
                        <p className={styles.uploadHint}>
                          Select one file to upload
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {submitError && (
                <div className={styles.errorMessage}>{submitError}</div>
              )}

              <button
                type="submit"
                disabled={uploading || !file}
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
