"use client";

import { useEffect, useState, FormEvent } from "react";
import { createClient } from "@/utils/supabase/client";
import { useCallback, useMemo } from "react";

interface Student {
  id: string;
  name: string;
  gender: string;
  school: string;
  created_at: string;
}

export default function StudentsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [students, setStudents] = useState<Student[]>([]);
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [school, setSchool] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch students
  const fetchStudents = useCallback(async () => {
    const { data, error } = await supabase
      .from("student")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching students:", error.message);
      return;
    }
    setStudents(data as Student[]);
  }, [supabase]);

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => {
      void fetchStudents();
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [fetchStudents]);

  // Insert student
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !gender || !school) return;

    setLoading(true);
    const { error } = await supabase
      .from("student")
      .insert([{ name, gender, school }]);

    setLoading(false);

    if (error) {
      console.error("Error inserting student:", error.message);
      return;
    }

    setName("");
    setGender("");
    setSchool("");
    fetchStudents(); // refresh list
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "2rem" }}>
      <h1>Students</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: "2rem" }}>
        <div>
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Gender</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            required
          >
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label>School</label>
          <input
            type="text"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add Student"}
        </button>
      </form>

      <table border={1} cellPadding={8} style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Gender</th>
            <th>School</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>{s.gender}</td>
              <td>{s.school}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
