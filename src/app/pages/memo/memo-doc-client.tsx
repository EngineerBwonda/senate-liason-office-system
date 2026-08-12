"use client";

import { useEffect, useState } from "react";
import { Search, FolderOpen, FileText, Grid3x3, List, X } from "lucide-react";

import { createClient } from "@/utils/supabase/client";
import UploadDocButton from "./memo-doc-button";
import DocTable from "./memo-card";
import styles from "./style.module.css";

const MEMO_LAST_OPENED_KEY = "memo:last-opened-at";

export type OfficeDocRecord = {
  id: string;
  title: string;
  description: string | null;
  file: string | null;
  created_at: string;
};

export function normalizeDocs(records: OfficeDocRecord[]) {
  return Array.from(
    new Map(records.map((record) => [record.id, record])).values(),
  );
}

export function getFileExt(path: string | null) {
  if (!path) return "";
  return path.split(".").pop()?.toLowerCase() ?? "";
}

export function isImageExt(ext: string) {
  return ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext);
}

export default function OfficeDocClient({
  initialRecords,
}: {
  initialRecords: OfficeDocRecord[];
}) {
  const [records, setRecords] = useState<OfficeDocRecord[]>(
    normalizeDocs(initialRecords),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const supabase = createClient();

  useEffect(() => {
    localStorage.setItem(MEMO_LAST_OPENED_KEY, new Date().toISOString());
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("boss-doc-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "boss doc" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setRecords((current) =>
              normalizeDocs([payload.new as OfficeDocRecord, ...current]),
            );
          }

          if (payload.eventType === "UPDATE") {
            setRecords((current) =>
              normalizeDocs(
                current.map((record) =>
                  record.id === (payload.new as OfficeDocRecord).id
                    ? (payload.new as OfficeDocRecord)
                    : record,
                ),
              ),
            );
          }

          if (payload.eventType === "DELETE") {
            setRecords((current) =>
              current.filter(
                (record) => record.id !== (payload.old as OfficeDocRecord).id,
              ),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRecords = records.filter((record) => {
    const query = searchQuery.toLowerCase();
    return (
      record.title.toLowerCase().includes(query) ||
      (record.description ?? "").toLowerCase().includes(query)
    );
  });

  const totalDocs = records.length;

  return (
    <div className={styles.page}>
      <div className="container-fluid px-4 py-4">
        {/* Header with gradient accent */}
        <div className={styles.headerSection}>
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.headerIcon}>
                <FolderOpen size={20} />
              </div>
              <div>
                <h1 className={styles.title}>Office Documents</h1>
                <p className={styles.subtitle}>
                  Manage and organize all your office documents in one place
                </p>
              </div>
            </div>

            <div className={styles.headerRight}>
              <div className={styles.statsBadge}>
                <span className={styles.statsNumber}>{totalDocs}</span>
                <span className={styles.statsLabel}>
                  {totalDocs === 1 ? "document" : "documents"}
                </span>
              </div>
              <UploadDocButton />
            </div>
          </div>
        </div>

        {/* Search and toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchBar}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                className={styles.clearSearch}
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewButton} ${viewMode === "table" ? styles.activeView : ""}`}
              onClick={() => setViewMode("table")}
              aria-label="Table view"
            >
              <List size={16} />
            </button>
            <button
              className={`${styles.viewButton} ${viewMode === "grid" ? styles.activeView : ""}`}
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
            >
              <Grid3x3 size={16} />
            </button>
          </div>
        </div>

        {/* Results info */}
        <div className={styles.resultsInfo}>
          <span className={styles.resultsCount}>
            {filteredRecords.length}{" "}
            {filteredRecords.length === 1 ? "result" : "results"}
          </span>
          {searchQuery && (
            <span className={styles.searchTerm}>
              for &quot;{searchQuery}&quot;
            </span>
          )}
        </div>

        {/* Document table */}
        <div className={styles.tableContainer}>
          {viewMode === "table" ? (
            <DocTable records={filteredRecords} />
          ) : (
            <div className={styles.gridView}>
              {filteredRecords.map((record) => (
                <div key={record.id} className={styles.gridCard}>
                  <div className={styles.gridCardHeader}>
                    <div className={styles.gridCardIcon}>
                      <FileText size={24} />
                    </div>
                    <span className={styles.gridCardType}>
                      {getFileExt(record.file)?.toUpperCase() || "FILE"}
                    </span>
                  </div>
                  <h4 className={styles.gridCardTitle}>{record.title}</h4>
                  <p className={styles.gridCardDescription}>
                    {record.description || "No description"}
                  </p>
                  <div className={styles.gridCardFooter}>
                    <span className={styles.gridCardDate}>
                      {formatCreatedAt(record.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatCreatedAt(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return createdAt;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(date);
}
