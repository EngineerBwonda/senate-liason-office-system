"use client";

import { useEffect, useState } from "react";
import { Search, FolderOpen } from "lucide-react";

import { createClient } from "@/utils/supabase/client";
// import UploadDocButton from "./upload-doc-button";
import UploadDocButton from "./report-doc-button";
// import DocTable from "./doc-table";
import DocTable from "./report-card";
import styles from "./style.module.css";

export type OfficeDocRecord = {
  id: string;
  title: string;
  description: string | null;
  file: string | null;
  username?: string | null;
  user_name?: string | null;
  inserted_by_name?: string | null;
  created_at: string;
};

export function normalizeDocs(records: OfficeDocRecord[]) {
  return Array.from(
    new Map(records.map((record) => [record.id, record])).values(),
  );
}

/** Extension helpers — shared by DocTable so each row can show a fitting icon/badge. */
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

  const supabase = createClient();

  // Realtime subscription — unchanged. Whenever UploadDocButton inserts a
  // new row, this listener is what actually adds it to the list.
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

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header: title on the left, upload trigger on the right */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerIcon}>
              <FolderOpen size={18} />
            </span>
            <h1 className={styles.title}>Office Documents</h1>
          </div>

          <UploadDocButton />
        </div>

        {/* Search bar */}
        <div className={styles.searchBar}>
          <Search size={18} color="var(--color-text-muted)" />
          <input
            type="text"
            placeholder="Search by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Document table */}
        <div className={styles.tableSectionHeader}>
          <p className={styles.sectionLabel}>Documents</p>
          <span className={styles.resultCount}>
            {filteredRecords.length}{" "}
            {filteredRecords.length === 1 ? "document" : "documents"}
          </span>
        </div>

        <DocTable records={filteredRecords} />
      </div>
    </div>
  );
}

// "use client";

// import { useEffect, useState } from "react";
// import { Search, FolderOpen } from "lucide-react";

// import { createClient } from "@/utils/supabase/client";
// import UploadDocButton from "./report-doc-button";
// import DocCard from "./report-card";
// import { normalizeDocs, type OfficeDocRecord } from "./report-doc-utils";
// import styles from "./style.module.css";

// export default function OfficeDocClient({
//   initialRecords,
// }: {
//   initialRecords: OfficeDocRecord[];
// }) {
//   const [records, setRecords] = useState<OfficeDocRecord[]>(
//     normalizeDocs(initialRecords),
//   );
//   const [searchQuery, setSearchQuery] = useState("");

//   const supabase = createClient();

//   // Realtime subscription — unchanged. Whenever UploadDocButton inserts a
//   // new row, this listener is what actually adds it to the list.
//   useEffect(() => {
//     const channel = supabase
//       .channel("boss-doc-changes")
//       .on(
//         "postgres_changes",
//         { event: "*", schema: "public", table: "boss doc" },
//         (payload) => {
//           if (payload.eventType === "INSERT") {
//             setRecords((current) =>
//               normalizeDocs([payload.new as OfficeDocRecord, ...current]),
//             );
//           }

//           if (payload.eventType === "UPDATE") {
//             setRecords((current) =>
//               normalizeDocs(
//                 current.map((record) =>
//                   record.id === (payload.new as OfficeDocRecord).id
//                     ? (payload.new as OfficeDocRecord)
//                     : record,
//                 ),
//               ),
//             );
//           }

//           if (payload.eventType === "DELETE") {
//             setRecords((current) =>
//               current.filter(
//                 (record) => record.id !== (payload.old as OfficeDocRecord).id,
//               ),
//             );
//           }
//         },
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(channel);
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const filteredRecords = records.filter((record) => {
//     const query = searchQuery.toLowerCase();
//     return (
//       record.title.toLowerCase().includes(query) ||
//       (record.description ?? "").toLowerCase().includes(query)
//     );
//   });

//   return (
//     <div className={styles.page}>
//       <div className={styles.container}>
//         {/* Header: title on the left, upload trigger on the right */}
//         <div className={styles.header}>
//           <div className={styles.headerLeft}>
//             <span className={styles.headerIcon}>
//               <FolderOpen size={18} />
//             </span>
//             <h1 className={styles.title}>Office Documents</h1>
//           </div>

//           <UploadDocButton />
//         </div>

//         {/* Search bar */}
//         <div className={styles.searchBar}>
//           <Search size={18} color="var(--color-text-muted)" />
//           <input
//             type="text"
//             placeholder="Search by title or description..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className={styles.searchInput}
//           />
//         </div>

//         {/* Document list */}
//         <p className={styles.sectionLabel}>Documents</p>

//         {filteredRecords.length === 0 ? (
//           <div className={styles.emptyState}>No documents found.</div>
//         ) : (
//           <div className={styles.list}>
//             {filteredRecords.map((record) => (
//               <DocCard key={record.id} record={record} />
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
