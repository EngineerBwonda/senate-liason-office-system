"use client";

import { useState } from "react";
import { Eye, Download, FileText } from "lucide-react";

import { createClient } from "@/utils/supabase/client";
import PreviewModal from "./preview-modal";
import type { OfficeDocRecord } from "./office-doc-client";
import styles from "./styles.module.css";

function formatCreatedAt(createdAt: string) {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return createdAt;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function DocCard({ record }: { record: OfficeDocRecord }) {
  const [showPreview, setShowPreview] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const supabase = createClient();

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
    <div className={styles.card}>
      <div className={styles.cardMain}>
        <span className={styles.iconBadge}>
          <FileText size={16} />
        </span>
        <div>
          <p className={styles.cardTitle}>{record.title}</p>
          <p className={styles.cardMeta}>
            Created: {formatCreatedAt(record.created_at)}
          </p>
          {record.description && (
            <p className={styles.cardDescription}>{record.description}</p>
          )}
        </div>
      </div>

      {/* Buttons top-right of the card */}
      {record.file && (
        <div className={styles.cardActions}>
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
      )}

      {showPreview && record.file && (
        <PreviewModal
          url={getPublicUrl(record.file)}
          title={record.title}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

// "use client";

// import { useState } from "react";
// import { Eye, Download, FileText } from "lucide-react";

// import { createClient } from "@/utils/supabase/client";
// import PreviewModal from "./preview-modal";
// import type { OfficeDocRecord } from "./office-doc-client";

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

//   function getPublicUrl(path: string) {
//     const { data } = supabase.storage.from("document").getPublicUrl(path);
//     return data.publicUrl;
//   }

//   async function handleDownload() {
//     if (!record.file) return;
//     setDownloading(true);

//     // Downloads the actual file bytes and triggers a browser save,
//     // instead of just opening the URL (which can just navigate to it).
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
//     <div
//       style={{
//         border: "1px solid #eee",
//         borderRadius: 8,
//         padding: 16,
//         display: "flex",
//         justifyContent: "space-between",
//         alignItems: "flex-start",
//       }}
//     >
//       <div style={{ display: "flex", gap: 10 }}>
//         <FileText size={20} color="#666" style={{ marginTop: 2 }} />
//         <div>
//           <strong>{record.title}</strong>
//           <p style={{ margin: "4px 0 0", color: "#777", fontSize: 12 }}>
//             Created: {formatCreatedAt(record.created_at)}
//           </p>
//           {record.description && (
//             <p style={{ margin: "4px 0 0", color: "#555" }}>
//               {record.description}
//             </p>
//           )}
//         </div>
//       </div>

//       {/* Buttons top-right of the card */}
//       {record.file && (
//         <div style={{ display: "flex", gap: 8 }}>
//           <button
//             onClick={() => setShowPreview(true)}
//             title="Preview"
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: 4,
//               border: "1px solid #ddd",
//               borderRadius: 6,
//               padding: "6px 10px",
//               background: "white",
//               cursor: "pointer",
//             }}
//           >
//             <Eye size={16} />
//           </button>

//           <button
//             onClick={handleDownload}
//             disabled={downloading}
//             title="Download"
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: 4,
//               border: "1px solid #ddd",
//               borderRadius: 6,
//               padding: "6px 10px",
//               background: "white",
//               cursor: "pointer",
//             }}
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
