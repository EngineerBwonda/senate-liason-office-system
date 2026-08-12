import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import OfficeDocClient from "../bossme/office-doc-client";

export default async function OfficeDocPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Fetch the initial list on the server so the page loads
  // with data already in it (no loading spinner on first render).
  const { data: initialRecords } = await supabase
    .from("boss doc")
    .select("*")
    .order("created_at", { ascending: false });

  return <OfficeDocClient initialRecords={initialRecords ?? []} />;
}

// "use client";

// import { useEffect, useState } from "react";

// import { createClient } from "@/utils/supabase/client";

// type OfficeDocRecord = {
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

// export default function OfficeDocPage() {
//   const [title, setTitle] = useState("");
//   const [description, setDescription] = useState("");
//   const [file, setFile] = useState<File | null>(null);

//   const [uploading, setUploading] = useState(false);
//   const [submitError, setSubmitError] = useState<string | null>(null);

//   const [records, setRecords] = useState<OfficeDocRecord[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [fetchError, setFetchError] = useState<string | null>(null);

//   const supabase = createClient();

//   async function fetchDocs() {
//     setLoading(true);
//     setFetchError(null);

//     const { data, error } = await supabase
//       .from("boss doc")
//       .select("*")
//       .order("created_at", { ascending: false });

//     if (error) {
//       console.error("Error fetching data:", error);
//       setFetchError(error.message);
//     } else {
//       setRecords(normalizeDocs((data ?? []) as OfficeDocRecord[]));
//     }

//     setLoading(false);
//   }

//   useEffect(() => {
//     let isActive = true;

//     Promise.resolve().then(() => {
//       if (isActive) {
//         void fetchDocs();
//       }
//     });

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
//       isActive = false;
//       supabase.removeChannel(channel);
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   function getPublicUrl(path: string) {
//     const { data } = supabase.storage.from("document").getPublicUrl(path);
//     return data.publicUrl;
//   }

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

//     await fetchDocs();
//   }

//   return (
//     <div>
//       <h1>Office Documents</h1>

//       <form onSubmit={handleSubmit}>
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

//         <button type="submit" disabled={uploading}>
//           {uploading ? "Uploading..." : "Upload"}
//         </button>
//       </form>

//       <h2>Documents</h2>
//       {loading && <p>Loading...</p>}
//       {fetchError && <p style={{ color: "red" }}>Error: {fetchError}</p>}
//       {!loading && !fetchError && records.length === 0 && (
//         <p>No documents yet.</p>
//       )}

//       <ul>
//         {records.map((record) => (
//           <li key={record.id}>
//             <strong>{record.title}</strong>
//             {record.description && <p>{record.description}</p>}
//             {record.file && (
//               <a
//                 href={getPublicUrl(record.file)}
//                 target="_blank"
//                 rel="noopener noreferrer"
//               >
//                 View document
//               </a>
//             )}
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }
