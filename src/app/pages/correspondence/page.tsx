"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  FormEvent,
  useRef,
} from "react";
import {
  Plus,
  Search,
  X,
  Mail,
  Send,
  User,
  Calendar,
  FileText,
  Trash2,
  Eye,
  Edit,
  MessageSquare,
  Inbox,
  SortAsc,
  SortDesc,
  Paperclip,
  Download,
  File,
  FileImage,
  FileSpreadsheet,
  FileCode,
  UploadCloud,
  Maximize2,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import styles from "./styleb.module.css";

interface Correspondence {
  id: string;
  title: string;
  description: string;
  created_at: string;
  email: string;
  file: string | null;
}

type SortKey = "title" | "created_at" | "email";
type SortDir = "asc" | "desc";

function getFileExt(path: string | null) {
  if (!path) return "";
  return path.split(".").pop()?.toLowerCase() ?? "";
}

function getFileIcon(ext: string) {
  const iconMap: Record<string, any> = {
    pdf: FileText,
    doc: FileText,
    docx: FileText,
    xls: FileSpreadsheet,
    xlsx: FileSpreadsheet,
    csv: FileSpreadsheet,
    js: FileCode,
    ts: FileCode,
    html: FileCode,
    css: FileCode,
    json: FileCode,
    xml: FileCode,
    png: FileImage,
    jpg: FileImage,
    jpeg: FileImage,
    gif: FileImage,
    webp: FileImage,
    svg: FileImage,
  };
  return iconMap[ext] || File;
}

function isPreviewable(ext: string) {
  const previewable = [
    "pdf",
    "png",
    "jpg",
    "jpeg",
    "gif",
    "webp",
    "svg",
    "txt",
    "csv",
    "json",
    "xml",
    "html",
    "css",
    "js",
  ];
  return previewable.includes(ext);
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function CorrespondencePage() {
  const supabase = useMemo(() => createClient(), []);
  const [correspondences, setCorrespondences] = useState<Correspondence[]>([]);
  const [filteredCorrespondences, setFilteredCorrespondences] = useState<
    Correspondence[]
  >([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewFileExt, setPreviewFileExt] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch correspondences
  const fetchCorrespondences = useCallback(async () => {
    const { data, error } = await supabase
      .from("correspondence")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching correspondences:", error.message);
      return;
    }
    setCorrespondences(data as Correspondence[]);
    setFilteredCorrespondences(data as Correspondence[]);
  }, [supabase]);

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => {
      void fetchCorrespondences();
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [fetchCorrespondences]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("correspondence-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "correspondence" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setCorrespondences((current) => [
              payload.new as Correspondence,
              ...current,
            ]);
          }
          if (payload.eventType === "DELETE") {
            setCorrespondences((current) =>
              current.filter(
                (record) => record.id !== (payload.old as Correspondence).id,
              ),
            );
          }
          if (payload.eventType === "UPDATE") {
            setCorrespondences((current) =>
              current.map((record) =>
                record.id === (payload.new as Correspondence).id
                  ? (payload.new as Correspondence)
                  : record,
              ),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Filter and sort
  useEffect(() => {
    let result = [...correspondences];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query),
      );
    }

    result.sort((a, b) => {
      const cmp =
        sortKey === "title"
          ? a.title.localeCompare(b.title)
          : sortKey === "email"
            ? a.email.localeCompare(b.email)
            : a.created_at.localeCompare(b.created_at);
      return sortDir === "asc" ? cmp : -cmp;
    });

    setFilteredCorrespondences(result);
  }, [correspondences, searchQuery, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from("correspondence").getPublicUrl(path);
    return data.publicUrl;
  };

  const handlePreview = async (record: Correspondence) => {
    if (!record.file) return;

    const url = getPublicUrl(record.file);
    const ext = getFileExt(record.file);

    setPreviewTitle(record.title);
    setPreviewFileExt(ext);
    setPreviewUrl(url);
    setPreviewLoading(true);
    setIsPreviewOpen(true);

    // Simulate loading for large files
    setTimeout(() => setPreviewLoading(false), 500);
  };

  const handleDownload = async (record: Correspondence) => {
    if (!record.file) return;
    setDownloading(record.id);

    const { data, error } = await supabase.storage
      .from("correspondence")
      .download(record.file);

    if (error) {
      console.error("Error downloading file:", error);
      setErrorMessage("Failed to download file.");
      setDownloading(null);
      return;
    }

    const url = URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.download = record.file.split("/").pop() || "download";
    link.click();
    URL.revokeObjectURL(url);
    setDownloading(null);
  };

  const handleDelete = async (record: Correspondence) => {
    const confirmed = window.confirm(
      `Delete "${record.title}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setErrorMessage(null);

    if (record.file) {
      const { error: storageError } = await supabase.storage
        .from("correspondence")
        .remove([record.file]);

      if (storageError) {
        console.warn("Error deleting attached file:", storageError);
      }
    }

    const { error } = await supabase
      .from("correspondence")
      .delete()
      .eq("id", record.id);

    if (error) {
      console.error("Error deleting correspondence:", error.message);
      setErrorMessage(error.message);
      return;
    }

    setCorrespondences((current) =>
      current.filter((item) => item.id !== record.id),
    );
    setFilteredCorrespondences((current) =>
      current.filter((item) => item.id !== record.id),
    );

    if (previewUrl && record.file && getPublicUrl(record.file) === previewUrl) {
      setIsPreviewOpen(false);
      setPreviewUrl("");
      setPreviewTitle("");
      setPreviewFileExt("");
      setPreviewLoading(false);
    }

    setSuccessMessage("Correspondence deleted successfully.");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
      setFileSize(formatFileSize(file.size));
    } else {
      setSelectedFile(null);
      setFileName("");
      setFileSize("");
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFileName("");
    setFileSize("");
    setFileInputKey((prev) => prev + 1);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Insert correspondence with file
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    const email = user?.email;

    if (userError || !email) {
      console.error("Unable to resolve logged-in user email.", userError);
      setErrorMessage("Unable to resolve user email. Please log in again.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setUploadProgress(0);

    let filePath: string | null = null;

    // Upload file if selected
    if (selectedFile) {
      const fileExt = selectedFile.name.split(".").pop() ?? "bin";
      filePath = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("correspondence")
        .upload(filePath, selectedFile);

      if (uploadError) {
        console.error("Error uploading file:", uploadError);
        setErrorMessage(uploadError.message);
        setSubmitting(false);
        return;
      }
      setUploadProgress(100);
    }

    const { error } = await supabase
      .from("correspondence")
      .insert([{ title, description, email, file: filePath }]);

    setSubmitting(false);

    if (error) {
      console.error("Error inserting correspondence:", error.message);
      setErrorMessage(error.message);
      return;
    }

    setTitle("");
    setDescription("");
    setSelectedFile(null);
    setFileName("");
    setFileSize("");
    setFileInputKey((prev) => prev + 1);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setSuccessMessage("Correspondence submitted successfully!");
    setIsModalOpen(false);

    setTimeout(() => setSuccessMessage(null), 3000);
    fetchCorrespondences();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  const totalItems = correspondences.length;

  return (
    <div className={styles.page}>
      <div className="container-fluid px-4 py-4">
        {/* Header Section */}
        <div className={styles.headerSection}>
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.headerIcon}>
                <Mail size={20} />
              </div>
              <div>
                <h1 className={styles.title}>Correspondence</h1>
                <p className={styles.subtitle}>
                  Manage all incoming and outgoing correspondence
                </p>
              </div>
            </div>

            <div className={styles.headerRight}>
              <div className={styles.statsBadge}>
                <span className={styles.statsNumber}>{totalItems}</span>
                <span className={styles.statsLabel}>
                  {totalItems === 1 ? "item" : "items"}
                </span>
              </div>
              <button
                className={styles.newDocButton}
                onClick={() => setIsModalOpen(true)}
              >
                <Plus size={18} />
                New Correspondence
              </button>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className={styles.successMessage}>
            <div className={styles.messageIcon}>
              <Send size={16} />
            </div>
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className={styles.errorMessage}>
            <div className={styles.messageIcon}>
              <X size={16} />
            </div>
            {errorMessage}
          </div>
        )}

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchBar}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by title, description, or email..."
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

          <div className={styles.filterGroup}>
            <button
              className={`${styles.sortButton} ${sortKey === "title" ? styles.activeSort : ""}`}
              onClick={() => toggleSort("title")}
              title="Sort by title"
            >
              <FileText size={14} />
              Title
              {sortKey === "title" &&
                (sortDir === "asc" ? (
                  <SortAsc size={14} />
                ) : (
                  <SortDesc size={14} />
                ))}
            </button>
            <button
              className={`${styles.sortButton} ${sortKey === "email" ? styles.activeSort : ""}`}
              onClick={() => toggleSort("email")}
              title="Sort by sender"
            >
              <User size={14} />
              Sender
              {sortKey === "email" &&
                (sortDir === "asc" ? (
                  <SortAsc size={14} />
                ) : (
                  <SortDesc size={14} />
                ))}
            </button>
            <button
              className={`${styles.sortButton} ${sortKey === "created_at" ? styles.activeSort : ""}`}
              onClick={() => toggleSort("created_at")}
              title="Sort by date"
            >
              <Calendar size={14} />
              Date
              {sortKey === "created_at" &&
                (sortDir === "asc" ? (
                  <SortAsc size={14} />
                ) : (
                  <SortDesc size={14} />
                ))}
            </button>
          </div>
        </div>

        {/* Results Info */}
        <div className={styles.resultsInfo}>
          <span className={styles.resultsCount}>
            {filteredCorrespondences.length}{" "}
            {filteredCorrespondences.length === 1 ? "result" : "results"}
          </span>
          {searchQuery && (
            <span className={styles.searchTerm}>for {searchQuery}&quot;</span>
          )}
        </div>

        {/* Table */}
        <div className={styles.tableContainer}>
          {filteredCorrespondences.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateContent}>
                <div className={styles.emptyStateIcon}>
                  <Inbox size={48} strokeWidth={1.5} />
                </div>
                <h3 className={styles.emptyStateTitle}>
                  {searchQuery
                    ? "No matching correspondence found"
                    : "No correspondence yet"}
                </h3>
                <p className={styles.emptyStateText}>
                  {searchQuery
                    ? "Try adjusting your search terms"
                    : "Create your first correspondence entry to get started"}
                </p>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table
                className={`table table-hover align-middle mb-0 ${styles.table}`}
              >
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
                        Title{" "}
                        {sortKey === "title" &&
                          (sortDir === "asc" ? (
                            <SortAsc size={13} />
                          ) : (
                            <SortDesc size={13} />
                          ))}
                      </span>
                    </th>
                    <th scope="col">Description</th>
                    <th
                      scope="col"
                      className={styles.sortableHead}
                      onClick={() => toggleSort("email")}
                    >
                      <span className={styles.sortLabel}>
                        Sender{" "}
                        {sortKey === "email" &&
                          (sortDir === "asc" ? (
                            <SortAsc size={13} />
                          ) : (
                            <SortDesc size={13} />
                          ))}
                      </span>
                    </th>
                    <th scope="col">Attachment</th>
                    <th
                      scope="col"
                      className={styles.sortableHead}
                      onClick={() => toggleSort("created_at")}
                    >
                      <span className={styles.sortLabel}>
                        Date{" "}
                        {sortKey === "created_at" &&
                          (sortDir === "asc" ? (
                            <SortAsc size={13} />
                          ) : (
                            <SortDesc size={13} />
                          ))}
                      </span>
                    </th>
                    <th scope="col" className="text-end">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCorrespondences.map((correspondence, index) => {
                    const ext = getFileExt(correspondence.file);
                    const FileIcon = getFileIcon(ext);
                    const hasFile = !!correspondence.file;
                    const isDownloading = downloading === correspondence.id;
                    const canPreview = hasFile && isPreviewable(ext);

                    return (
                      <tr key={correspondence.id} className={styles.tableRow}>
                        <td className={styles.rowIndex}>{index + 1}</td>
                        <td>
                          <div className={styles.titleCell}>
                            <span className={styles.iconBadgeSm}>
                              <MessageSquare size={14} />
                            </span>
                            {correspondence.title}
                          </div>
                        </td>
                        <td className={styles.descriptionCell}>
                          {correspondence.description}
                        </td>
                        <td>
                          <span className={styles.emailCell}>
                            <User size={12} className={styles.emailIcon} />
                            {correspondence.email}
                          </span>
                        </td>
                        <td>
                          {hasFile ? (
                            <div className={styles.attachmentActions}>
                              <button
                                className={styles.fileAttachment}
                                onClick={() => handleDownload(correspondence)}
                                disabled={isDownloading}
                                title="Download attachment"
                              >
                                <FileIcon size={14} />
                                <span className={styles.fileName}>
                                  {correspondence.file
                                    ?.split("/")
                                    .pop()
                                    ?.slice(0, 20) || "file"}
                                </span>
                                {isDownloading ? (
                                  <span className={styles.spinning}>⟳</span>
                                ) : (
                                  <Download
                                    size={12}
                                    className={styles.downloadIcon}
                                  />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className={styles.noFile}>—</span>
                          )}
                        </td>
                        <td className={styles.dateCell}>
                          {formatDate(correspondence.created_at)}
                        </td>
                        <td className="text-end">
                          <div className={styles.rowActions}>
                            {hasFile && canPreview && (
                              <button
                                className={styles.iconButton}
                                onClick={() => handlePreview(correspondence)}
                                title="Preview document"
                                aria-label="Preview document"
                              >
                                <Eye size={16} />
                              </button>
                            )}
                            {hasFile && canPreview && (
                              <button
                                className={styles.previewAttachmentButton}
                                onClick={() => handlePreview(correspondence)}
                                title="Preview attachment"
                                aria-label="Preview attachment"
                              >
                                <Eye size={16} />
                                Preview
                              </button>
                            )}
                            {hasFile && (
                              <button
                                className={styles.iconButton}
                                onClick={() => handleDownload(correspondence)}
                                disabled={isDownloading}
                                title="Download attachment"
                              >
                                <Download size={16} />
                              </button>
                            )}
                            <button
                              className={`${styles.iconButton} ${styles.dangerButton}`}
                              title="Delete"
                              aria-label="Delete"
                              onClick={() => handleDelete(correspondence)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className={styles.overlay} onClick={() => setIsPreviewOpen(false)}>
          <div
            className={`${styles.modal} ${styles.previewModal}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderLeft}>
                <div className={styles.modalHeaderIcon}>
                  <FileText size={18} />
                </div>
                <p className={styles.modalTitle}>{previewTitle}</p>
                {previewFileExt && (
                  <span
                    className={styles.previewBadge}
                    data-type={previewFileExt}
                  >
                    {previewFileExt.toUpperCase()}
                  </span>
                )}
              </div>
              <div className={styles.modalHeaderRight}>
                <button
                  onClick={() => {
                    const record = correspondences.find(
                      (c) => c.file && getPublicUrl(c.file) === previewUrl,
                    );
                    if (record) handleDownload(record);
                  }}
                  className={styles.modalActionButton}
                  title="Download"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className={styles.modalCloseButton}
                  aria-label="Close preview"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className={styles.previewContent}>
              {previewLoading ? (
                <div className={styles.previewLoading}>
                  <div className={styles.spinner}></div>
                  <p>Loading preview...</p>
                </div>
              ) : (
                <>
                  {previewFileExt === "pdf" ? (
                    <iframe
                      src={`${previewUrl}#toolbar=1`}
                      className={styles.previewFrame}
                      title={previewTitle}
                    />
                  ) : ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(
                      previewFileExt,
                    ) ? (
                    <div className={styles.previewImageContainer}>
                      <img
                        src={previewUrl}
                        alt={previewTitle}
                        className={styles.previewImage}
                        onError={(e) => {
                          e.currentTarget.src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-family='sans-serif' font-size='14'%3ENo preview available%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    </div>
                  ) : [
                      "txt",
                      "csv",
                      "json",
                      "xml",
                      "html",
                      "css",
                      "js",
                    ].includes(previewFileExt) ? (
                    <div className={styles.previewTextContainer}>
                      <iframe
                        src={previewUrl}
                        className={styles.previewFrame}
                        title={previewTitle}
                      />
                    </div>
                  ) : (
                    <div className={styles.previewUnsupported}>
                      <File size={64} strokeWidth={1.5} />
                      <h3>Preview not available</h3>
                      <p>This file type cannot be previewed directly.</p>
                      <button
                        className={styles.previewDownloadButton}
                        onClick={() => {
                          const record = correspondences.find(
                            (c) =>
                              c.file && getPublicUrl(c.file) === previewUrl,
                          );
                          if (record) handleDownload(record);
                        }}
                      >
                        <Download size={16} />
                        Download to view
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className={styles.overlay} onClick={() => setIsModalOpen(false)}>
          <div
            className={`${styles.modal} ${styles.formModal}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderLeft}>
                <div className={styles.modalHeaderIcon}>
                  <Send size={18} />
                </div>
                <p className={styles.modalTitle}>New Correspondence</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className={styles.modalCloseButton}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="corr-title">
                  Title <span className={styles.required}>*</span>
                </label>
                <input
                  id="corr-title"
                  type="text"
                  placeholder="Enter correspondence title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className={styles.input}
                  disabled={submitting}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="corr-description">
                  Description <span className={styles.required}>*</span>
                </label>
                <textarea
                  id="corr-description"
                  placeholder="Enter correspondence details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={styles.textarea}
                  rows={3}
                  required
                  disabled={submitting}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="corr-file">
                  Attachment
                </label>
                <div className={styles.fileUploadArea}>
                  <input
                    key={fileInputKey}
                    ref={fileInputRef}
                    id="corr-file"
                    type="file"
                    onChange={handleFileChange}
                    className={styles.fileInput}
                    disabled={submitting}
                  />
                  <div className={styles.fileDropZone}>
                    {selectedFile ? (
                      <div className={styles.fileSelected}>
                        <FileText
                          size={20}
                          className={styles.fileSelectedIcon}
                        />
                        <div className={styles.fileInfo}>
                          <span className={styles.fileSelectedName}>
                            {fileName}
                          </span>
                          <span className={styles.fileSelectedSize}>
                            {fileSize}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={removeFile}
                          className={styles.fileRemove}
                          disabled={submitting}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <UploadCloud size={32} className={styles.uploadIcon} />
                        <p className={styles.uploadText}>
                          Drag & drop or{" "}
                          <span className={styles.uploadLink}>browse</span>
                        </p>
                        <p className={styles.uploadHint}>
                          Supports PDF, DOCX, images, and more (max 10MB)
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {submitting && uploadProgress > 0 && uploadProgress < 100 && (
                <div className={styles.progressContainer}>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <span className={styles.progressText}>{uploadProgress}%</span>
                </div>
              )}

              <div className={styles.formFooter}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={submitting || !title || !description}
                >
                  {submitting ? (
                    <>
                      <span className={styles.spinning}>⟳</span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Submit Correspondence
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// "use client";

// import { useCallback, useEffect, useMemo, useState, FormEvent } from "react";
// import {
//   Plus,
//   Search,
//   X,
//   Mail,
//   Send,
//   User,
//   Calendar,
//   FileText,
//   Trash2,
//   Eye,
//   Edit,
//   MessageSquare,
//   Inbox,
//   Filter,
//   SortAsc,
//   SortDesc,
// } from "lucide-react";
// import { createClient } from "@/utils/supabase/client";
// import styles from "./style.module.css";

// interface Correspondence {
//   id: string;
//   title: string;
//   description: string;
//   created_at: string;
//   email: string;
// }

// type SortKey = "title" | "created_at" | "email";
// type SortDir = "asc" | "desc";

// export default function CorrespondencePage() {
//   const supabase = useMemo(() => createClient(), []);
//   const [correspondences, setCorrespondences] = useState<Correspondence[]>([]);
//   const [filteredCorrespondences, setFilteredCorrespondences] = useState<
//     Correspondence[]
//   >([]);
//   const [title, setTitle] = useState("");
//   const [description, setDescription] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [sortKey, setSortKey] = useState<SortKey>("created_at");
//   const [sortDir, setSortDir] = useState<SortDir>("desc");
//   const [submitting, setSubmitting] = useState(false);
//   const [successMessage, setSuccessMessage] = useState<string | null>(null);
//   const [errorMessage, setErrorMessage] = useState<string | null>(null);

//   // Fetch correspondences
//   const fetchCorrespondences = useCallback(async () => {
//     const { data, error } = await supabase
//       .from("correspondence")
//       .select("*")
//       .order("created_at", { ascending: false });

//     if (error) {
//       console.error("Error fetching correspondences:", error.message);
//       return;
//     }
//     setCorrespondences(data as Correspondence[]);
//     setFilteredCorrespondences(data as Correspondence[]);
//   }, [supabase]);

//   useEffect(() => {
//     const rafId = window.requestAnimationFrame(() => {
//       void fetchCorrespondences();
//     });

//     return () => window.cancelAnimationFrame(rafId);
//   }, [fetchCorrespondences]);

//   // Realtime subscription
//   useEffect(() => {
//     const channel = supabase
//       .channel("correspondence-changes")
//       .on(
//         "postgres_changes",
//         { event: "*", schema: "public", table: "correspondence" },
//         (payload) => {
//           if (payload.eventType === "INSERT") {
//             setCorrespondences((current) => [
//               payload.new as Correspondence,
//               ...current,
//             ]);
//           }
//           if (payload.eventType === "DELETE") {
//             setCorrespondences((current) =>
//               current.filter(
//                 (record) => record.id !== (payload.old as Correspondence).id,
//               ),
//             );
//           }
//           if (payload.eventType === "UPDATE") {
//             setCorrespondences((current) =>
//               current.map((record) =>
//                 record.id === (payload.new as Correspondence).id
//                   ? (payload.new as Correspondence)
//                   : record,
//               ),
//             );
//           }
//         },
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(channel);
//     };
//   }, [supabase]);

//   // Filter and sort
//   useEffect(() => {
//     let result = [...correspondences];

//     // Filter
//     if (searchQuery) {
//       const query = searchQuery.toLowerCase();
//       result = result.filter(
//         (c) =>
//           c.title.toLowerCase().includes(query) ||
//           c.description.toLowerCase().includes(query) ||
//           c.email.toLowerCase().includes(query),
//       );
//     }

//     // Sort
//     result.sort((a, b) => {
//       const cmp =
//         sortKey === "title"
//           ? a.title.localeCompare(b.title)
//           : sortKey === "email"
//             ? a.email.localeCompare(b.email)
//             : a.created_at.localeCompare(b.created_at);
//       return sortDir === "asc" ? cmp : -cmp;
//     });

//     setFilteredCorrespondences(result);
//   }, [correspondences, searchQuery, sortKey, sortDir]);

//   const toggleSort = (key: SortKey) => {
//     if (sortKey === key) {
//       setSortDir((d) => (d === "asc" ? "desc" : "asc"));
//     } else {
//       setSortKey(key);
//       setSortDir("asc");
//     }
//   };

//   // Insert correspondence
//   const handleSubmit = async (e: FormEvent) => {
//     e.preventDefault();
//     if (!title || !description) {
//       setErrorMessage("Please fill in all required fields.");
//       return;
//     }

//     const {
//       data: { user },
//       error: userError,
//     } = await supabase.auth.getUser();

//     const email = user?.email;

//     if (userError || !email) {
//       console.error("Unable to resolve logged-in user email.", userError);
//       setErrorMessage("Unable to resolve user email. Please log in again.");
//       return;
//     }

//     setSubmitting(true);
//     setErrorMessage(null);
//     setSuccessMessage(null);

//     const { error } = await supabase
//       .from("correspondence")
//       .insert([{ title, description, email }]);

//     setSubmitting(false);

//     if (error) {
//       console.error("Error inserting correspondence:", error.message);
//       setErrorMessage(error.message);
//       return;
//     }

//     setTitle("");
//     setDescription("");
//     setSuccessMessage("Correspondence submitted successfully!");
//     setIsModalOpen(false);

//     // Clear success message after 3 seconds
//     setTimeout(() => setSuccessMessage(null), 3000);

//     fetchCorrespondences();
//   };

//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
//     if (isNaN(date.getTime())) return dateString;
//     return new Intl.DateTimeFormat("en-US", {
//       dateStyle: "medium",
//       timeStyle: "short",
//     }).format(date);
//   };

//   const totalItems = correspondences.length;

//   return (
//     <div className={styles.page}>
//       <div className="container-fluid px-4 py-4">
//         {/* Header Section */}
//         <div className={styles.headerSection}>
//           <div className={styles.header}>
//             <div className={styles.headerLeft}>
//               <div className={styles.headerIcon}>
//                 <Mail size={20} />
//               </div>
//               <div>
//                 <h1 className={styles.title}>Correspondence</h1>
//                 <p className={styles.subtitle}>
//                   Manage all incoming and outgoing correspondence
//                 </p>
//               </div>
//             </div>

//             <div className={styles.headerRight}>
//               <div className={styles.statsBadge}>
//                 <span className={styles.statsNumber}>{totalItems}</span>
//                 <span className={styles.statsLabel}>
//                   {totalItems === 1 ? "item" : "items"}
//                 </span>
//               </div>
//               <button
//                 className={styles.newDocButton}
//                 onClick={() => setIsModalOpen(true)}
//               >
//                 <Plus size={18} />
//                 New Correspondence
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Success/Error Messages */}
//         {successMessage && (
//           <div className={styles.successMessage}>
//             <div className={styles.messageIcon}>
//               <Send size={16} />
//             </div>
//             {successMessage}
//           </div>
//         )}

//         {errorMessage && (
//           <div className={styles.errorMessage}>
//             <div className={styles.messageIcon}>
//               <X size={16} />
//             </div>
//             {errorMessage}
//           </div>
//         )}

//         {/* Toolbar */}
//         <div className={styles.toolbar}>
//           <div className={styles.searchBar}>
//             <Search size={18} className={styles.searchIcon} />
//             <input
//               type="text"
//               placeholder="Search by title, description, or email..."
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               className={styles.searchInput}
//             />
//             {searchQuery && (
//               <button
//                 className={styles.clearSearch}
//                 onClick={() => setSearchQuery("")}
//                 aria-label="Clear search"
//               >
//                 <X size={16} />
//               </button>
//             )}
//           </div>

//           <div className={styles.filterGroup}>
//             <button
//               className={`${styles.sortButton} ${sortKey === "title" ? styles.activeSort : ""}`}
//               onClick={() => toggleSort("title")}
//               title="Sort by title"
//             >
//               <FileText size={14} />
//               Title
//               {sortKey === "title" &&
//                 (sortDir === "asc" ? (
//                   <SortAsc size={14} />
//                 ) : (
//                   <SortDesc size={14} />
//                 ))}
//             </button>
//             <button
//               className={`${styles.sortButton} ${sortKey === "email" ? styles.activeSort : ""}`}
//               onClick={() => toggleSort("email")}
//               title="Sort by sender"
//             >
//               <User size={14} />
//               Sender
//               {sortKey === "email" &&
//                 (sortDir === "asc" ? (
//                   <SortAsc size={14} />
//                 ) : (
//                   <SortDesc size={14} />
//                 ))}
//             </button>
//             <button
//               className={`${styles.sortButton} ${sortKey === "created_at" ? styles.activeSort : ""}`}
//               onClick={() => toggleSort("created_at")}
//               title="Sort by date"
//             >
//               <Calendar size={14} />
//               Date
//               {sortKey === "created_at" &&
//                 (sortDir === "asc" ? (
//                   <SortAsc size={14} />
//                 ) : (
//                   <SortDesc size={14} />
//                 ))}
//             </button>
//           </div>
//         </div>

//         {/* Results Info */}
//         <div className={styles.resultsInfo}>
//           <span className={styles.resultsCount}>
//             {filteredCorrespondences.length}{" "}
//             {filteredCorrespondences.length === 1 ? "result" : "results"}
//           </span>
//           {searchQuery && (
//             <span className={styles.searchTerm}>for "{searchQuery}"</span>
//           )}
//         </div>

//         {/* Table */}
//         <div className={styles.tableContainer}>
//           {filteredCorrespondences.length === 0 ? (
//             <div className={styles.emptyState}>
//               <div className={styles.emptyStateContent}>
//                 <div className={styles.emptyStateIcon}>
//                   <Inbox size={48} strokeWidth={1.5} />
//                 </div>
//                 <h3 className={styles.emptyStateTitle}>
//                   {searchQuery
//                     ? "No matching correspondence found"
//                     : "No correspondence yet"}
//                 </h3>
//                 <p className={styles.emptyStateText}>
//                   {searchQuery
//                     ? "Try adjusting your search terms"
//                     : "Create your first correspondence entry to get started"}
//                 </p>
//               </div>
//             </div>
//           ) : (
//             <div className="table-responsive">
//               <table
//                 className={`table table-hover align-middle mb-0 ${styles.table}`}
//               >
//                 <thead className={styles.tableHead}>
//                   <tr>
//                     <th scope="col" className={styles.rowIndexHead}>
//                       #
//                     </th>
//                     <th
//                       scope="col"
//                       className={styles.sortableHead}
//                       onClick={() => toggleSort("title")}
//                     >
//                       <span className={styles.sortLabel}>
//                         Title{" "}
//                         {sortKey === "title" &&
//                           (sortDir === "asc" ? (
//                             <SortAsc size={13} />
//                           ) : (
//                             <SortDesc size={13} />
//                           ))}
//                       </span>
//                     </th>
//                     <th scope="col">Description</th>
//                     <th
//                       scope="col"
//                       className={styles.sortableHead}
//                       onClick={() => toggleSort("email")}
//                     >
//                       <span className={styles.sortLabel}>
//                         Sender{" "}
//                         {sortKey === "email" &&
//                           (sortDir === "asc" ? (
//                             <SortAsc size={13} />
//                           ) : (
//                             <SortDesc size={13} />
//                           ))}
//                       </span>
//                     </th>
//                     <th
//                       scope="col"
//                       className={styles.sortableHead}
//                       onClick={() => toggleSort("created_at")}
//                     >
//                       <span className={styles.sortLabel}>
//                         Date{" "}
//                         {sortKey === "created_at" &&
//                           (sortDir === "asc" ? (
//                             <SortAsc size={13} />
//                           ) : (
//                             <SortDesc size={13} />
//                           ))}
//                       </span>
//                     </th>
//                     <th scope="col" className="text-end">
//                       Actions
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {filteredCorrespondences.map((correspondence, index) => (
//                     <tr key={correspondence.id} className={styles.tableRow}>
//                       <td className={styles.rowIndex}>{index + 1}</td>
//                       <td>
//                         <div className={styles.titleCell}>
//                           <span className={styles.iconBadgeSm}>
//                             <MessageSquare size={14} />
//                           </span>
//                           {correspondence.title}
//                         </div>
//                       </td>
//                       <td className={styles.descriptionCell}>
//                         {correspondence.description}
//                       </td>
//                       <td>
//                         <span className={styles.emailCell}>
//                           <User size={12} className={styles.emailIcon} />
//                           {correspondence.email}
//                         </span>
//                       </td>
//                       <td className={styles.dateCell}>
//                         {formatDate(correspondence.created_at)}
//                       </td>
//                       <td className="text-end">
//                         <div className={styles.rowActions}>
//                           <button
//                             className={styles.iconButton}
//                             title="View details"
//                             aria-label="View details"
//                           >
//                             <Eye size={16} />
//                           </button>
//                           <button
//                             className={styles.iconButton}
//                             title="Edit"
//                             aria-label="Edit"
//                           >
//                             <Edit size={16} />
//                           </button>
//                           <button
//                             className={`${styles.iconButton} ${styles.dangerButton}`}
//                             title="Delete"
//                             aria-label="Delete"
//                           >
//                             <Trash2 size={16} />
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Modal */}
//       {isModalOpen && (
//         <div className={styles.overlay} onClick={() => setIsModalOpen(false)}>
//           <div
//             className={`${styles.modal} ${styles.formModal}`}
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div className={styles.modalHeader}>
//               <div className={styles.modalHeaderLeft}>
//                 <div className={styles.modalHeaderIcon}>
//                   <Send size={18} />
//                 </div>
//                 <p className={styles.modalTitle}>New Correspondence</p>
//               </div>
//               <button
//                 onClick={() => setIsModalOpen(false)}
//                 className={styles.modalCloseButton}
//                 aria-label="Close modal"
//               >
//                 <X size={18} />
//               </button>
//             </div>

//             <form onSubmit={handleSubmit} className={styles.form}>
//               <div className={styles.formGroup}>
//                 <label className={styles.formLabel} htmlFor="corr-title">
//                   Title <span className={styles.required}>*</span>
//                 </label>
//                 <input
//                   id="corr-title"
//                   type="text"
//                   placeholder="Enter correspondence title"
//                   value={title}
//                   onChange={(e) => setTitle(e.target.value)}
//                   required
//                   className={styles.input}
//                   disabled={submitting}
//                 />
//               </div>

//               <div className={styles.formGroup}>
//                 <label className={styles.formLabel} htmlFor="corr-description">
//                   Description <span className={styles.required}>*</span>
//                 </label>
//                 <textarea
//                   id="corr-description"
//                   placeholder="Enter correspondence details..."
//                   value={description}
//                   onChange={(e) => setDescription(e.target.value)}
//                   className={styles.textarea}
//                   rows={4}
//                   required
//                   disabled={submitting}
//                 />
//               </div>

//               <div className={styles.formFooter}>
//                 <button
//                   type="button"
//                   className={styles.cancelButton}
//                   onClick={() => setIsModalOpen(false)}
//                   disabled={submitting}
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className={styles.submitButton}
//                   disabled={submitting || !title || !description}
//                 >
//                   {submitting ? (
//                     <>
//                       <span className={styles.spinning}>⟳</span>
//                       Submitting...
//                     </>
//                   ) : (
//                     <>
//                       <Send size={16} />
//                       Submit Correspondence
//                     </>
//                   )}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// //insert data and fetch data from supabase
// // This is a simple example of how to insert and fetch data from Supabase in a Next.js application using React hooks.

// //the name of the table is correspondence and has the following columns title and description,timestamp,and email of the user who created the record. The email is automatically added by supabase when the user is logged in.

// "use client";

// import { useCallback, useEffect, useMemo, useState, FormEvent } from "react";
// import { createClient } from "@/utils/supabase/client";

// interface Correspondence {
//   id: string;
//   title: string;
//   description: string;
//   created_at: string;
//   email: string;
// }

// export default function CorrespondencePage() {
//   const supabase = useMemo(() => createClient(), []);
//   const [correspondences, setCorrespondences] = useState<Correspondence[]>([]);
//   const [title, setTitle] = useState("");
//   const [description, setDescription] = useState("");
//   const [loading, setLoading] = useState(false);

//   // Fetch correspondences
//   const fetchCorrespondences = useCallback(async () => {
//     const { data, error } = await supabase
//       .from("correspondence")
//       .select("*")
//       .order("created_at", { ascending: false });

//     if (error) {
//       console.error("Error fetching correspondences:", error.message);
//       return;
//     }
//     setCorrespondences(data as Correspondence[]);
//   }, [supabase]);

//   useEffect(() => {
//     const rafId = window.requestAnimationFrame(() => {
//       void fetchCorrespondences();
//     });

//     return () => window.cancelAnimationFrame(rafId);
//   }, [fetchCorrespondences]);

//   // Insert correspondence
//   const handleSubmit = async (e: FormEvent) => {
//     e.preventDefault();
//     if (!title || !description) return;

//     const {
//       data: { user },
//       error: userError,
//     } = await supabase.auth.getUser();

//     const email = user?.email;

//     if (userError || !email) {
//       console.error("Unable to resolve logged-in user email.", userError);
//       return;
//     }

//     setLoading(true);
//     const { error } = await supabase
//       .from("correspondence")
//       .insert([{ title, description, email }]);

//     setLoading(false);

//     if (error) {
//       console.error("Error inserting correspondence:", error.message);
//       return;
//     }

//     setTitle("");
//     setDescription("");
//     fetchCorrespondences(); // refresh list
//   };

//   return (
//     <div>
//       <h1>Correspondence</h1>
//       <form onSubmit={handleSubmit}>
//         <input
//           type="text"
//           placeholder="Title"
//           value={title}
//           onChange={(e) => setTitle(e.target.value)}
//         />
//         <textarea
//           placeholder="Description"
//           value={description}
//           onChange={(e) => setDescription(e.target.value)}
//         />
//         <button type="submit" disabled={loading}>
//           {loading ? "Submitting..." : "Submit"}
//         </button>
//       </form>

//       <h2>Correspondence List</h2>
//       <ul>
//         {correspondences.map((correspondence) => (
//           <li key={correspondence.id}>
//             <strong>{correspondence.title}</strong> -{" "}
//             {correspondence.description} (Created by: {correspondence.email} |{" "}
//             Created at: {new Date(correspondence.created_at).toLocaleString()})
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }
