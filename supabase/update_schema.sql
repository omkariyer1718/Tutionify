-- Drop dependent tables first
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS fee_records CASCADE;
DROP TABLE IF EXISTS score_records CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS batch_schedules CASCADE;
DROP TABLE IF EXISTS batches CASCADE;

-- Batches
CREATE TABLE batches (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  textbook_id    UUID NOT NULL REFERENCES textbooks(id) ON DELETE RESTRICT,
  suffix         TEXT NOT NULL DEFAULT 'A',
  display_name   TEXT,
  is_active      BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Batch Schedules
CREATE TABLE batch_schedules (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id       UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  weekday        INTEGER NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  start_time     TIME NOT NULL,
  end_time       TIME NOT NULL,
  duration_hours NUMERIC GENERATED ALWAYS AS (EXTRACT(EPOCH FROM (end_time - start_time)) / 3600) STORED,
  
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

-- Re-create triggers for batches and students
-- 1. Batch display name
CREATE OR REPLACE FUNCTION generate_batch_display_name()
RETURNS TRIGGER AS $$
DECLARE
  v_textbook_display TEXT;
BEGIN
  SELECT display_name INTO v_textbook_display FROM textbooks WHERE id = NEW.textbook_id;
  NEW.display_name := v_textbook_display || ' Batch ' || NEW.suffix;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_batch_display_name
  BEFORE INSERT OR UPDATE ON batches
  FOR EACH ROW
  EXECUTE FUNCTION generate_batch_display_name();

-- 2. Student code
CREATE TRIGGER trg_student_code
  BEFORE INSERT ON students
  FOR EACH ROW
  EXECUTE FUNCTION generate_student_code();

-- 3. Batch suffix
CREATE TRIGGER trg_batch_suffix
  BEFORE INSERT ON batches
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_batch_suffix();

-- 4. Prevent overlapping batch times (on batch_schedules now)
CREATE OR REPLACE FUNCTION check_batch_time_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM batch_schedules bs
      JOIN batches b ON b.id = bs.batch_id
     WHERE bs.weekday = NEW.weekday
       AND bs.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
       AND b.is_active = true
       AND bs.start_time < NEW.end_time
       AND bs.end_time > NEW.start_time
  ) THEN
    RAISE EXCEPTION 'Batch time overlaps with an existing batch on the same weekday';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_batch_time_overlap ON batches;

CREATE TRIGGER trg_batch_time_overlap
  BEFORE INSERT OR UPDATE ON batch_schedules
  FOR EACH ROW
  EXECUTE FUNCTION check_batch_time_overlap();


-- RLS
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated access" ON batches FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated access" ON batch_schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated access" ON students FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated access" ON fee_records FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated access" ON attendance_records FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated access" ON score_records FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX idx_students_active_batch ON students(batch_id) WHERE NOT is_passed_out;
CREATE INDEX idx_students_passed_out ON students(is_passed_out);
CREATE INDEX idx_fee_records_lookup ON fee_records(student_id, year, month);
CREATE INDEX idx_attendance_student_date ON attendance_records(student_id, attendance_date);
CREATE INDEX idx_batch_schedules_weekday ON batch_schedules(weekday);
