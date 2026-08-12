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
  Row,
  Col,
  Card,
  Form,
  Button,
  Modal,
  Spinner,
  Alert,
  Badge,
} from "react-bootstrap";
import {
  FileText,
  Upload,
  Download,
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
} from "lucide-react";
import styles from "./style.module.css";

interface Report {
  id: string;
  title: string;
  description: string;
  file_url: string;
  user_id: string;
  email: string;
  created_at: string;
}

const STORAGE_BUCKET = "annual reports";
const ANNUAL_LAST_OPENED_KEY = "annual-reports:last-opened-at";

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

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(ANNUAL_LAST_OPENED_KEY, new Date().toISOString());
  }, []);

  // Fetch user and reports
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
        .from("annual_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports(data || []);
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
    const timestamp = Date.now();
    const fileExt = file.name.split(".").pop();
    const fileName = `${timestamp}-${Math.random()
      .toString(36)
      .substring(2, 15)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

    return publicUrl;
  };

  // Delete file from Supabase Storage
  const deleteFile = async (fileUrl: string) => {
    const path = fileUrl.split(`/${STORAGE_BUCKET}/`)[1];
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
          .from("annual_reports")
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
        await fetchReports();
      } else {
        // Create new report
        setUploadProgress(30);
        fileUrl = await uploadFile(file!, user.id);
        setUploadProgress(70);

        const { error: insertError } = await supabase
          .from("annual_reports")
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
    if (fileInputRef.current) fileInputRef.current.value = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle delete
  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id);
    setShowDeleteModal(true);
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
        .from("annual_reports")
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

  // Cancel edit
  const handleCancelEdit = () => {
    resetForm();
    setError(null);
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
    <div className={styles.pageWrapper}>
      {/* Header */}
      <div className={styles.headerGradient}>
        <Container>
          <div className={styles.headerContent}>
            <FileText className={styles.headerIcon} size={48} />
            <div>
              <h1 className={styles.headerTitle}>Annual Reports</h1>
              <p className={styles.headerSubtitle}>
                Manage, upload, preview and download annual reports.
              </p>
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-4">
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

        {/* Upload/Edit Form */}
        <Card className={`${styles.uploadCard} mb-5`}>
          <Card.Body>
            <h5 className={styles.uploadCardTitle}>
              {isEditing ? "Edit Report" : "Upload New Report"}
            </h5>
            <Form onSubmit={handleSubmit}>
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

              <Form.Group className="mb-3">
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
                <div className="mb-3">
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

              <div className="d-flex gap-2 flex-wrap">
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

                {isEditing && (
                  <Button
                    variant="secondary"
                    onClick={handleCancelEdit}
                    disabled={uploading}
                    className={styles.cancelButton}
                  >
                    <X className="me-2" size={18} />
                    Cancel Edit
                  </Button>
                )}
              </div>
            </Form>
          </Card.Body>
        </Card>

        {/* Reports List */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className={styles.sectionTitle}>
            <FileText className="me-2" size={22} />
            All Reports
            <Badge bg="primary" className="ms-2">
              {reports.length}
            </Badge>
          </h4>
        </div>

        {reports.length === 0 ? (
          // Empty state
          <Card className={`${styles.emptyStateCard} text-center py-5`}>
            <Card.Body>
              <div className={styles.emptyStateIcon}>
                <FileText size={64} />
              </div>
              <h5 className="mt-3">No Annual Reports Found</h5>
              <p className="text-muted">
                Upload your first annual report using the form above.
              </p>
              <Button
                variant="primary"
                onClick={() =>
                  document
                    .querySelector("form")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className={styles.emptyStateButton}
              >
                <Plus className="me-2" size={18} />
                Upload First Report
              </Button>
            </Card.Body>
          </Card>
        ) : (
          <Row xs={1} md={2} lg={2} className="g-4">
            {reports.map((report) => {
              const FileIcon = getFileIcon(report.file_url);
              const badgeColor = getFileBadgeColor(report.file_url);
              return (
                <Col key={report.id}>
                  <Card className={`${styles.reportCard} h-100`}>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="d-flex align-items-center">
                          <FileIcon
                            className={`${styles.reportIcon} text-${badgeColor}`}
                            size={32}
                          />
                          <div className="ms-3">
                            <h5 className={styles.reportTitle}>
                              {report.title}
                            </h5>
                            <Badge
                              bg={badgeColor}
                              className={styles.fileTypeBadge}
                            >
                              {report.file_url.split(".").pop()?.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <p className={styles.reportDescription}>
                        {report.description}
                      </p>

                      <div className={styles.reportMeta}>
                        <div className="text-muted small">
                          <div>
                            <strong>Uploaded by:</strong> {report.email}
                          </div>
                          <div>
                            <strong>Date:</strong>{" "}
                            {formatDate(report.created_at)}
                          </div>
                        </div>
                      </div>

                      <div className="d-flex flex-wrap gap-2 mt-3">
                        <Button
                          as="a"
                          variant="outline-primary"
                          size="sm"
                          href={report.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.actionButton}
                        >
                          <Eye className="me-1" size={16} />
                          Preview
                        </Button>

                        <Button
                          as="a"
                          variant="outline-success"
                          size="sm"
                          href={report.file_url}
                          download
                          className={styles.actionButton}
                        >
                          <Download className="me-1" size={16} />
                          Download
                        </Button>

                        {user && report.user_id === user.id && (
                          <>
                            <Button
                              variant="outline-warning"
                              size="sm"
                              onClick={() => handleEdit(report)}
                              className={styles.actionButton}
                            >
                              <Edit className="me-1" size={16} />
                              Edit
                            </Button>

                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteClick(report.id)}
                              className={styles.actionButton}
                            >
                              <Trash2 className="me-1" size={16} />
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Container>

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
