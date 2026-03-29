"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { TodoPriority } from "@/lib/database.types";

const PRIORITY_COLORS: Record<TodoPriority, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#10b981",
};

export default function AddTodo() {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TodoPriority>("medium");
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsAdding(true);
    await supabase.from("todos").insert({
      title: title.trim(),
      status: "todo",
      priority,
      source_meeting: null,
    });
    setTitle("");
    setPriority("medium");
    setIsAdding(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px" }}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a task..."
        style={{
          flex: 1,
          padding: "10px 14px",
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          color: "var(--text-primary)",
          fontSize: "13px",
          outline: "none",
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "var(--accent-blue)")}
        onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
      />
      <button
        type="button"
        onClick={() => {
          const p: TodoPriority[] = ["low", "medium", "high"];
          setPriority(p[(p.indexOf(priority) + 1) % p.length]);
        }}
        style={{
          padding: "0 12px",
          backgroundColor: `${PRIORITY_COLORS[priority]}15`,
          border: `1px solid ${PRIORITY_COLORS[priority]}40`,
          borderRadius: "10px",
          color: PRIORITY_COLORS[priority],
          fontSize: "11px",
          fontWeight: 700,
          cursor: "pointer",
          textTransform: "uppercase",
        }}
        title="Click to cycle priority"
      >
        {priority}
      </button>
      <button
        type="submit"
        disabled={isAdding || !title.trim()}
        style={{
          padding: "0 16px",
          backgroundColor: "var(--accent-blue)",
          border: "none",
          borderRadius: "10px",
          color: "white",
          fontSize: "13px",
          fontWeight: 600,
          cursor: title.trim() ? "pointer" : "not-allowed",
          opacity: title.trim() ? 1 : 0.4,
          transition: "opacity 0.2s",
        }}
      >
        +
      </button>
    </form>
  );
}
