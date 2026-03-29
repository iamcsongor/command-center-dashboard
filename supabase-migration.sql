-- ============================================
-- REALTIME TODO DASHBOARD - Supabase Migration
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Create custom types
CREATE TYPE todo_status AS ENUM ('backlog', 'todo', 'in_progress', 'done');
CREATE TYPE todo_priority AS ENUM ('low', 'medium', 'high');

-- 2. Create todos table
CREATE TABLE todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  status todo_status NOT NULL DEFAULT 'backlog',
  priority todo_priority NOT NULL DEFAULT 'medium',
  source_meeting TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Create meeting_summaries table
CREATE TABLE meeting_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  meeting_title TEXT NOT NULL,
  summary TEXT NOT NULL,
  key_decisions TEXT[] DEFAULT '{}',
  follow_ups TEXT[] DEFAULT '{}',
  action_items_count INTEGER DEFAULT 0,
  meeting_date DATE NOT NULL DEFAULT CURRENT_DATE,
  processed_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Create processed_files table (track which Fathom transcripts have been scanned)
CREATE TABLE processed_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL UNIQUE,
  file_hash TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. Auto-update updated_at on todos
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 6. Create indexes for performance
CREATE INDEX idx_todos_status ON todos(status);
CREATE INDEX idx_todos_priority ON todos(priority);
CREATE INDEX idx_todos_updated_at ON todos(updated_at DESC);
CREATE INDEX idx_meeting_summaries_date ON meeting_summaries(meeting_date DESC);
CREATE INDEX idx_processed_files_filename ON processed_files(filename);

-- 7. Enable Row Level Security (open access, no auth)
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to todos" ON todos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to meeting_summaries" ON meeting_summaries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to processed_files" ON processed_files FOR ALL USING (true) WITH CHECK (true);

-- 8. Enable Realtime on todos and meeting_summaries
ALTER PUBLICATION supabase_realtime ADD TABLE todos;
ALTER PUBLICATION supabase_realtime ADD TABLE meeting_summaries;

-- ============================================
-- Done! Your tables are ready.
-- ============================================
