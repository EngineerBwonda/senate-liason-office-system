"use client";

import { useEffect, useState } from "react";
import { Search, UploadCloud, FolderOpen } from "lucide-react";

import { createClient } from "@/utils/supabase/client";
import DocCard from "./doc-card";
import styles from "./styles.module.css";

export type OfficeDocRecord = {
  id: string;
  title: string;
  description: string | null;
  file: string | null;
  created_at: string;
};

function normalizeDocs(records: OfficeDocRecord[]) {
  return Array.from(
    new Map(records.map((record) => [record.id, record])).values(),
  );
}

function buildFilePath(fileName: string) {
  const fileExt = fileName.split(".").pop() ?? "bin";
  return `${crypto.randomUUID()}.${fileExt}`;
}

export default function OfficeDocClient({
  initialRecords,
}: {
  initialRecords: OfficeDocRecord[];
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [uploading, setUploading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [records, setRecords] = useState<OfficeDocRecord[]>(
    normalizeDocs(initialRecords),
  );

  const [searchQuery, setSearchQuery] = useState("");

  const supabase = createClient();

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

    setTitle("");
    setDescription("");
    setFile(null);
    setUploading(false);

    // No manual refetch needed — the realtime INSERT event above
    // will add the new record to the list automatically.
  }

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
        <div className={styles.header}>
          <span className={styles.headerIcon}>
            <FolderOpen size={18} />
          </span>
          <h1 className={styles.title}>Office Documents</h1>
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

        {/* Upload form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <p className={styles.formTitle}>Upload a document</p>

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

        {/* Document list */}
        <p className={styles.sectionLabel}>Documents</p>

        {filteredRecords.length === 0 ? (
          <div className={styles.emptyState}>No documents found.</div>
        ) : (
          <div className={styles.list}>
            {filteredRecords.map((record) => (
              <DocCard key={record.id} record={record} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// "use client";

// import { useEffect, useState } from "react";
// import { Search, UploadCloud } from "lucide-react";

// import { createClient } from "@/utils/supabase/client";
// import DocCard from "./doc-card";

// export type OfficeDocRecord = {
//   id: string;
//   title: string;
//   description: string | null;
//   file: string | null;
//   created_at: string;
// };

// function normalizeDocs(records: OfficeDocRecord[]) {
//   return Array.from(
//     new Map(records.map((record) => [record.id, record])).values(),
//   );
// }

// function buildFilePath(fileName: string) {
//   const fileExt = fileName.split(".").pop() ?? "bin";
//   return `${crypto.randomUUID()}.${fileExt}`;
// }

// export default function OfficeDocClient({
//   initialRecords,
// }: {
//   initialRecords: OfficeDocRecord[];
// }) {
//   const [title, setTitle] = useState("");
//   const [description, setDescription] = useState("");
//   const [file, setFile] = useState<File | null>(null);

//   const [uploading, setUploading] = useState(false);
//   const [submitError, setSubmitError] = useState<string | null>(null);

//   // Seeded from the server-fetched data — no client-side fetch needed on mount.
//   const [records, setRecords] = useState<OfficeDocRecord[]>(
//     normalizeDocs(initialRecords),
//   );

//   const [searchQuery, setSearchQuery] = useState("");

//   const supabase = createClient();

//   // Realtime subscription only — the initial fetch already happened on the server.
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

//   async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     setSubmitError(null);

//     if (!file) {
//       setSubmitError("Please choose a file to upload.");
//       return;
//     }

//     setUploading(true);

//     const filePath = buildFilePath(file.name);

//     const { error: uploadError } = await supabase.storage
//       .from("document")
//       .upload(filePath, file);

//     if (uploadError) {
//       console.error("Error uploading file:", uploadError);
//       setSubmitError(uploadError.message);
//       setUploading(false);
//       return;
//     }

//     const { error: insertError } = await supabase.from("boss doc").insert({
//       title,
//       description,
//       file: filePath,
//     });

//     if (insertError) {
//       console.error("Error inserting record:", insertError);
//       setSubmitError(insertError.message);
//       setUploading(false);
//       return;
//     }

//     setTitle("");
//     setDescription("");
//     setFile(null);
//     setUploading(false);

//     // No manual refetch needed — the realtime INSERT event above
//     // will add the new record to the list automatically.
//   }

//   // Simple client-side filter by title or description.
//   const filteredRecords = records.filter((record) => {
//     const query = searchQuery.toLowerCase();
//     return (
//       record.title.toLowerCase().includes(query) ||
//       (record.description ?? "").toLowerCase().includes(query)
//     );
//   });

//   return (
//     <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px" }}>
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//           marginBottom: 20,
//         }}
//       >
//         <h1>Office Documents</h1>
//       </div>

//       {/* Search bar */}
//       <div
//         style={{
//           display: "flex",
//           alignItems: "center",
//           gap: 8,
//           border: "1px solid #ddd",
//           borderRadius: 8,
//           padding: "8px 12px",
//           marginBottom: 20,
//         }}
//       >
//         <Search size={18} color="#888" />
//         <input
//           type="text"
//           placeholder="Search by title or description..."
//           value={searchQuery}
//           onChange={(e) => setSearchQuery(e.target.value)}
//           style={{ border: "none", outline: "none", flex: 1 }}
//         />
//       </div>

//       {/* Upload form */}
//       <form
//         onSubmit={handleSubmit}
//         style={{
//           display: "flex",
//           flexDirection: "column",
//           gap: 8,
//           border: "1px solid #eee",
//           borderRadius: 8,
//           padding: 16,
//           marginBottom: 24,
//         }}
//       >
//         <input
//           type="text"
//           placeholder="Title"
//           value={title}
//           onChange={(e) => setTitle(e.target.value)}
//           required
//         />
//         <textarea
//           placeholder="Description"
//           value={description}
//           onChange={(e) => setDescription(e.target.value)}
//         />
//         <input
//           type="file"
//           onChange={(e) => setFile(e.target.files?.[0] ?? null)}
//           required
//         />

//         {submitError && <p style={{ color: "red" }}>{submitError}</p>}

//         <button
//           type="submit"
//           disabled={uploading}
//           style={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             gap: 6,
//           }}
//         >
//           <UploadCloud size={16} />
//           {uploading ? "Uploading..." : "Upload"}
//         </button>
//       </form>

//       {/* Document list */}
//       <h2>Documents</h2>
//       {filteredRecords.length === 0 && <p>No documents found.</p>}

//       <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
//         {filteredRecords.map((record) => (
//           <DocCard key={record.id} record={record} />
//         ))}
//       </div>
//     </div>
//   );
// }
