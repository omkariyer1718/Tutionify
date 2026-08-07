-- =============================================================================
-- Live Demo Account Showcase Seed & Auto-Reset (pg_cron)
-- =============================================================================
-- Run this script in the Supabase SQL Editor.
-- It creates a function that resets the demo account to a pristine state,
-- runs it immediately once, and then schedules it to run every 24 hours at midnight.

-- 1. Ensure extensions are enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Define the reset function
CREATE OR REPLACE FUNCTION reset_demo_account()
RETURNS void AS $function$
DECLARE
  v_demo_id UUID := gen_random_uuid();
  
  v_tb_math UUID := gen_random_uuid();
  v_tb_sci UUID := gen_random_uuid();
  v_tb_phy UUID := gen_random_uuid();
  v_tb_chem UUID := gen_random_uuid();
  
  v_batch_math UUID := gen_random_uuid();
  v_batch_sci UUID := gen_random_uuid();
  v_batch_phy UUID := gen_random_uuid();
  v_batch_chem UUID := gen_random_uuid();

  v_student_1 UUID := gen_random_uuid();
  v_student_2 UUID := gen_random_uuid();
  v_student_3 UUID := gen_random_uuid();
  v_student_4 UUID := gen_random_uuid();
  v_student_5 UUID := gen_random_uuid();
  v_student_6 UUID := gen_random_uuid();
  v_student_7 UUID := gen_random_uuid();
  v_student_8 UUID := gen_random_uuid();

  v_exam_ut1 UUID := gen_random_uuid();
  v_exam_midterm UUID := gen_random_uuid();
  
  v_slot_dinner UUID := gen_random_uuid();
  v_slot_ptm UUID := gen_random_uuid();
BEGIN

  -- 3. Clean up existing demo data
  DELETE FROM textbooks WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'dummy@tutionify.com');
  DELETE FROM auth.users WHERE email = 'dummy@tutionify.com';

  -- 4. Insert the Demo User
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
    recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    v_demo_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
    'dummy@tutionify.com', crypt('dummyPassword', gen_salt('bf')), now(), 
    now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Demo Account"}', 
    now(), now(), '', '', '', ''
  );

  -- 5. Insert Settings
  INSERT INTO settings (user_id, fee_due_day, academic_year)
  VALUES (v_demo_id, 5, 2026);

  -- 6. Insert Textbooks
  INSERT INTO textbooks (id, user_id, series_name, grade, color_code) VALUES 
    (v_tb_math, v_demo_id, 'Mathematics', 8, '#3b82f6'), -- Blue
    (v_tb_sci, v_demo_id, 'Science', 9, '#10b981'), -- Emerald
    (v_tb_phy, v_demo_id, 'Physics (CBSE)', 11, '#6366f1'), -- Indigo
    (v_tb_chem, v_demo_id, 'Chemistry (ICSE)', 12, '#f43f5e'); -- Rose

  -- 7. Insert Batches
  -- Math Grade 8: Mon, Wed, Fri (5:00 PM - 6:00 PM)
  INSERT INTO batches (id, user_id, textbook_id) VALUES (v_batch_math, v_demo_id, v_tb_math);
  INSERT INTO batch_schedules (batch_id, user_id, weekday, start_time, end_time) VALUES 
    (v_batch_math, v_demo_id, 1, '17:00', '18:00'),
    (v_batch_math, v_demo_id, 3, '17:00', '18:00'),
    (v_batch_math, v_demo_id, 5, '17:00', '18:00');

  -- Science Grade 9: Tue, Thu (6:00 PM - 7:30 PM)
  INSERT INTO batches (id, user_id, textbook_id) VALUES (v_batch_sci, v_demo_id, v_tb_sci);
  INSERT INTO batch_schedules (batch_id, user_id, weekday, start_time, end_time) VALUES 
    (v_batch_sci, v_demo_id, 2, '18:00', '19:30'),
    (v_batch_sci, v_demo_id, 4, '18:00', '19:30');

  -- Physics Grade 11: Mon, Wed (7:30 PM - 9:00 PM)
  INSERT INTO batches (id, user_id, textbook_id) VALUES (v_batch_phy, v_demo_id, v_tb_phy);
  INSERT INTO batch_schedules (batch_id, user_id, weekday, start_time, end_time) VALUES 
    (v_batch_phy, v_demo_id, 1, '19:30', '21:00'),
    (v_batch_phy, v_demo_id, 3, '19:30', '21:00');

  -- Chemistry Grade 12: Sat, Sun (10:00 AM - 12:00 PM)
  INSERT INTO batches (id, user_id, textbook_id) VALUES (v_batch_chem, v_demo_id, v_tb_chem);
  INSERT INTO batch_schedules (batch_id, user_id, weekday, start_time, end_time) VALUES 
    (v_batch_chem, v_demo_id, 6, '10:00', '12:00'),
    (v_batch_chem, v_demo_id, 0, '10:00', '12:00');

  -- 8. Insert Personal Slots
  -- Dinner Break: Mon-Fri (9:00 PM - 9:30 PM)
  INSERT INTO personal_slots (id, user_id, title, color_code) VALUES 
    (v_slot_dinner, v_demo_id, 'Dinner Break', '#f97316'),
    (v_slot_ptm, v_demo_id, 'Parent Teacher Meetings', '#8b5cf6');

  INSERT INTO personal_slot_schedules (personal_slot_id, user_id, weekday, start_time, end_time) VALUES 
    (v_slot_dinner, v_demo_id, 1, '21:00', '21:30'),
    (v_slot_dinner, v_demo_id, 2, '21:00', '21:30'),
    (v_slot_dinner, v_demo_id, 3, '21:00', '21:30'),
    (v_slot_dinner, v_demo_id, 4, '21:00', '21:30'),
    (v_slot_dinner, v_demo_id, 5, '21:00', '21:30'),
    (v_slot_ptm, v_demo_id, 6, '16:00', '18:00');

  -- 9. Insert Students
  INSERT INTO students (id, user_id, full_name, school_name, batch_id, monthly_fee, parent_phone) VALUES 
    (v_student_1, v_demo_id, 'Aarav Sharma', 'Delhi Public School', v_batch_math, 2000, '+91-9876543210'),
    (v_student_2, v_demo_id, 'Diya Patel', 'National Public School', v_batch_math, 2000, '+91-9876543211'),
    (v_student_3, v_demo_id, 'Rohan Iyer', 'Kendriya Vidyalaya', v_batch_sci, 2500, '+91-9876543212'),
    (v_student_4, v_demo_id, 'Ananya Singh', 'Ryan International', v_batch_sci, 2500, '+91-9876543213'),
    (v_student_5, v_demo_id, 'Ishaan Verma', 'Delhi Public School', v_batch_phy, 3000, '+91-9876543214'),
    (v_student_6, v_demo_id, 'Kavya Nair', 'National Public School', v_batch_phy, 3000, '+91-9876543215'),
    (v_student_7, v_demo_id, 'Vihaan Reddy', 'Kendriya Vidyalaya', v_batch_chem, 3500, '+91-9876543216'),
    (v_student_8, v_demo_id, 'Meera Deshmukh', 'Ryan International', v_batch_chem, 3500, '+91-9876543217');

  -- 10. Insert Exams
  INSERT INTO exams (id, user_id, name, max_marks, academic_year) VALUES 
    (v_exam_ut1, v_demo_id, 'Unit Test 1', 25, 2026),
    (v_exam_midterm, v_demo_id, 'Mid Terms', 100, 2026);

  -- 11. Insert Scores
  INSERT INTO score_records (user_id, student_id, exam_id, marks) VALUES 
    (v_demo_id, v_student_1, v_exam_ut1, 23),
    (v_demo_id, v_student_2, v_exam_ut1, 19),
    (v_demo_id, v_student_3, v_exam_ut1, 25),
    (v_demo_id, v_student_4, v_exam_ut1, 21),
    (v_demo_id, v_student_1, v_exam_midterm, 92),
    (v_demo_id, v_student_2, v_exam_midterm, 85);

  -- 12. Insert Fee Records (Simulate Month 8 - August)
  INSERT INTO fee_records (user_id, student_id, month, year, amount, is_paid) VALUES 
    (v_demo_id, v_student_1, 8, 2026, 2000, true),
    (v_demo_id, v_student_2, 8, 2026, 2000, false),
    (v_demo_id, v_student_3, 8, 2026, 2500, true),
    (v_demo_id, v_student_4, 8, 2026, 2500, true),
    (v_demo_id, v_student_5, 8, 2026, 3000, false);

END;
$function$ LANGUAGE plpgsql;

-- 13. Execute it immediately once to initialize the data right now
SELECT reset_demo_account();

-- 14. Unschedule if already exists, then schedule it to run every day at midnight (UTC)
SELECT cron.unschedule('reset-demo-account-daily');
SELECT cron.schedule('reset-demo-account-daily', '0 0 * * *', 'SELECT reset_demo_account()');
