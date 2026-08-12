"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import type { AlbumRow, PhotoRow } from "./supabase-client";
import type { User } from "@supabase/supabase-js";
import styles from "./styles.module.css";

type Props = {
  albums: AlbumRow[];
  onClose: () => void;
  onUploaded: (photo: PhotoRow) => void;
  onAlbumCreated: (album: AlbumRow) => void;
};

type Mode = "files" | "links";

export default function UploadModal({
  albums,
  onClose,
  onUploaded,
  onAlbumCreated,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = useMemo(() => createClient(), []);

  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [mode, setMode] = useState<Mode>("files");
  const [files, setFiles] = useState<File[]>([]);
  const [linksText, setLinksText] = useState("");

  const [albumId, setAlbumId] = useState<string>(albums[0]?.id ?? "");
  const [creatingAlbum, setCreatingAlbum] = useState(albums.length === 0);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [newAlbumDescription, setNewAlbumDescription] = useState("");

  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        setUser(null);
      } else {
        setUser(data.user ?? null);
      }
      setCheckingAuth(false);
    });
  }, [supabase]);

  function uploaderName(): string {
    if (!user) return "Unknown";
    return (
      (user.user_metadata?.full_name as string | undefined) ||
      (user.user_metadata?.name as string | undefined) ||
      user.email ||
      "Unknown"
    );
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(e.target.files ?? []));
  }

  function parsedLinks(): string[] {
    return linksText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  }

  async function ensureAlbumId(): Promise<string | null> {
    if (!creatingAlbum) return albumId || null;

    const trimmed = newAlbumName.trim();
    if (!trimmed) {
      setError("Give the new album a name.");
      return null;
    }

    const slug = trimmed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const { data, error: insertError } = await supabase
      .from("albums")
      .insert({
        name: trimmed,
        slug,
        description: newAlbumDescription.trim() || null,
        created_by: user?.id ?? null,
      })
      .select()
      .single();

    if (insertError || !data) {
      setError("Couldn't create that album. Try a different name.");
      return null;
    }

    onAlbumCreated(data as AlbumRow);
    return (data as AlbumRow).id;
  }

  async function handleUpload() {
    setError(null);

    if (!user) {
      setError("You need to be signed in to upload.");
      return;
    }

    const items = mode === "files" ? files : parsedLinks();
    if (items.length === 0) {
      setError(
        mode === "files"
          ? "Choose at least one photo."
          : "Paste at least one image link.",
      );
      return;
    }

    const resolvedAlbumId = await ensureAlbumId();
    if (!resolvedAlbumId) return;

    setUploading(true);
    setProgress({ done: 0, total: items.length });

    const name = uploaderName();

    if (mode === "files") {
      for (const file of files) {
        const fileExt = file.name.split(".").pop();
        const safeName = `${crypto.randomUUID()}.${fileExt}`;
        const storagePath = `${resolvedAlbumId}/${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from("gallery-photos")
          .upload(storagePath, file, { cacheControl: "3600", upsert: false });

        if (uploadError) {
          setError(`Failed to upload ${file.name}: ${uploadError.message}`);
          continue;
        }

        const { data: publicUrlData } = supabase.storage
          .from("gallery-photos")
          .getPublicUrl(storagePath);

        await insertPhotoRow(
          resolvedAlbumId,
          publicUrlData.publicUrl,
          storagePath,
          name,
        );
      }
    } else {
      for (const link of parsedLinks()) {
        await insertPhotoRow(resolvedAlbumId, link, null, name);
      }
    }

    setUploading(false);
  }

  async function insertPhotoRow(
    resolvedAlbumId: string,
    url: string,
    storagePath: string | null,
    name: string,
  ) {
    const { data: photoRow, error: insertError } = await supabase
      .from("photos")
      .insert({
        album_id: resolvedAlbumId,
        storage_path: storagePath,
        url,
        caption: caption.trim() || null,
        uploaded_by: user?.id ?? null,
        uploaded_by_name: name,
      })
      .select()
      .single();

    if (insertError || !photoRow) {
      setError("A photo couldn't be saved. Try again.");
      return;
    }

    onUploaded(photoRow as PhotoRow);
    setProgress((prev) => ({ ...prev, done: prev.done + 1 }));
  }

  return (
    <motion.div
      className={styles.modalBackdrop}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={styles.modal}
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h2>Upload photos</h2>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            type="button"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          {checkingAuth ? (
            <p className={styles.progressText}>Checking your session…</p>
          ) : !user ? (
            <p className={styles.errorText}>
              You need to be signed in to upload photos. Log in and try again.
            </p>
          ) : (
            <>
              <p className={styles.signedInAs}>
                Uploading as <strong>{uploaderName()}</strong>
              </p>

              <label className={styles.fieldLabel}>Album</label>
              {!creatingAlbum ? (
                <div className="d-flex gap-2 mb-3">
                  <select
                    className={styles.select}
                    value={albumId}
                    onChange={(e) => setAlbumId(e.target.value)}
                  >
                    {albums.map((album) => (
                      <option key={album.id} value={album.id}>
                        {album.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className={styles.newAlbumBtn}
                    onClick={() => setCreatingAlbum(true)}
                  >
                    New album
                  </button>
                </div>
              ) : (
                <div className="mb-3">
                  <div className="d-flex gap-2 mb-2">
                    <input
                      className={styles.select}
                      placeholder="Album name, e.g. Bushcraft Weekend 2026"
                      value={newAlbumName}
                      onChange={(e) => setNewAlbumName(e.target.value)}
                      autoFocus
                    />
                    {albums.length > 0 && (
                      <button
                        type="button"
                        className={styles.newAlbumBtn}
                        onClick={() => setCreatingAlbum(false)}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                  <textarea
                    className={styles.select}
                    style={{ width: "100%", minHeight: 64, resize: "vertical" }}
                    placeholder="Album description (optional)"
                    value={newAlbumDescription}
                    onChange={(e) => setNewAlbumDescription(e.target.value)}
                  />
                </div>
              )}

              <label className={styles.fieldLabel}>Photos</label>
              <div className={styles.modeToggle}>
                <button
                  type="button"
                  className={`${styles.modeBtn} ${mode === "files" ? styles.modeBtnActive : ""}`}
                  onClick={() => setMode("files")}
                >
                  Upload files
                </button>
                <button
                  type="button"
                  className={`${styles.modeBtn} ${mode === "links" ? styles.modeBtnActive : ""}`}
                  onClick={() => setMode("links")}
                >
                  Paste image link
                </button>
              </div>

              {mode === "files" ? (
                <div
                  className={styles.dropzone}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {files.length === 0 ? (
                    <span>Click to choose photos, or drag them here</span>
                  ) : (
                    <span>
                      {files.length} photo{files.length > 1 ? "s" : ""} selected
                    </span>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={handleFileSelect}
                  />
                </div>
              ) : (
                <textarea
                  className={styles.select}
                  style={{ width: "100%", minHeight: 84, resize: "vertical" }}
                  placeholder={
                    "Paste one or more image URLs, one per line\nhttps://example.com/photo1.jpg"
                  }
                  value={linksText}
                  onChange={(e) => setLinksText(e.target.value)}
                />
              )}

              <label className={styles.fieldLabel}>
                Caption (optional, applies to all)
              </label>
              <input
                className={styles.select}
                placeholder="Add a short caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />

              {error && <p className={styles.errorText}>{error}</p>}
              {uploading && (
                <p className={styles.progressText}>
                  Uploading {progress.done}/{progress.total}…
                </p>
              )}
            </>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button
            className={styles.cancelBtn}
            onClick={onClose}
            type="button"
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            className={styles.uploadBtn}
            onClick={handleUpload}
            type="button"
            disabled={uploading || !user || checkingAuth}
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
