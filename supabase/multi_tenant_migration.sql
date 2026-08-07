-- =============================================================================
-- Multi-Tenant Migration & Data Isolation
-- =============================================================================

-- IMPORTANT: This script assumes 'bhaduri18@gmail.com' already exists in the auth.users table.
-- If she has not signed up / logged in at least once via Supabase Auth, this will fail on step 3.

-- 1. Add user_id columns (initially nullable so it doesn't crash on existing data)
ALTER TABLE textbooks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE batches ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE batch_schedules ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE students ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE fee_records ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE exams ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE score_records ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE personal_slots ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE personal_slot_schedules ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE promotion_history ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 2. Assign all existing data to your mother's account safely
DO $$
DECLARE
  v_mother_id UUID;
BEGIN
  SELECT id INTO v_mother_id FROM auth.users WHERE email = 'bhaduri18@gmail.com';
  
  IF v_mother_id IS NULL THEN
    RAISE EXCEPTION 'Mother email bhaduri18@gmail.com not found in auth.users. Please ensure she has signed up before running this script!';
  END IF;

  UPDATE textbooks SET user_id = v_mother_id WHERE user_id IS NULL;
  UPDATE batches SET user_id = v_mother_id WHERE user_id IS NULL;
  UPDATE batch_schedules SET user_id = v_mother_id WHERE user_id IS NULL;
  UPDATE students SET user_id = v_mother_id WHERE user_id IS NULL;
  UPDATE fee_records SET user_id = v_mother_id WHERE user_id IS NULL;
  UPDATE attendance_records SET user_id = v_mother_id WHERE user_id IS NULL;
  UPDATE exams SET user_id = v_mother_id WHERE user_id IS NULL;
  UPDATE score_records SET user_id = v_mother_id WHERE user_id IS NULL;
  UPDATE settings SET user_id = v_mother_id WHERE user_id IS NULL;
  UPDATE personal_slots SET user_id = v_mother_id WHERE user_id IS NULL;
  UPDATE personal_slot_schedules SET user_id = v_mother_id WHERE user_id IS NULL;
  UPDATE promotion_history SET user_id = v_mother_id WHERE user_id IS NULL;
END $$;

-- 3. Lock down the columns so new data MUST have a user, defaulting to whoever is logged in!
ALTER TABLE textbooks ALTER COLUMN user_id SET DEFAULT auth.uid(), ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE batches ALTER COLUMN user_id SET DEFAULT auth.uid(), ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE batch_schedules ALTER COLUMN user_id SET DEFAULT auth.uid(), ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE students ALTER COLUMN user_id SET DEFAULT auth.uid(), ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE fee_records ALTER COLUMN user_id SET DEFAULT auth.uid(), ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE attendance_records ALTER COLUMN user_id SET DEFAULT auth.uid(), ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE exams ALTER COLUMN user_id SET DEFAULT auth.uid(), ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE score_records ALTER COLUMN user_id SET DEFAULT auth.uid(), ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE settings ALTER COLUMN user_id SET DEFAULT auth.uid(), ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE personal_slots ALTER COLUMN user_id SET DEFAULT auth.uid(), ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE personal_slot_schedules ALTER COLUMN user_id SET DEFAULT auth.uid(), ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE promotion_history ALTER COLUMN user_id SET DEFAULT auth.uid(), ALTER COLUMN user_id SET NOT NULL;

-- 4. Update Row Level Security (RLS) to enforce strictly 1-to-1 data mapping
DROP POLICY IF EXISTS "Authenticated access" ON textbooks;
DROP POLICY IF EXISTS "Authenticated access" ON batches;
DROP POLICY IF EXISTS "Authenticated access" ON batch_schedules;
DROP POLICY IF EXISTS "Authenticated access" ON students;
DROP POLICY IF EXISTS "Authenticated access" ON fee_records;
DROP POLICY IF EXISTS "Authenticated access" ON attendance_records;
DROP POLICY IF EXISTS "Authenticated access" ON exams;
DROP POLICY IF EXISTS "Authenticated access" ON score_records;
DROP POLICY IF EXISTS "Authenticated access" ON settings;
DROP POLICY IF EXISTS "Authenticated access" ON personal_slots;
DROP POLICY IF EXISTS "Authenticated access" ON personal_slot_schedules;
DROP POLICY IF EXISTS "Authenticated access" ON promotion_history;

CREATE POLICY "Multi-tenant access" ON textbooks FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Multi-tenant access" ON batches FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Multi-tenant access" ON batch_schedules FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Multi-tenant access" ON students FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Multi-tenant access" ON fee_records FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Multi-tenant access" ON attendance_records FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Multi-tenant access" ON exams FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Multi-tenant access" ON score_records FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Multi-tenant access" ON settings FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Multi-tenant access" ON personal_slots FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Multi-tenant access" ON personal_slot_schedules FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Multi-tenant access" ON promotion_history FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 5. Add user_id indexes for lightning fast isolation filtering
CREATE INDEX idx_textbooks_user_id ON textbooks(user_id);
CREATE INDEX idx_batches_user_id ON batches(user_id);
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_settings_user_id ON settings(user_id);

-- 6. Scope Unique Constraints to user_id
-- The original schema had global unique constraints. Now that we are multi-tenant, 
-- we must include user_id in these constraints so different users can have textbooks with the same name.
ALTER TABLE textbooks DROP CONSTRAINT IF EXISTS textbooks_series_name_grade_key;
ALTER TABLE textbooks ADD CONSTRAINT textbooks_user_id_series_name_grade_key UNIQUE (user_id, series_name, grade);

ALTER TABLE students DROP CONSTRAINT IF EXISTS students_student_code_key;
ALTER TABLE students ADD CONSTRAINT students_user_id_student_code_key UNIQUE (user_id, student_code);
