"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AlbumRow, PhotoRow } from "./supabase-client";
import UploadModal from "./upload-modal";
import styles from "./styles.module.css";

type Props = {
  initialAlbums: AlbumRow[];
  initialPhotos: PhotoRow[];
};

export default function GalleryClient({ initialAlbums, initialPhotos }: Props) {
  const [albums, setAlbums] = useState<AlbumRow[]>(initialAlbums);
  const [photos, setPhotos] = useState<PhotoRow[]>(initialPhotos);
  const [activeAlbumId, setActiveAlbumId] = useState<string | "all">("all");
  const [showUpload, setShowUpload] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<PhotoRow | null>(null);

  const filteredPhotos = useMemo(() => {
    if (activeAlbumId === "all") return photos;
    return photos.filter((p) => p.album_id === activeAlbumId);
  }, [photos, activeAlbumId]);

  const photoCountByAlbum = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of photos) counts[p.album_id] = (counts[p.album_id] ?? 0) + 1;
    return counts;
  }, [photos]);

  function handleUploaded(newPhoto: PhotoRow) {
    setPhotos((prev) => [newPhoto, ...prev]);
  }

  return (
    <div className={styles.page}>
      <div className="container py-5">
        <div className="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-4">
          <div>
            <p className={styles.eyebrow}>Photo Gallery</p>
            <h1 className={styles.heading}>Moments from every album</h1>
          </div>
          <button
            className={styles.uploadBtn}
            onClick={() => setShowUpload(true)}
            type="button"
          >
            + Upload Photos
          </button>
        </div>

        {/* Album filter tabs */}
        <div className={`d-flex flex-wrap gap-2 mb-5 ${styles.tabRow}`}>
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

        {/* Photo grid */}
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
                    <div className={styles.cardOverlay}>
                      <span className={styles.cardAlbum}>{album?.name}</span>
                      {photo.caption && (
                        <span className={styles.cardCaption}>
                          {photo.caption}
                        </span>
                      )}
                      {photo.uploaded_by_name && (
                        <span className={styles.cardUploader}>
                          Uploaded by {photo.uploaded_by_name}
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
            {lightboxPhoto.uploaded_by_name && (
              <p className={styles.lightboxCaption}>
                Uploaded by {lightboxPhoto.uploaded_by_name}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
