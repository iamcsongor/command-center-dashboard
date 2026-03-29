"use client";

import { MeetingSummary } from "@/lib/database.types";
import { format } from "date-fns";

interface MeetingCardProps {
  meeting: MeetingSummary;
}

export default function MeetingCard({ meeting }: MeetingCardProps) {
  return (
    <div
      className="animate-fade-in"
      style={{
        padding: "14px",
        backgroundColor: "var(--bg-card)",
        borderRadius: "10px",
        border: "1px solid var(--border)",
        minWidth: "260px",
        maxWidth: "300px",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "8px",
        }}
      >
        <span
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
          }}
        >
          {meeting.meeting_title}
        </span>
        <span
          style={{
            fontSize: "10px",
            color: "var(--text-muted)",
            flexShrink: 0,
            marginLeft: "8px",
          }}
        >
          {format(new Date(meeting.meeting_date), "MMM d")}
        </span>
      </div>

      <p
        style={{
          fontSize: "12px",
          color: "var(--text-secondary)",
          lineHeight: 1.5,
          marginBottom: "10px",
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {meeting.summary}
      </p>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {meeting.action_items_count > 0 && (
          <span
            style={{
              fontSize: "10px",
              padding: "2px 8px",
              borderRadius: "4px",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              color: "var(--accent-blue)",
              fontWeight: 600,
            }}
          >
            {meeting.action_items_count} action{meeting.action_items_count !== 1 ? "s" : ""}
          </span>
        )}
        {meeting.key_decisions.length > 0 && (
          <span
            style={{
              fontSize: "10px",
              padding: "2px 8px",
              borderRadius: "4px",
              backgroundColor: "rgba(139, 92, 246, 0.1)",
              color: "var(--accent-purple)",
              fontWeight: 600,
            }}
          >
            {meeting.key_decisions.length} decision{meeting.key_decisions.length !== 1 ? "s" : ""}
          </span>
        )}
        {meeting.follow_ups.length > 0 && (
          <span
            style={{
              fontSize: "10px",
              padding: "2px 8px",
              borderRadius: "4px",
              backgroundColor: "rgba(236, 72, 153, 0.1)",
              color: "var(--accent-pink)",
              fontWeight: 600,
            }}
          >
            {meeting.follow_ups.length} follow-up{meeting.follow_ups.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  );
}
