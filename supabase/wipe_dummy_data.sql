-- =============================================================================
-- Wipe All Dummy Data
-- =============================================================================

-- 1. Empty all operational tables (CASCADE handles the relationships safely)
TRUNCATE TABLE 
  promotion_history,
  score_records,
  attendance_records,
  fee_records,
  students,
  batch_schedules,
  batches,
  exams,
  textbooks
CASCADE;

-- 2. Reset the student code generator so the next student is STU-001
ALTER SEQUENCE student_code_seq RESTART WITH 1;

-- Note: We are intentionally NOT truncating the 'settings' table so your 
-- Academic Year and Fee Due Day configurations remain intact.
