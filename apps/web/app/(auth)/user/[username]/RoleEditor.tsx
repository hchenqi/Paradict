"use client";

import { useState } from "react";

export default function ({
  username,
  role: initialRole,
}: {
  username: string;
  role: string;
}) {
  const [role, setRole] = useState(initialRole);
  const [message, setMessage] = useState("");
  async function updateRole(nextRole: string) {
    setRole(nextRole);
    const response = await fetch(
      `/api/users/${encodeURIComponent(username)}/role`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      },
    );
    setMessage(response.ok ? "Role updated." : "Unable to update role.");
  }
  return (
    <div className="role-editor">
      <label>
        Role
        <select
          value={role}
          onChange={event => updateRole(event.target.value)}
        >
          <option value="member">Member</option>
          <option value="editor">Editor</option>
          <option value="admin">Admin</option>
        </select>
      </label>
      {message && <p className="auth-message">{message}</p>}
    </div>
  );
}
