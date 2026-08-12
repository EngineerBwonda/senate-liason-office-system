// app/annual-reports/AnnualReportsClient.tsx
"use client";

import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
  Container,
  Form,
  Button,
  Modal,
  Spinner,
  Alert,
  Badge,
  Table,
} from "react-bootstrap";
import {
  FileText,
  Upload,
  Download,
  Search,
  Eye,
  Edit,
  Trash2,
  File,
  FileType,
  FileSpreadsheet,
  Presentation,
  X,
  CheckCircle,
  AlertTriangle,
  Plus,
  Inbox,
  X as XIcon,
} from "lucide-react";
import styles from "./styles.module.css";

interface Report {
  id: string;
  title: string;
  description: string;
  file_url: string;
  user_id: string;
  email: string;
  created_at: string;
}

function normalizeReports(records: Report[]) {
  return Array.from(
    new Map(records.map((report) => [report.id, report])).values(),
  );
}

const STORAGE_BUCKET = "reports";
const INCOMING_LAST_OPENED_KEY = "incoming-correspondence:last-opened-at";

function getStoragePath(fileRef: string) {
  if (!fileRef) return "";

  if (!fileRef.startsWith("http")) {
    return fileRef;
  }

  const bucketSegment = `/${STORAGE_BUCKET}/`;
  const bucketIndex = fileRef.indexOf(bucketSegment);
  if (bucketIndex === -1) return fileRef;

  return fileRef.slice(bucketIndex + bucketSegment.length);
}

function getPublicUrlFromPath(
  supabaseClient: ReturnType<typeof createClient>,
  filePath: string,
) {
  const { data } = supabaseClient.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);
  return data.publicUrl;
}

const AnnualReportsClient = () => {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewReport, setPreviewReport] = useState<Report | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user and reports
  useEffect(() => {
    localStorage.setItem(INCOMING_LAST_OPENED_KEY, new Date().toISOString());
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, [supabase]);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("incoming_correspondence")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports(normalizeReports(data || []));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => {
      void fetchReports();
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [fetchReports]);

  // Keep dashboard data in sync with Supabase in real time.
  useEffect(() => {
    const channel = supabase
      .channel("incoming-correspondence-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "incoming_correspondence" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setReports((current) =>
              normalizeReports([payload.new as Report, ...current]),
            );
            return;
          }

          if (payload.eventType === "UPDATE") {
            setReports((current) =>
              normalizeReports(
                current.map((report) =>
                  report.id === (payload.new as Report).id
                    ? (payload.new as Report)
                    : report,
                ),
              ),
            );
            return;
          }

          if (payload.eventType === "DELETE") {
            setReports((current) =>
              current.filter(
                (report) => report.id !== (payload.old as Report).id,
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

  // Reset form
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setFile(null);
    setFileName("");
    setEditingId(null);
    setIsEditing(false);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Open modal for a fresh upload
  const handleOpenAddModal = () => {
    resetForm();
    setError(null);
    setShowFormModal(true);
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size (20MB)
      if (selectedFile.size > 20 * 1024 * 1024) {
        setError("File size must be less than 20MB");
        e.target.value = "";
        return;
      }

      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError(
          "Only PDF, DOC, DOCX, XLS, XLSX, PPT, and PPTX files are allowed",
        );
        e.target.value = "";
        return;
      }

      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError(null);
    }
  };

  // Upload file to Supabase Storage
  const uploadFile = async (file: File, userId: string): Promise<string> => {
    const fileExt = file.name.split(".").pop() ?? "bin";
    const filePath = `${userId}/${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    return filePath;
  };

  // Delete file from Supabase Storage
  const deleteFile = async (fileUrl: string) => {
    const path = getStoragePath(fileUrl);
    if (!path) return;

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([path]);

    if (error) throw error;
  };

  // Handle form submit (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      setError("Title and description are required");
      return;
    }

    if (!isEditing && !file) {
      setError("Please select a file to upload");
      return;
    }

    if (!user) {
      setError("You must be logged in");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(10);
      setError(null);

      let fileUrl = "";

      if (isEditing && editingId) {
        // Update existing report
        const existingReport = reports.find((r) => r.id === editingId);

        if (file) {
          // Delete old file if exists
          if (existingReport?.file_url) {
            await deleteFile(existingReport.file_url);
          }
          // Upload new file
          setUploadProgress(30);
          fileUrl = await uploadFile(file, user.id);
          setUploadProgress(70);
        } else {
          // Keep existing file URL
          fileUrl = existingReport?.file_url || "";
        }

        // Update database
        const { error: updateError } = await supabase
          .from("incoming_correspondence")
          .update({
            title: title.trim(),
            description: description.trim(),
            file_url: fileUrl,
          })
          .eq("id", editingId)
          .eq("user_id", user.id);

        if (updateError) throw updateError;

        setSuccess("Report updated successfully");
        resetForm();
        setShowFormModal(false);
        await fetchReports();
      } else {
        // Create new report
        setUploadProgress(30);
        fileUrl = await uploadFile(file!, user.id);
        setUploadProgress(70);

        const { error: insertError } = await supabase
          .from("incoming_correspondence")
          .insert([
            {
              title: title.trim(),
              description: description.trim(),
              file_url: fileUrl,
              user_id: user.id,
              email: user.email,
            },
          ]);

        if (insertError) throw insertError;

        setSuccess("Report uploaded successfully");
        resetForm();
        setShowFormModal(false);
        await fetchReports();
      }

      setUploadProgress(100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle edit
  const handleEdit = (report: Report) => {
    setTitle(report.title);
    setDescription(report.description);
    setEditingId(report.id);
    setIsEditing(true);
    setFileName("");
    setFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowFormModal(true);
  };

  // Handle delete
  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id);
    setShowDeleteModal(true);
  };

  const handlePreview = (report: Report) => {
    setPreviewReport(report);
    setShowPreviewModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;

    try {
      setIsDeleting(true);
      setError(null);

      const reportToDelete = reports.find((r) => r.id === deleteTargetId);
      if (reportToDelete?.file_url) {
        await deleteFile(reportToDelete.file_url);
      }

      const { error } = await supabase
        .from("incoming_correspondence")
        .delete()
        .eq("id", deleteTargetId)
        .eq("user_id", user?.id);

      if (error) throw error;

      setSuccess("Report deleted successfully");
      setShowDeleteModal(false);
      setDeleteTargetId(null);
      await fetchReports();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete report");
    } finally {
      setIsDeleting(false);
    }
  };

  // Cancel edit / close modal
  const handleCancelEdit = () => {
    resetForm();
    setError(null);
    setShowFormModal(false);
  };

  const closePreviewModal = () => {
    setShowPreviewModal(false);
    setPreviewReport(null);
  };

  // Get file icon based on extension
  const getFileIcon = (fileUrl: string) => {
    const ext = fileUrl.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf":
        return FileType;
      case "doc":
      case "docx":
        return FileText;
      case "xls":
      case "xlsx":
        return FileSpreadsheet;
      case "ppt":
      case "pptx":
        return Presentation;
      default:
        return File;
    }
  };

  // Get file badge color
  const getFileBadgeColor = (fileUrl: string) => {
    const ext = fileUrl.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf":
        return "danger";
      case "doc":
      case "docx":
        return "primary";
      case "xls":
      case "xlsx":
        return "success";
      case "ppt":
      case "pptx":
        return "warning";
      default:
        return "secondary";
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Extensions the Microsoft Office Online viewer can render in an iframe
  const OFFICE_PREVIEWABLE_EXTENSIONS = [
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
  ];

  const isPreviewableInFrame = (fileUrl: string) => {
    const ext = getStoragePath(fileUrl).split(".").pop()?.toLowerCase();
    if (!ext) return false;
    return ext === "pdf" || OFFICE_PREVIEWABLE_EXTENSIONS.includes(ext);
  };

  const getPreviewUrl = (fileRef: string) => {
    const filePath = getStoragePath(fileRef);
    const ext = filePath.split(".").pop()?.toLowerCase();
    const publicUrl = getPublicUrlFromPath(supabase, filePath);

    if (ext && OFFICE_PREVIEWABLE_EXTENSIONS.includes(ext)) {
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(publicUrl)}`;
    }

    // PDFs (and anything else) fall back to the direct public URL
    return publicUrl;
  };

  const resolveFileUrl = (fileRef: string) =>
    getPublicUrlFromPath(supabase, getStoragePath(fileRef));

  const filteredReports = reports.filter((report) => {
    const query = searchQuery.toLowerCase();
    return (
      report.title.toLowerCase().includes(query) ||
      report.description.toLowerCase().includes(query) ||
      report.email.toLowerCase().includes(query)
    );
  });

  // Loading state
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container-fluid px-4 py-4">
        <div className={styles.headerSection}>
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.headerIcon}>
                <FileText size={20} />
              </div>
              <div>
                <h1 className={styles.title}>Incoming Correspondence</h1>
                <p className={styles.subtitle}>
                  Manage, upload, preview and download annual reports.
                </p>
              </div>
            </div>

            <div className={styles.headerRight}>
              <div className={styles.statsBadge}>
                <span className={styles.statsNumber}>{reports.length}</span>
                <span className={styles.statsLabel}>
                  {reports.length === 1 ? "report" : "reports"}
                </span>
              </div>

              <Button
                variant="primary"
                onClick={handleOpenAddModal}
                className={styles.newDocButton}
              >
                <Plus size={18} />
                Add Correspondence
              </Button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert
            variant="danger"
            dismissible
            onClose={() => setError(null)}
            className="mb-4"
          >
            <AlertTriangle className="me-2" size={18} />
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            variant="success"
            dismissible
            onClose={() => setSuccess(null)}
            className="mb-4"
          >
            <CheckCircle className="me-2" size={18} />
            {success}
          </Alert>
        )}

        <div className={styles.toolbar}>
          <div className={styles.searchBar}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by title, description or uploader..."
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
                <XIcon size={16} />
              </button>
            )}
          </div>
        </div>

        <div className={styles.resultsInfo}>
          <span className={styles.resultsCount}>
            {filteredReports.length}{" "}
            {filteredReports.length === 1 ? "result" : "results"}
          </span>
          {searchQuery && (
            <span className={styles.searchTerm}>
              for &quot;{searchQuery}&quot;
            </span>
          )}
        </div>

        <div className={styles.tableContainer}>
          {filteredReports.length === 0 ? (
            // Empty state
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>
                <Inbox size={56} />
              </div>
              <h5 className="mt-3">No Annual Reports Found</h5>
              <p className="text-muted">
                Upload your first annual report to get started.
              </p>
              <Button
                variant="primary"
                onClick={handleOpenAddModal}
                className={styles.emptyStateButton}
              >
                <Plus className="me-2" size={18} />
                Upload First Report
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <Table
                className={`table table-hover align-middle mb-0 ${styles.reportsTable}`}
              >
                <thead className={styles.tableHead}>
                  <tr>
                    <th>Report</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Uploaded by</th>
                    <th>Date</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => {
                    const FileIcon = getFileIcon(report.file_url);
                    const badgeColor = getFileBadgeColor(report.file_url);
                    const canManage = !!user && report.user_id === user.id;

                    return (
                      <tr key={report.id} className={styles.tableRow}>
                        <td>
                          <div className={styles.titleCell}>
                            <span
                              className={`${styles.fileIconWrap} text-${badgeColor}`}
                            >
                              <FileIcon size={20} />
                            </span>
                            <span className={styles.reportTitle}>
                              {report.title}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={styles.descriptionCell}>
                            {report.description}
                          </span>
                        </td>
                        <td>
                          <Badge
                            bg={badgeColor}
                            className={styles.fileTypeBadge}
                          >
                            {report.file_url.split(".").pop()?.toUpperCase()}
                          </Badge>
                        </td>
                        <td>
                          <span className={styles.metaText}>
                            {report.email}
                          </span>
                        </td>
                        <td>
                          <span className={styles.metaText}>
                            {formatDate(report.created_at)}
                          </span>
                        </td>
                        <td>
                          <div className={styles.actionsCell}>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handlePreview(report)}
                              className={styles.actionIconButton}
                              title="Preview"
                            >
                              <Eye size={15} />
                            </Button>

                            <Button
                              as="a"
                              variant="outline-success"
                              size="sm"
                              href={resolveFileUrl(report.file_url)}
                              download
                              className={styles.actionIconButton}
                              title="Download"
                            >
                              <Download size={15} />
                            </Button>

                            {canManage && (
                              <>
                                <Button
                                  variant="outline-warning"
                                  size="sm"
                                  onClick={() => handleEdit(report)}
                                  className={styles.actionIconButton}
                                  title="Edit"
                                >
                                  <Edit size={15} />
                                </Button>

                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDeleteClick(report.id)}
                                  className={styles.actionIconButton}
                                  title="Delete"
                                >
                                  <Trash2 size={15} />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        show={showFormModal}
        onHide={handleCancelEdit}
        centered
        backdrop={uploading ? "static" : true}
      >
        <Modal.Header closeButton={!uploading}>
          <Modal.Title className={styles.modalTitle}>
            {isEditing ? (
              <>
                <Edit size={20} className="me-2" />
                Edit Report
              </>
            ) : (
              <>
                <Upload size={20} className="me-2" />
                Upload New Report
              </>
            )}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter report title"
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTitle(e.target.value)
                }
                required
                disabled={uploading}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Enter report description"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setDescription(e.target.value)
                }
                required
                disabled={uploading}
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>
                {isEditing ? "Replace File (Optional)" : "Select File"}
              </Form.Label>
              <Form.Control
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                disabled={uploading}
              />
              <Form.Text className="text-muted">
                Allowed: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX (Max 20MB)
              </Form.Text>
              {fileName && (
                <div className="mt-2">
                  <Badge bg="info" className={styles.fileBadge}>
                    <File className="me-1" size={14} />
                    {fileName}
                  </Badge>
                </div>
              )}
            </Form.Group>

            {uploading && (
              <div className="mt-3">
                <div className="d-flex justify-content-between mb-1">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="progress">
                  <div
                    className="progress-bar progress-bar-striped progress-bar-animated"
                    style={{ width: `${uploadProgress}%` }}
                    role="progressbar"
                    aria-valuenow={uploadProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={handleCancelEdit}
              disabled={uploading}
              className={styles.cancelButton}
            >
              <X className="me-2" size={18} />
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={uploading}
              className={styles.submitButton}
            >
              {uploading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Uploading...
                </>
              ) : (
                <>
                  {isEditing ? (
                    <Edit className="me-2" size={18} />
                  ) : (
                    <Upload className="me-2" size={18} />
                  )}
                  {isEditing ? "Update Report" : "Upload Report"}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        show={showPreviewModal}
        onHide={closePreviewModal}
        centered
        size="xl"
      >
        <Modal.Header closeButton>
          <Modal.Title className={styles.modalTitle}>
            <Eye size={20} className="me-2" />
            {previewReport?.title || "Preview Report"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {previewReport && isPreviewableInFrame(previewReport.file_url) ? (
            <iframe
              src={getPreviewUrl(previewReport.file_url)}
              title={`Preview ${previewReport.title}`}
              className={styles.previewFrame}
            />
          ) : (
            <div className={styles.previewFallback}>
              <FileText size={42} className="mb-3" />
              <h6 className="mb-2">
                Preview is not supported for this file type.
              </h6>
              <p className="text-muted mb-3">
                Use download to open the file in the appropriate application.
              </p>
              {previewReport && (
                <Button
                  as="a"
                  href={resolveFileUrl(previewReport.file_url)}
                  download
                  variant="primary"
                >
                  <Download size={16} className="me-2" />
                  Download File
                </Button>
              )}
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <AlertTriangle className="text-danger me-2" size={20} />
            Confirm Delete
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this report?</p>
          <p className="text-muted small">
            This action cannot be undone. The file will also be removed from
            storage.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={confirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="me-2" size={18} />
                Delete
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AnnualReportsClient;
