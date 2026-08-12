"use client";

import { useMemo, useState } from "react";
import {
  Eye,
  Download,
  FileText,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";

import { createClient } from "@/utils/supabase/client";
import PreviewModal from "./preview-modal";
// import { getFileExt, isImageExt, type OfficeDocRecord } from "./office-doc-client";

import {
  getFileExt,
  isImageExt,
  type OfficeDocRecord,
} from "./report-doc-utils";

import styles from "./style.module.css";

type SortKey = "title" | "created_at";
type SortDir = "asc" | "desc";

function formatCreatedAt(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return createdAt;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/** One row's preview/download logic — same behavior as the old DocCard. */
function DocRow({ record, index }: { record: OfficeDocRecord; index: number }) {
  const [showPreview, setShowPreview] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const supabase = createClient();
  const shouldUseImageIcon = isImageExt(getFileExt(record.file));
  const ext = getFileExt(record.file);
  const insertedBy =
    record.user_name ?? record.username ?? record.inserted_by_name ?? null;

  function getPublicUrl(path: string) {
    const { data } = supabase.storage.from("document").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleDownload() {
    if (!record.file) return;
    setDownloading(true);

    const { data, error } = await supabase.storage
      .from("document")
      .download(record.file);

    if (error) {
      console.error("Error downloading file:", error);
      setDownloading(false);
      return;
    }

    const url = URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.download = record.file;
    link.click();
    URL.revokeObjectURL(url);

    setDownloading(false);
  }

  return (
    <>
      <tr className={styles.tableRow}>
        <td className={styles.rowIndex}>{index + 1}</td>

        <td>
          <div className={styles.titleCell}>
            <span className={styles.iconBadgeSm}>
              {shouldUseImageIcon ? (
                <ImageIcon size={14} />
              ) : (
                <FileText size={14} />
              )}
            </span>
            {record.title}
          </div>
        </td>

        <td className={styles.descriptionCell}>
          {record.description || <span className={styles.mutedDash}>—</span>}
        </td>

        <td>{insertedBy || "Unknown Email"}</td>

        <td className={styles.dateCell}>
          {formatCreatedAt(record.created_at)}
        </td>

        <td>
          {ext ? (
            <span className={styles.typeBadge} data-type={ext}>
              {ext.toUpperCase()}
            </span>
          ) : (
            <span className={styles.mutedDash}>—</span>
          )}
        </td>

        <td className="text-end">
          {record.file ? (
            <div className={styles.rowActions}>
              <button
                onClick={() => setShowPreview(true)}
                title="Preview"
                className={styles.iconButton}
              >
                <Eye size={16} />
              </button>
              <button
                onClick={handleDownload}
                disabled={downloading}
                title="Download"
                className={styles.iconButton}
              >
                <Download size={16} />
              </button>
            </div>
          ) : (
            <span className={styles.mutedDash}>—</span>
          )}
        </td>
      </tr>

      {showPreview && record.file && (
        <PreviewModal
          url={getPublicUrl(record.file)}
          title={record.title}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
}

export default function DocTable({ records }: { records: OfficeDocRecord[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = useMemo(() => {
    const copy = [...records];
    copy.sort((a, b) => {
      const cmp =
        sortKey === "title"
          ? a.title.localeCompare(b.title)
          : a.created_at.localeCompare(b.created_at);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [records, sortKey, sortDir]);

  function sortIcon(key: SortKey) {
    if (sortKey !== key)
      return <ArrowUpDown size={13} className={styles.sortIconIdle} />;
    return sortDir === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />;
  }

  if (records.length === 0) {
    return <div className={styles.emptyState}>No documents found.</div>;
  }

  return (
    <div className={styles.tableWrap}>
      <div className="table-responsive">
        <table className="table table-hover table-bordered align-middle mb-0">
          <thead className={styles.tableHead}>
            <tr>
              <th scope="col" className={styles.rowIndexHead}>
                #
              </th>
              <th
                scope="col"
                className={styles.sortableHead}
                onClick={() => toggleSort("title")}
              >
                <span className={styles.sortLabel}>
                  Title {sortIcon("title")}
                </span>
              </th>
              <th scope="col">Description</th>
              <th scope="col">User Email</th>
              <th
                scope="col"
                className={styles.sortableHead}
                onClick={() => toggleSort("created_at")}
              >
                <span className={styles.sortLabel}>
                  Created {sortIcon("created_at")}
                </span>
              </th>
              <th scope="col">Type</th>
              <th scope="col" className="text-end">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((record, index) => (
              <DocRow key={record.id} record={record} index={index} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// "use client";

// import { useState } from "react";
// import { Eye, Download, FileText, Image as ImageIcon } from "lucide-react";

// import { createClient } from "@/utils/supabase/client";
// import PreviewModal from "./preview-modal";
// import {
//   getFileExt,
//   isImageExt,
//   type OfficeDocRecord,
// } from "./report-doc-utils";
// import styles from "./style.module.css";

// function formatCreatedAt(createdAt: string) {
//   const date = new Date(createdAt);

//   if (Number.isNaN(date.getTime())) {
//     return createdAt;
//   }

//   return new Intl.DateTimeFormat(undefined, {
//     dateStyle: "medium",
//     timeStyle: "short",
//   }).format(date);
// }

// export default function DocCard({ record }: { record: OfficeDocRecord }) {
//   const [showPreview, setShowPreview] = useState(false);
//   const [downloading, setDownloading] = useState(false);

//   const supabase = createClient();
//   const shouldUseImageIcon = isImageExt(getFileExt(record.file));

//   function getPublicUrl(path: string) {
//     const { data } = supabase.storage.from("document").getPublicUrl(path);
//     return data.publicUrl;
//   }

//   async function handleDownload() {
//     if (!record.file) return;
//     setDownloading(true);

//     const { data, error } = await supabase.storage
//       .from("document")
//       .download(record.file);

//     if (error) {
//       console.error("Error downloading file:", error);
//       setDownloading(false);
//       return;
//     }

//     const url = URL.createObjectURL(data);
//     const link = document.createElement("a");
//     link.href = url;
//     link.download = record.file;
//     link.click();
//     URL.revokeObjectURL(url);

//     setDownloading(false);
//   }

//   return (
//     <div className={styles.card}>
//       <div className={styles.cardMain}>
//         <span className={styles.iconBadge}>
//           {shouldUseImageIcon ? (
//             <ImageIcon size={16} />
//           ) : (
//             <FileText size={16} />
//           )}
//         </span>
//         <div className={styles.cardInfo}>
//           <div className={styles.cardInfoRow}>
//             <p className={styles.cardTitle}>{record.title}</p>
//             <p className={styles.cardMeta}>
//               Created: {formatCreatedAt(record.created_at)}
//             </p>
//             {record.description && (
//               <p className={styles.cardDescription}>{record.description}</p>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Preview / Download — top-right of each card */}
//       {record.file && (
//         <div className={styles.cardActions}>
//           <button
//             onClick={() => setShowPreview(true)}
//             title="Preview"
//             className={styles.iconButton}
//           >
//             <Eye size={16} />
//           </button>

//           <button
//             onClick={handleDownload}
//             disabled={downloading}
//             title="Download"
//             className={styles.iconButton}
//           >
//             <Download size={16} />
//           </button>
//         </div>
//       )}

//       {showPreview && record.file && (
//         <PreviewModal
//           url={getPublicUrl(record.file)}
//           title={record.title}
//           onClose={() => setShowPreview(false)}
//         />
//       )}
//     </div>
//   );
// }
