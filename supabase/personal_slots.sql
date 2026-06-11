-- =============================================================================
-- Personal Slots for Timetable
-- =============================================================================

CREATE TABLE personal_slots (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT NOT NULL,
  color_code   TEXT DEFAULT '#6366f1',
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE personal_slot_schedules (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  personal_slot_id UUID NOT NULL REFERENCES personal_slots(id) ON DELETE CASCADE,
  weekday          INTEGER NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  start_time       TIME NOT NULL,
  end_time         TIME NOT NULL,
  duration_hours   NUMERIC GENERATED ALWAYS AS (EXTRACT(EPOCH FROM (end_time - start_time)) / 3600) STORED,
  
  CHECK (end_time > start_time)
);

-- Row Level Security
ALTER TABLE personal_slots          ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_slot_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated access" ON personal_slots          FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated access" ON personal_slot_schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX idx_personal_slot_schedules_slot ON personal_slot_schedules(personal_slot_id);
