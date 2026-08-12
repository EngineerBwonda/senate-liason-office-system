"use client";

// This is the only component in the gallery that needs to be a Client
// Component: it holds interactive state (which album tab is active, which
// photo is open in the lightbox, whether the upload modal is showing) and
// reacts to clicks. Everything above it (page.tsx) stays a Server Component.

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import type { AlbumRow, PhotoRow } from "./supabase-client";
import UploadModal from "./upload-modal";
import styles from "./styles.module.css";

type Props = {
  initialAlbums: AlbumRow[];
  initialPhotos: PhotoRow[];
  currentUserId?: string;
  currentUserName?: string;
};

export default function GalleryClient({
  initialAlbums,
  initialPhotos,
  currentUserId,
  currentUserName,
}: Props) {
  // Local copies of the server-fetched data. We update these in place when
  // a photo is uploaded or an album is created, so the UI feels instant
  // instead of waiting on a full page refetch.
  const supabase = useMemo(() => createClient(), []);
  const [albums, setAlbums] = useState<AlbumRow[]>(initialAlbums);
  const [photos, setPhotos] = useState<PhotoRow[]>(initialPhotos);
  const [viewerId, setViewerId] = useState<string | undefined>(currentUserId);
  const [viewerName, setViewerName] = useState<string>(
    currentUserName ?? "Guest",
  );

  const [activeAlbumId, setActiveAlbumId] = useState<string | "all">("all");
  const [showUpload, setShowUpload] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<PhotoRow | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<PhotoRow | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (viewerId) return;

    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return;
      setViewerId(user.id);
      setViewerName(
        (user.user_metadata?.full_name as string | undefined) ||
          (user.user_metadata?.name as string | undefined) ||
          user.email ||
          "Guest",
      );
    });
  }, [supabase, viewerId]);

  // Photos for the currently selected tab.
  const filteredPhotos = useMemo(() => {
    if (activeAlbumId === "all") return photos;
    return photos.filter((p) => p.album_id === activeAlbumId);
  }, [photos, activeAlbumId]);

  const albumById = useMemo(() => {
    const lookup: Record<string, AlbumRow> = {};
    for (const album of albums) lookup[album.id] = album;
    return lookup;
  }, [albums]);

  const contributors = useMemo(() => {
    const names = Array.from(
      new Set(photos.map((p) => p.uploaded_by_name).filter(Boolean)),
    ) as string[];
    return names;
  }, [photos]);

  // Count of photos per album, used for the little badge on each tab.
  const photoCountByAlbum = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of photos) counts[p.album_id] = (counts[p.album_id] ?? 0) + 1;
    return counts;
  }, [photos]);

  function handleUploaded(newPhoto: PhotoRow) {
    setPhotos((prev) => [newPhoto, ...prev]);
  }

  function isLinkUpload(photo: PhotoRow) {
    return !photo.storage_path;
  }

  function friendlySourceLabel(photo: PhotoRow) {
    try {
      const parsed = new URL(photo.url);
      const host = parsed.hostname.replace(/^www\./, "");
      return `Source: ${host}`;
    } catch {
      return "Open source";
    }
  }

  function canManagePhoto(photo: PhotoRow) {
    if (!viewerId) return false;
    const album = albumById[photo.album_id];
    return photo.uploaded_by === viewerId || album?.created_by === viewerId;
  }

  function startEditPhoto(photo: PhotoRow) {
    setActionError(null);
    setEditingPhoto(photo);
    setEditCaption(photo.caption ?? "");
    setEditUrl(isLinkUpload(photo) ? photo.url : "");
  }

  async function handleSaveEdit() {
    if (!editingPhoto) return;

    const payload: { caption: string | null; url?: string } = {
      caption: editCaption.trim() || null,
    };

    if (isLinkUpload(editingPhoto)) {
      const normalizedUrl = editUrl.trim();
      if (!normalizedUrl) {
        setActionError("Link URL cannot be empty.");
        return;
      }

      try {
        const parsed = new URL(normalizedUrl);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          setActionError("Only http/https links are supported.");
          return;
        }
      } catch {
        setActionError("Please provide a valid image URL.");
        return;
      }

      payload.url = normalizedUrl;
    }

    setActionError(null);
    setSavingEdit(true);

    const { data, error } = await supabase
      .from("photos")
      .update(payload)
      .eq("id", editingPhoto.id)
      .select()
      .single();

    setSavingEdit(false);

    if (error || !data) {
      setActionError("Could not update this photo right now.");
      return;
    }

    setPhotos((prev) =>
      prev.map((p) => (p.id === data.id ? (data as PhotoRow) : p)),
    );
    setLightboxPhoto((prev) =>
      prev?.id === data.id ? (data as PhotoRow) : prev,
    );
    setEditingPhoto(null);
  }

  async function handleDeletePhoto(photo: PhotoRow) {
    const confirmed = window.confirm(
      "Delete this photo? This action cannot be undone.",
    );
    if (!confirmed) return;

    setActionError(null);

    if (photo.storage_path) {
      const { error: removeError } = await supabase.storage
        .from("gallery-photos")
        .remove([photo.storage_path]);
      if (removeError) {
        setActionError("Could not remove file from storage.");
        return;
      }
    }

    const { error: deleteError } = await supabase
      .from("photos")
      .delete()
      .eq("id", photo.id);

    if (deleteError) {
      setActionError("Could not delete this photo.");
      return;
    }

    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    setLightboxPhoto((prev) => (prev?.id === photo.id ? null : prev));
  }

  return (
    <div className={styles.page}>
      {/* Faint blueprint-grid backdrop — purely decorative, sits behind everything */}
      <div className={styles.blueprintGrid} aria-hidden="true" />

      <div className="container py-5">
        <div className={styles.headerRow}>
          <div>
            <p className={styles.eyebrow}> Photo Archive</p>
            <h1 className={styles.heading}>Gallery Records</h1>
            <div className={styles.metaTopRow}>
              <span className={styles.viewerChip}>
                Signed in as {viewerName}
              </span>
              {contributors.length > 0 && (
                <span className={styles.contributorText}>
                  Contributors: {contributors.join(", ")}
                </span>
              )}
            </div>
          </div>
          <button
            className={styles.uploadBtn}
            onClick={() => setShowUpload(true)}
            type="button"
          >
            <span className={styles.uploadBtnIcon} aria-hidden="true">
              +
            </span>
            Upload Photos
          </button>
        </div>

        {/* Album filter tabs */}
        <div className={`d-flex flex-wrap gap-2 ${styles.tabRow}`}>
          <button
            className={`${styles.tab} ${activeAlbumId === "all" ? styles.tabActive : ""}`}
            onClick={() => setActiveAlbumId("all")}
            type="button"
          >
            All Albums
            <span className={styles.tabCount}>{photos.length}</span>
          </button>
          {albums.map((album) => (
            <button
              key={album.id}
              className={`${styles.tab} ${activeAlbumId === album.id ? styles.tabActive : ""}`}
              onClick={() => setActiveAlbumId(album.id)}
              type="button"
            >
              {album.name}
              <span className={styles.tabCount}>
                {photoCountByAlbum[album.id] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Masonry photo grid — CSS columns, so image heights stay natural
            instead of being cropped into uniform tiles. */}
        {filteredPhotos.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No photos in this album yet.</p>
            <button
              className={styles.uploadBtnGhost}
              onClick={() => setShowUpload(true)}
              type="button"
            >
              Be the first to upload
            </button>
          </div>
        ) : (
          <motion.div layout className={styles.grid}>
            <AnimatePresence>
              {filteredPhotos.map((photo) => {
                const album = albums.find((a) => a.id === photo.album_id);
                return (
                  <motion.div
                    key={photo.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.25 }}
                    className={styles.card}
                    onClick={() => setLightboxPhoto(photo)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={photo.caption ?? album?.name ?? "Album photo"}
                      loading="lazy"
                    />
                    <div className={styles.cardCorner} aria-hidden="true" />
                    <div className={styles.cardActions}>
                      <a
                        href={photo.url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.cardActionBtn}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Download
                      </a>
                      {isLinkUpload(photo) && (
                        <a
                          href={photo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.cardActionBtnSecondary}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {friendlySourceLabel(photo)}
                        </a>
                      )}
                      {canManagePhoto(photo) && (
                        <>
                          <button
                            type="button"
                            className={styles.cardActionBtnSecondary}
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditPhoto(photo);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className={styles.cardActionBtnDanger}
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleDeletePhoto(photo);
                            }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                    <div className={styles.cardOverlay}>
                      <span className={styles.cardAlbum}>{album?.name}</span>
                      {photo.caption && (
                        <span className={styles.cardCaption}>
                          {photo.caption}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Upload modal */}
      <AnimatePresence>
        {showUpload && (
          <UploadModal
            albums={albums}
            onClose={() => setShowUpload(false)}
            onUploaded={handleUploaded}
            onAlbumCreated={(album) => setAlbums((prev) => [album, ...prev])}
          />
        )}
      </AnimatePresence>

      {actionError && (
        <div className="container pb-2">
          <p className={styles.errorText}>{actionError}</p>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxPhoto && (
          <motion.div
            className={styles.lightboxBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxPhoto(null)}
          >
            <motion.img
              src={lightboxPhoto.url}
              alt={lightboxPhoto.caption ?? "Album photo"}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            />
            {lightboxPhoto.caption && (
              <p className={styles.lightboxCaption}>{lightboxPhoto.caption}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit photo modal */}
      <AnimatePresence>
        {editingPhoto && (
          <motion.div
            className={styles.modalBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditingPhoto(null)}
          >
            <motion.div
              className={styles.modal}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>Edit Photo</h2>
                <button
                  className={styles.closeBtn}
                  onClick={() => setEditingPhoto(null)}
                  type="button"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className={styles.modalBody}>
                <label className={styles.fieldLabel}>Caption</label>
                <input
                  className={styles.select}
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  placeholder="Update caption"
                />
                {isLinkUpload(editingPhoto) && (
                  <>
                    <label className={styles.fieldLabel}>Image link</label>
                    <input
                      className={styles.select}
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      placeholder="https://example.com/photo.jpg"
                    />
                  </>
                )}
                {actionError && (
                  <p className={styles.errorText}>{actionError}</p>
                )}
              </div>
              <div className={styles.modalFooter}>
                <button
                  className={styles.cancelBtn}
                  type="button"
                  onClick={() => setEditingPhoto(null)}
                  disabled={savingEdit}
                >
                  Cancel
                </button>
                <button
                  className={styles.uploadBtn}
                  type="button"
                  onClick={() => void handleSaveEdit()}
                  disabled={savingEdit}
                >
                  {savingEdit ? "Saving..." : "Save changes"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
