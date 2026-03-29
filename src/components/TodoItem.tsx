"use client";

import { useState } from "react";
import { Todo, TodoStatus, TodoPriority } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";

const STATUS_ORDER: TodoStatus[] = ["backlog", "todo", "in_progress", "done"];
const STATUS_ICONS: Record<TodoStatus, string> = {
  backlog: "â",
  todo: "â",
  in_progress: "â",
  done: "â",
};
const STATUS_COLORS: Record<TodoStatus, string> = {
  backlog: "#44445a",
  todo: "#3b82f6",
  in_progress: "#f59e0b",
  done: "#10b981",
};
const PRIORITY_COLORS: Record<TodoPriority, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#10b981",
};
const PRIORITY_LABELS: Record<TodoPriority, string> = {
  high: "H",
  medium: "M",
  low: "L",
};

interface TodoItemProps {
  todo: Todo;
}

export default function TodoItem({ todo }: TodoItemProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const cycleStatus = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    const currentIdx = STATUS_ORDER.indexOf(todo.status);
    const nextStatus = STATUS_ORDER[(currentIdx + 1) % STATUS_ORDER.length];
    await supabase.from("todos").update({ status: nextStatus }).eq("id", todo.id);
    setIsUpdating(false);
  };

  const cyclePriority = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    const priorities: TodoPriority[] = ["low", "medium", "high"];
    const currentIdx = priorities.indexOf(todo.priority);
    const next = priorities[(currentIdx + 1) % priorities.length];
    await supabase.from("todos").update({ priority: next }).eq("id", todo.id);
    setIsUpdating(false);
  };

  const deleteTodo = async () => {
    await supabase.from("todos").delete().eq("id", todo.id);
  };

  const isDone = todo.status === "done";

  return (
    <div
      className="animate-fade-in"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 14px",
        backgroundColor: "var(--bg-card)",
        borderRadius: "10px",
        border: "1px solid var(--border)",
        opacity: isDone ? 0.5 : 1,
        transition: "all 0.2s ease",
        cursor: "default",
      }}
    >
      {/* Status toggle */}
      <button
        onClick={cycleStatus}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "18px",
          color: STATUS_COLORS[todo.status],
          lineHeight: 1,
          flexShrink: 0,
          transition: "transform 0.15s ease",
        }}
        title={`Status: ${todo.status.replace("_", " ")} â click to advance`}
      >
        {STATUS_ICONS[todo.status]}
      </button>

      {/* Title */}
      <span
        style={{
          flex: 1,
          fontSize: "13px",
          fontWeight: 500,
          textDecoration: isDone ? "line-through" : "none",
          color: isDone ? "var(--text-muted)" : "var(--text-primary)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {todo.title}
      </span>

      {/* Source meeting badge */}
      {todo.source_meeting && (
        <span
          style={{
            fontSize: "10px",
            color: "var(--accent-purple)",
            backgroundColor: "rgba(139, 92, 246, 0.1)",
            padding: "2px 6px",
            borderRadius: "4px",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          ð {todo.source_meeting.length > 15
            ? todo.source_meeting.slice(0, 15) + "â¦"
            : todo.source_meeting}
        </span>
      )}

      {/* Priority badge */}
      <button
        onClick={cyclePriority}
        style={{
          background: `${PRIORITY_COLORS[todo.priority]}20`,
          border: `1px solid ${PRIORITY_COLORS[todo.priority]}40`,
          borderRadius: "4px",
          padding: "1px 6px",
          fontSize: "10px",
          fontWeight: 700,
          color: PRIORITY_COLORS[todo.priority],
          cursor: "pointer",
          flexShrink: 0,
        }}
        title={`Priority: ${todo.priority} â click to cycle`}
      >
        {PRIORITY_LABELS[todo.priority]}
      </button>

      {/* Time */}
      <span
        style={{
          fontSize: "10px",
          color: "var(--text-muted)",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {formatDistanceToNow(new Date(todo.updated_at), { addSuffix: true })}
      </span>

      {/* Delete */}
      <button
        onClick={deleteTodo}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "12px",
          color: "var(--text-muted)",
          padding: "2px",
          lineHeight: 1,
          opacity: 0.5,
          transition: "opacity 0.15s",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
        title="Delete"
      >
        â
      </button>
    </div>
  );
}
