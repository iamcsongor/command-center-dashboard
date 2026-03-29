"use client";

import { Todo } from "@/lib/database.types";

interface StatusBarProps {
  todos: Todo[];
}

const STATUS_COLORS: Record<string, string> = {
  backlog: "#44445a",
  todo: "#3b82f6",
  in_progress: "#f59e0b",
  done: "#10b981",
};

const STATUS_LABELS: Record<string, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

export default function StatusBar({ todos }: StatusBarProps) {
  const total = todos.length || 1;
  const counts: Record<string, number> = {
    backlog: 0,
    todo: 0,
    in_progress: 0,
    done: 0,
  };
  todos.forEach((t) => counts[t.status]++);

  return (
    <div>
      <div className="status-bar" style={{ marginBottom: "8px" }}>
        {Object.entries(counts).map(
          ([status, count]) =>
            count > 0 && (
              <div
                key={status}
                style={{
                  width: `${(count / total) * 100}%`,
                  backgroundColor: STATUS_COLORS[status],
                  minWidth: "4px",
                }}
              />
            )
        )}
      </div>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {Object.entries(counts).map(([status, count]) => (
          <div
            key={status}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              color: "var(--text-secondary)",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: STATUS_COLORS[status],
              }}
            />
            <span>
              {STATUS_LABELS[status]}{" "}
              <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                {count}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
