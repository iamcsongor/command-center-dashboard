"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Todo, MeetingSummary, TodoStatus } from "@/lib/database.types";
import StatusBar from "@/components/StatusBar";
import PriorityRing from "@/components/PriorityRing";
import TodoItem from "@/components/TodoItem";
import AddTodo from "@/components/AddTodo";
import MeetingCard from "@/components/MeetingCard";

const STATUS_TABS: { value: TodoStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "Active" },
  { value: "done", label: "Done" },
];

export default function Dashboard() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [meetings, setMeetings] = useState<MeetingSummary[]>([]);
  const [activeTab, setActiveTab] = useState<TodoStatus | "all">("all");
  const [isConnected, setIsConnected] = useState(false);

  const fetchTodos = useCallback(async () => {
    const { data } = await supabase
      .from("todos")
      .select("*")
      .order("updated_at", { ascending: false });
    if (data) setTodos(data as Todo[]);
  }, []);

  const fetchMeetings = useCallback(async () => {
    const { data } = await supabase
      .from("meeting_summaries")
      .select("*")
      .order("meeting_date", { ascending: false })
      .limit(10);
    if (data) setMeetings(data as MeetingSummary[]);
  }, []);

  useEffect(() => {
    fetchTodos();
    fetchMeetings();

    // Real-time subscription for todos
    const todosChannel = supabase
      .channel("todos-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "todos" },
        () => {
          fetchTodos();
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    // Real-time subscription for meetings
    const meetingsChannel = supabase
      .channel("meetings-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meeting_summaries" },
        () => {
          fetchMeetings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(todosChannel);
      supabase.removeChannel(meetingsChannel);
    };
  }, [fetchTodos, fetchMeetings]);

  const filteredTodos =
    activeTab === "all" ? todos : todos.filter((t) => t.status === activeTab);
  const activeTodos = todos.filter((t) => t.status !== "done");
  const completedToday = todos.filter(
    (t) =>
      t.status === "done" &&
      new Date(t.updated_at).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div
      style={{
        maxWidth: "640px",
        margin: "0 auto",
        padding: "20px 16px 100px",
        minHeight: "100dvh",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 700,
              letterSpacing: "-0.5px",
            }}
          >
            Command Center
          </h1>
          <p
            style={{
              fontSize: "12px",
              color: "var(--text-secondary)",
              marginTop: "2px",
            }}
          >
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "11px",
            color: isConnected ? "var(--accent-emerald)" : "var(--text-muted)",
          }}
        >
          <div
            className={isConnected ? "pulse-dot" : ""}
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: isConnected
                ? "var(--accent-emerald)"
                : "var(--text-muted)",
            }}
          />
          {isConnected ? "Live" : "Connectingâ¦"}
        </div>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        {/* Priority breakdown */}
        <div
          className="stat-card"
          style={{
            padding: "16px",
            backgroundColor: "var(--bg-card)",
            borderRadius: "12px",
            border: "1px solid var(--border)",
          }}
        >
          <p
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "12px",
            }}
          >
            Priority Mix
          </p>
          <PriorityRing todos={activeTodos} />
        </div>

        {/* Quick stats */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div
            className="stat-card priority-high"
            style={{
              flex: 1,
              padding: "14px 16px",
              backgroundColor: "var(--bg-card)",
              borderRadius: "12px",
              border: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "var(--text-primary)",
                lineHeight: 1,
              }}
            >
              {todos.filter((t) => t.status === "in_progress").length}
            </span>
            <span
              style={{
                fontSize: "10px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginTop: "4px",
              }}
            >
              In Progress
            </span>
          </div>
          <div
            className="stat-card priority-low"
            style={{
              flex: 1,
              padding: "14px 16px",
              backgroundColor: "var(--bg-card)",
              borderRadius: "12px",
              border: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "var(--accent-emerald)",
                lineHeight: 1,
              }}
            >
              {completedToday}
            </span>
            <span
              style={{
                fontSize: "10px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginTop: "4px",
              }}
            >
              Done Today
            </span>
          </div>
        </div>
      </div>

      {/* Status distribution bar */}
      <div
        style={{
          padding: "14px 16px",
          backgroundColor: "var(--bg-card)",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          marginBottom: "20px",
        }}
      >
        <StatusBar todos={todos} />
      </div>

      {/* Recent meetings (horizontal scroll) */}
      {meetings.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <p
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "10px",
              paddingLeft: "2px",
            }}
          >
            Recent Meetings
          </p>
          <div
            style={{
              display: "flex",
              gap: "10px",
              overflowX: "auto",
              paddingBottom: "4px",
              marginLeft: "-16px",
              marginRight: "-16px",
              paddingLeft: "16px",
              paddingRight: "16px",
            }}
          >
            {meetings.map((m) => (
              <MeetingCard key={m.id} meeting={m} />
            ))}
          </div>
        </div>
      )}

      {/* Add todo */}
      <div style={{ marginBottom: "16px" }}>
        <AddTodo />
      </div>

      {/* Filter tabs */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          marginBottom: "12px",
          overflowX: "auto",
          paddingBottom: "2px",
        }}
      >
        {STATUS_TABS.map((tab) => {
          const count =
            tab.value === "all"
              ? todos.length
              : todos.filter((t) => t.status === tab.value).length;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                border: "none",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
                backgroundColor:
                  activeTab === tab.value
                    ? "rgba(59, 130, 246, 0.15)"
                    : "transparent",
                color:
                  activeTab === tab.value
                    ? "var(--accent-blue)"
                    : "var(--text-secondary)",
                transition: "all 0.15s ease",
              }}
            >
              {tab.label}
              <span
                style={{
                  marginLeft: "5px",
                  fontSize: "10px",
                  opacity: 0.7,
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Todo list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {filteredTodos.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              color: "var(--text-muted)",
              fontSize: "13px",
            }}
          >
            {todos.length === 0
              ? "No tasks yet. Add one above or wait for your next meeting digest."
              : "No tasks in this category."}
          </div>
        ) : (
          filteredTodos.map((todo) => <TodoItem key={todo.id} todo={todo} />)
        )}
      </div>
    </div>
  );
}
