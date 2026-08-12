"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface Report {
  id: string;
  title: string;
  description: string;
  user_id: string;
}

export default function QuarterlyReports() {
  const supabase = useMemo(() => createClient(), []);
  const [reports, setReports] = useState<Report[]>([]);
  const [userId, setUserId] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    const { data } = await supabase
      .from("quarterly_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setReports(data);
    }
  }, [supabase]);

  const initialize = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setUserId(user.id);
    }

    await loadReports();
  }, [loadReports, supabase]);

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => {
      void initialize();
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [initialize]);

  async function saveReport() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    if (editingId) {
      const { error } = await supabase
        .from("quarterly_reports")
        .update({
          title,
          description,
        })
        .eq("id", editingId);

      if (!error) {
        resetForm();
        loadReports();
      }

      return;
    }

    const { error } = await supabase.from("quarterly_reports").insert({
      title,
      description,
      user_id: user.id,
    });

    if (!error) {
      resetForm();
      loadReports();
    }
  }

  async function deleteReport(id: string) {
    const confirmed = window.confirm("Delete this report?");

    if (!confirmed) return;

    const { error } = await supabase
      .from("quarterly_reports")
      .delete()
      .eq("id", id);

    if (!error) {
      loadReports();
    }
  }

  function editReport(report: Report) {
    setEditingId(report.id);
    setTitle(report.title);
    setDescription(report.description);
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setDescription("");
  }

  return (
    <div className="container py-5">
      <h2 className="mb-4 fw-bold text-primary">Quarterly Reports</h2>

      <div className="card shadow-sm mb-5">
        <div className="card-body">
          <input
            className="form-control mb-3"
            placeholder="Report Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            rows={5}
            className="form-control mb-3"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="d-flex gap-2">
            <button className="btn btn-primary" onClick={saveReport}>
              {editingId ? "Update Report" : "Save Report"}
            </button>

            {editingId && (
              <button className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="row">
        {reports.map((report) => (
          <div className="col-lg-6 mb-4" key={report.id}>
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h4>{report.title}</h4>

                <p>{report.description}</p>

                {report.user_id === userId && (
                  <div className="mt-3">
                    <button
                      className="btn btn-warning me-2"
                      onClick={() => editReport(report)}
                    >
                      Edit
                    </button>

                    <button
                      className="btn btn-danger"
                      onClick={() => deleteReport(report.id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
