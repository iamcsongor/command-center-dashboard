"use client";

import { Todo } from "@/lib/database.types";

interface PriorityRingProps {
  todos: Todo[];
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#10b981",
};

export default function PriorityRing({ todos }: PriorityRingProps) {
  const total = todos.length || 1;
  const counts: Record<string, number> = { high: 0, medium: 0, low: 0 };
  todos.forEach((t) => counts[t.priority]++);

  const size = 100;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const segments = Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([priority, count]) => {
      const pct = count / total;
      const dashLength = pct * circumference;
      const gapLength = circumference - dashLength;
      const seg = {
        priority,
        count,
        dasharray: `${dashLength} ${gapLength}`,
        dashoffset: -offset,
        color: PRIORITY_COLORS[priority],
      };
      offset += dashLength;
      return seg;
    });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        {segments.map((seg) => (
          <circle
            key={seg.priority}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={seg.dasharray}
            strokeDashoffset={seg.dashoffset}
            strokeLinecap="round"
            style={{ transition: "all 0.5s ease" }}
          />
        ))}
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--text-primary)"
          fontSize="20"
          fontWeight="700"
          style={{ transform: "rotate(90deg)", transformOrigin: "center" }}
        >
          {todos.length}
        </text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {(["high", "medium", "low"] as const).map((p) => (
          <div
            key={p}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
            }}
          >
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "3px",
                backgroundColor: PRIORITY_COLORS[p],
              }}
            />
            <span style={{ color: "var(--text-secondary)", textTransform: "capitalize" }}>
              {p}
            </span>
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
              {counts[p]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
