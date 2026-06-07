-- =============================================================================
-- Tutionify — Seed Data
-- =============================================================================

-- Default settings
INSERT INTO settings (fee_due_day, academic_year)
VALUES (5, 2026);

-- Default exam types for academic year 2026
INSERT INTO exams (name, max_marks, academic_year) VALUES
  ('UT1',     25,  2026),
  ('Midterm', 100, 2026),
  ('UT2',     25,  2026),
  ('Finals',  100, 2026);
