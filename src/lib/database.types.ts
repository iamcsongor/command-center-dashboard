export type TodoStatus = "backlog" | "todo" | "in_progress" | "done";
export type TodoPriority = "low" | "medium" | "high";

export interface Todo {
  id: string;
  title: string;
  status: TodoStatus;
  priority: TodoPriority;
  source_meeting: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeetingSummary {
  id: string;
  filename: string;
  meeting_title: string;
  summary: string;
  key_decisions: string[];
  follow_ups: string[];
  action_items_count: number;
  meeting_date: string;
  processed_at: string;
}

export interface ProcessedFile {
  id: string;
  filename: string;
  file_hash: string;
  processed_at: string;
}

export interface Database {
  public: {
    Tables: {
      todos: {
        Row: Todo;
        Insert: Omit<Todo, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Todo, "id" | "created_at">>;
      };
      meeting_summaries: {
        Row: MeetingSummary;
        Insert: Omit<MeetingSummary, "id" | "processed_at">;
        Update: Partial<Omit<MeetingSummary, "id">>;
      };
      processed_files: {
        Row: ProcessedFile;
        Insert: Omit<ProcessedFile, "id" | "processed_at">;
        Update: Partial<Omit<ProcessedFile, "id">>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
