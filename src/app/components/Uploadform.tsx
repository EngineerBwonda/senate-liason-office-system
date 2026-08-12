"use client";

import ReportForm from "../components/report";

export default function ReportPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Submit a Report</h1>
      <ReportForm />
    </div>
  );
}

// // components/minutes/UploadMinuteForm.tsx
// "use client";

// import { useState, type FormEvent } from "react";
// import { Paperclip, UploadCloud, AlertCircle } from "lucide-react";
// import { createClient } from "@/utils/supabase/client";
// import styles from "../styles/uploadform.module.css";

// const BUCKET = "minutes";

// interface UploadMinuteFormProps {
//   /** Called with the newly created row's id once the insert succeeds. */
//   onUploaded?: (minuteId: string) => void;
// }

// function extToType(name: string): "pdf" | "docx" | "txt" {
//   if (name.endsWith(".pdf")) return "pdf";
//   if (name.endsWith(".docx") || name.endsWith(".doc")) return "docx";
//   return "txt";
// }

// export default function UploadMinuteForm({
//   onUploaded,
// }: UploadMinuteFormProps) {
//   const [title, setTitle] = useState("");
//   const [description, setDescription] = useState("");
//   const [file, setFile] = useState<File | null>(null);

//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [success, setSuccess] = useState(false);

//   const resetForm = () => {
//     setTitle("");
//     setDescription("");
//     setFile(null);
//   };

//   const handleSubmit = async (e: FormEvent) => {
//     e.preventDefault();
//     setError(null);
//     setSuccess(false);

//     if (!title.trim() || !description.trim()) {
//       setError("Title and description are required.");
//       return;
//     }

//     setSubmitting(true);
//     const supabase = createClient();

//     const {
//       data: { user },
//     } = await supabase.auth.getUser();

//     if (!user) {
//       setError("Your session has expired. Please sign in again.");
//       setSubmitting(false);
//       return;
//     }

//     // 1. Upload the attachment, if one was provided.
//     let attachment: { name: string; url: string; type: string } | null = null;

//     if (file) {
//       const path = `${Date.now()}-${file.name}`;
//       const { error: uploadError } = await supabase.storage
//         .from(BUCKET)
//         .upload(path, file);

//       if (uploadError) {
//         setError("File upload failed. Please try again.");
//         setSubmitting(false);
//         return;
//       }

//       const { data: publicUrlData } = supabase.storage
//         .from(BUCKET)
//         .getPublicUrl(path);
//       attachment = {
//         name: file.name,
//         url: publicUrlData.publicUrl,
//         type: extToType(file.name),
//       };
//     }

//     // 2. Insert the minute row.
// //     const { data, error: insertError } = await supabase
// //       .from("minutes")
// //       .insert({
// //         title: title.trim(),
// //         description: description.trim(),
// //         date: new Date().toISOString().slice(0, 10),
// //         attachment_name: attachment?.name ?? null,
// //         attachment_url: attachment?.url ?? null,
// //         attachment_type: attachment?.type ?? null,
// //         created_by: user.id,
// //       })
// //       .select("id")
// //       .single();

// //     setSubmitting(false);

// //     if (insertError) {
// //       setError("Couldn't save the minute. Please try again.");
// //       return;
// //     }

// //     setSuccess(true);
// //     resetForm();
// //     onUploaded?.(data.id as string);
// //   };

// //insert the minute row

// const {data,error:any } = await supabase.from("minutes").insert({
//   title: title.trim(),
//   description: description.trim(),
//   date: new Date().toISOString().slice(0, 10),
//    attachment_name: attachment?.name ?? null,
//   attachment_url: attachment?.url ?? null,
//   attachment_type: attachment?.type ?? null,
//   created_by: user.id,
// })
// .select("id")
// .single();

//   return (
//     <form onSubmit={handleSubmit} className={styles.form} noValidate>
//       <div className={styles.field}>
//         <label htmlFor="minute-title" className={styles.label}>
//           Title
//         </label>
//         <input
//           id="minute-title"
//           required
//           value={title}
//           onChange={(e) => setTitle(e.target.value)}
//           className={styles.input}
//           placeholder="e.g. Budget Committee Session"
//         />
//       </div>

//       <div className={styles.field}>
//         <label htmlFor="minute-description" className={styles.label}>
//           Description
//         </label>
//         <textarea
//           id="minute-description"
//           required
//           rows={5}
//           value={description}
//           onChange={(e) => setDescription(e.target.value)}
//           className={styles.textarea}
//           placeholder="Summarize what was discussed…"
//         />
//       </div>

//       <div className={styles.field}>
//         <label htmlFor="minute-file" className={styles.label}>
//           File <span className={styles.labelHint}>(PDF, DOCX, or TXT)</span>
//         </label>
//         <label className={styles.fileDrop} data-filled={Boolean(file)}>
//           <Paperclip size={16} strokeWidth={2} />
//           <span className={styles.fileDropText}>
//             {file ? file.name : "Choose a file…"}
//           </span>
//           <input
//             id="minute-file"
//             type="file"
//             accept=".pdf,.docx,.txt"
//             className={styles.fileInput}
//             onChange={(e) => setFile(e.target.files?.[0] ?? null)}
//           />
//         </label>
//       </div>

//       {error && (
//         <div className={styles.alert} role="alert">
//           <AlertCircle size={15} strokeWidth={2.5} />
//           {error}
//         </div>
//       )}

//       {success && (
//         <div className={styles.successAlert} role="status">
//           Minute uploaded successfully.
//         </div>
//       )}

//       <button type="submit" className={styles.submitBtn} disabled={submitting}>
//         {submitting ? (
//           <span className={styles.spinner} aria-hidden="true" />
//         ) : (
//           <>
//             <UploadCloud size={16} strokeWidth={2.5} />
//             Upload Minute
//           </>
//         )}
//       </button>
//     </form>
//   );
// }
// }
