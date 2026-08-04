-- 1. Drop the triggers and functions for batch suffix
DROP TRIGGER IF EXISTS trg_batch_suffix ON batches;
DROP FUNCTION IF EXISTS auto_generate_batch_suffix();

-- 2. Modify `generate_batch_display_name` function to stop appending suffix
CREATE OR REPLACE FUNCTION generate_batch_display_name()
RETURNS TRIGGER AS $$
DECLARE
  v_textbook_display TEXT;
BEGIN
  SELECT display_name INTO v_textbook_display
    FROM textbooks
   WHERE id = NEW.textbook_id;

  NEW.display_name := v_textbook_display;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Delete any existing batches that were previously 'archived'
DELETE FROM batches WHERE is_active = false;

-- 4. Modify Batches table: remove `suffix` and `is_active`, and update FK constraint
ALTER TABLE batches DROP CONSTRAINT IF EXISTS batches_textbook_id_fkey;
ALTER TABLE batches
  DROP COLUMN IF EXISTS suffix,
  DROP COLUMN IF EXISTS is_active,
  ADD CONSTRAINT batches_textbook_id_fkey
    FOREIGN KEY (textbook_id)
    REFERENCES textbooks(id)
    ON DELETE CASCADE;

-- 5. Modify Students table: update batch_id FK constraint to ON DELETE SET NULL
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_batch_id_fkey;
ALTER TABLE students
  ADD CONSTRAINT students_batch_id_fkey
    FOREIGN KEY (batch_id)
    REFERENCES batches(id)
    ON DELETE SET NULL;

-- 6. Modify Attendance Records table: update batch_id FK constraint to ON DELETE CASCADE
ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS attendance_records_batch_id_fkey;
ALTER TABLE attendance_records
  ADD CONSTRAINT attendance_records_batch_id_fkey
    FOREIGN KEY (batch_id)
    REFERENCES batches(id)
    ON DELETE CASCADE;
