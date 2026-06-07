-- =============================================================================
-- Tutionify — Supabase PostgreSQL Schema
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom Types
CREATE TYPE class_mode_type AS ENUM ('online', 'offline');

-- Sequences
CREATE SEQUENCE student_code_seq START WITH 1 INCREMENT BY 1;

-- =============================================================================
-- Tables
-- =============================================================================

-- Textbooks
CREATE TABLE textbooks (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  series_name  TEXT NOT NULL,
  grade        INTEGER NOT NULL,
  display_name TEXT,
  color_code   TEXT DEFAULT '#6366f1',
  created_at   TIMESTAMPTZ DEFAULT now(),

  UNIQUE (series_name, grade)
);

-- Batches
CREATE TABLE batches (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  textbook_id    UUID NOT NULL REFERENCES textbooks(id) ON DELETE RESTRICT,
  suffix         TEXT NOT NULL DEFAULT 'A',
  display_name   TEXT,
  weekday        INTEGER NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  start_time     TIME NOT NULL,
  end_time       TIME NOT NULL,
  duration_hours NUMERIC GENERATED ALWAYS AS (EXTRACT(EPOCH FROM (end_time - start_time)) / 3600) STORED,
  is_active      BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT now(),

  CHECK (end_time > start_time)
);

-- Students
CREATE TABLE students (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_code   TEXT UNIQUE,
  full_name      TEXT NOT NULL,
  school_name    TEXT,
  batch_id       UUID REFERENCES batches(id) ON DELETE RESTRICT,
  monthly_fee    NUMERIC NOT NULL DEFAULT 0,
  class_mode     class_mode_type DEFAULT 'offline',
  student_phone  TEXT,
  parent_phone   TEXT NOT NULL,
  join_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  notes          TEXT,
  is_passed_out  BOOLEAN DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Fee Records
CREATE TABLE fee_records (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  month      INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year       INTEGER NOT NULL,
  amount     NUMERIC NOT NULL,
  is_paid    BOOLEAN DEFAULT false,
  paid_date  DATE,
  remarks    TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE (student_id, month, year)
);

-- Attendance Records
CREATE TABLE attendance_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  batch_id        UUID NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
  attendance_date DATE NOT NULL,
  is_present      BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),

  UNIQUE (student_id, attendance_date)
);

-- Exams
CREATE TABLE exams (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  max_marks     NUMERIC NOT NULL DEFAULT 100,
  academic_year INTEGER NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Score Records
CREATE TABLE score_records (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  exam_id    UUID NOT NULL REFERENCES exams(id) ON DELETE RESTRICT,
  marks      NUMERIC NOT NULL,
  remarks    TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE (student_id, exam_id)
);

-- Settings
CREATE TABLE settings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fee_due_day   INTEGER NOT NULL DEFAULT 5 CHECK (fee_due_day >= 1 AND fee_due_day <= 28),
  academic_year INTEGER NOT NULL DEFAULT 2026,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- Trigger Functions
-- =============================================================================

-- Auto-generate textbook display_name: "Series - Grade N"
CREATE OR REPLACE FUNCTION generate_textbook_display_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.display_name := NEW.series_name || ' - Grade ' || NEW.grade;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_textbook_display_name
  BEFORE INSERT OR UPDATE ON textbooks
  FOR EACH ROW
  EXECUTE FUNCTION generate_textbook_display_name();

-- Auto-generate batch display_name: "Textbook Display Batch X"
CREATE OR REPLACE FUNCTION generate_batch_display_name()
RETURNS TRIGGER AS $$
DECLARE
  v_textbook_display TEXT;
BEGIN
  SELECT display_name INTO v_textbook_display
    FROM textbooks
   WHERE id = NEW.textbook_id;

  NEW.display_name := v_textbook_display || ' Batch ' || NEW.suffix;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_batch_display_name
  BEFORE INSERT OR UPDATE ON batches
  FOR EACH ROW
  EXECUTE FUNCTION generate_batch_display_name();

-- Auto-generate student_code: "STU-001", "STU-002", ...
CREATE OR REPLACE FUNCTION generate_student_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.student_code := 'STU-' || LPAD(nextval('student_code_seq')::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_student_code
  BEFORE INSERT ON students
  FOR EACH ROW
  EXECUTE FUNCTION generate_student_code();

-- Auto-assign batch suffix (A, B, C, ...) based on existing batches for the textbook
CREATE OR REPLACE FUNCTION auto_generate_batch_suffix()
RETURNS TRIGGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF NEW.suffix = 'A' THEN
    SELECT COUNT(*) INTO v_count
      FROM batches
     WHERE textbook_id = NEW.textbook_id;

    NEW.suffix := CHR(65 + v_count); -- A=65, B=66, ...
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_batch_suffix
  BEFORE INSERT ON batches
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_batch_suffix();

-- Prevent overlapping batch times on the same weekday
CREATE OR REPLACE FUNCTION check_batch_time_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM batches
     WHERE weekday    = NEW.weekday
       AND id        != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
       AND is_active  = true
       AND start_time < NEW.end_time
       AND end_time   > NEW.start_time
  ) THEN
    RAISE EXCEPTION 'Batch time overlaps with an existing batch on the same weekday';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_batch_time_overlap
  BEFORE INSERT OR UPDATE ON batches
  FOR EACH ROW
  EXECUTE FUNCTION check_batch_time_overlap();

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE textbooks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches            ENABLE ROW LEVEL SECURITY;
ALTER TABLE students           ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_records        ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams              ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_records      ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings           ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated access" ON textbooks          FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated access" ON batches            FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated access" ON students           FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated access" ON fee_records        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated access" ON attendance_records FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated access" ON exams              FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated access" ON score_records      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated access" ON settings           FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================================================
-- Indexes
-- =============================================================================

CREATE INDEX idx_students_active_batch    ON students(batch_id)                    WHERE NOT is_passed_out;
CREATE INDEX idx_students_passed_out      ON students(is_passed_out);
CREATE INDEX idx_fee_records_lookup       ON fee_records(student_id, year, month);
CREATE INDEX idx_attendance_student_date  ON attendance_records(student_id, attendance_date);
CREATE INDEX idx_batches_active_weekday   ON batches(weekday)                      WHERE is_active;
