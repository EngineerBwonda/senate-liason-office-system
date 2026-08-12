"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/utils/supabase/client";

type OfficeDocRecord = {
  id: string;
  title: string;
  description: string | null;
  doc: string | null;
  created_at: string;
};

function buildFilePath(fileName: string) {
  const fileExt = fileName.split(".").pop() ?? "bin";
  return `${crypto.randomUUID()}.${fileExt}`;
}

export default function OfficeDocPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [uploading, setUploading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [records, setRecords] = useState<OfficeDocRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const supabase = createClient();

  async function fetchDocs() {
    setLoading(true);
    setFetchError(null);

    const { data, error } = await supabase
      .from("office doc")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching data:", error);
      setFetchError(error.message);
    } else {
      setRecords(data ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    let isActive = true;

    Promise.resolve().then(() => {
      if (isActive) {
        void fetchDocs();
      }
    });

    return () => {
      isActive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getPublicUrl(path: string) {
    const { data } = supabase.storage.from("document").getPublicUrl(path);
    return data.publicUrl;
  }

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

    const { error: insertError } = await supabase.from("office doc").insert({
      title,
      description,
      doc: filePath,
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

    fetchDocs();
  }

  return (
    <>
      <div>
        <h1>Office Documents</h1>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
          />

          {submitError && <p style={{ color: "red" }}>{submitError}</p>}

          <button type="submit" disabled={uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </form>

        <h2>Documents</h2>
        {loading && <p>Loading...</p>}
        {fetchError && <p style={{ color: "red" }}>Error: {fetchError}</p>}
        {!loading && !fetchError && records.length === 0 && (
          <p>No documents yet.</p>
        )}

        <ul>
          {records.map((record) => (
            <li key={record.id}>
              <strong>{record.title}</strong>
              {record.description && <p>{record.description}</p>}
              {record.doc && (
                <a
                  href={getPublicUrl(record.doc)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View document
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
