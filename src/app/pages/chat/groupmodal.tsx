"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { Profile } from "./typechat";
import type { User } from "@supabase/supabase-js";

interface Props {
  currentUser: User;
  onClose: () => void;
  onCreated: (groupId: string) => void;
}

export default function CreateGroupModal({
  currentUser,
  onClose,
  onCreated,
}: Props) {
  const [groupName, setGroupName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Profile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const { data, error } = await supabase
      .from("profileb")
      .select("id, email")
      .ilike("email", `%${term}%`)
      .neq("id", currentUser.id) // don't show yourself in results
      .limit(10);

    if (!error && data) {
      // Exclude already-selected users
      const selectedIds = new Set(selectedUsers.map((u) => u.id));
      setSearchResults(
        (data as Profile[]).filter((u) => !selectedIds.has(u.id)),
      );
    }
  };

  const addUser = (user: Profile) => {
    setSelectedUsers((prev) => [...prev, user]);
    setSearchResults((prev) => prev.filter((u) => u.id !== user.id));
    setSearchTerm("");
  };

  const removeUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      setError("Group name is required");
      return;
    }

    setSubmitting(true);
    setError(null);

    // 1. Create the group

    console.log("currentUser.id:", currentUser.id);
    const { data: group, error: groupError } = await supabase
      .from("groups_a")
      .insert({ name: groupName.trim(), created_by: currentUser.id })
      .select()
      .single();
    console.log("insert error:", groupError);

    if (groupError || !group) {
      setError(groupError?.message ?? "Failed to create group");
      setSubmitting(false);
      return;
    }

    // 2. Add the creator + selected users as members
    const memberRows = [
      { group_id: group.id, user_id: currentUser.id },
      ...selectedUsers.map((u) => ({ group_id: group.id, user_id: u.id })),
    ];

    const { error: memberError } = await supabase
      .from("group_members_a")
      .insert(memberRows);

    if (memberError) {
      setError(memberError.message);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    onCreated(group.id);
  };

  return (
    <div
      className="modal d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      tabIndex={-1}
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Create a group</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body">
            {error && <div className="alert alert-danger py-2">{error}</div>}

            <div className="mb-3">
              <label className="form-label">Group name</label>
              <input
                type="text"
                className="form-control"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Design Team"
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Add members</label>
              <input
                type="text"
                className="form-control"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by email..."
              />

              {searchResults.length > 0 && (
                <div className="list-group mt-1">
                  {searchResults.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      className="list-group-item list-group-item-action"
                      onClick={() => addUser(u)}
                    >
                      {u.email}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedUsers.length > 0 && (
              <div className="d-flex flex-wrap gap-2 mb-2">
                {selectedUsers.map((u) => (
                  <span
                    key={u.id}
                    className="badge bg-secondary d-flex align-items-center gap-1"
                  >
                    {u.email}
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      style={{ fontSize: "0.6rem" }}
                      onClick={() => removeUser(u.id)}
                    />
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCreate}
              disabled={submitting || !groupName.trim()}
            >
              {submitting ? "Creating..." : "Create group"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
