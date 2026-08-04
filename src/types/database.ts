// =============================================================================
// Tutionify — Database Type Definitions
// =============================================================================
// TypeScript types mirroring the Supabase PostgreSQL schema.
// Used throughout the Next.js app for type-safe database operations.
// =============================================================================

// -----------------------------------------------------------------------------
// Enums
// -----------------------------------------------------------------------------

export type ClassMode = 'online' | 'offline';

// -----------------------------------------------------------------------------
// Row Types (read from DB)
// -----------------------------------------------------------------------------

export interface Textbook {
  id: string;
  series_name: string;
  grade: number;
  display_name: string;
  color_code: string;
  created_at: string;
}

export interface Batch {
  id: string;
  textbook_id: string;
  suffix: string;
  display_name: string;
  created_at: string;
}

export interface BatchSchedule {
  id: string;
  batch_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  duration_hours: number;
}

export interface PersonalSlot {
  id: string;
  title: string;
  color_code: string;
  created_at: string;
}

export interface PersonalSlotSchedule {
  id: string;
  personal_slot_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  duration_hours: number;
}

export interface Student {
  id: string;
  student_code: string;
  full_name: string;
  school_name: string | null;
  batch_id: string;
  monthly_fee: number;
  class_mode: ClassMode;
  student_phone: string | null;
  parent_phone: string;
  join_date: string;
  notes: string | null;
  is_passed_out: boolean;
  created_at: string;
}

export interface FeeRecord {
  id: string;
  student_id: string;
  month: number;
  year: number;
  amount: number;
  is_paid: boolean;
  paid_date: string | null;
  remarks: string | null;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  batch_id: string;
  attendance_date: string;
  is_present: boolean;
  created_at: string;
}

export interface Exam {
  id: string;
  name: string;
  max_marks: number;
  academic_year: number;
  created_at: string;
}

export interface ScoreRecord {
  id: string;
  student_id: string;
  exam_id: string;
  marks: number;
  remarks: string | null;
  created_at: string;
}

export interface Settings {
  id: string;
  fee_due_day: number;
  academic_year: number;
  created_at: string;
}

export interface PromotionHistory {
  id: string;
  batch_id: string;
  action: 'promote' | 'pass_out';
  old_textbook_id: string | null;
  new_textbook_id: string | null;
  created_at: string;
}

// -----------------------------------------------------------------------------
// Insert Types (omit id, created_at, and auto-generated fields)
// -----------------------------------------------------------------------------

export type TextbookInsert = Omit<Textbook, 'id' | 'created_at' | 'display_name'>;

export type BatchInsert = Omit<
  Batch,
  'id' | 'created_at' | 'display_name'
> & { suffix?: string };

export type BatchScheduleInsert = Omit<BatchSchedule, 'id' | 'duration_hours'>;

export type StudentInsert = Omit<
  Student,
  'id' | 'created_at' | 'student_code' | 'is_passed_out'
>;

export type FeeRecordInsert = Omit<FeeRecord, 'id' | 'created_at'>;

export type AttendanceRecordInsert = Omit<AttendanceRecord, 'id' | 'created_at'>;

export type ExamInsert = Omit<Exam, 'id' | 'created_at'>;
export type ScoreRecordInsert = Omit<ScoreRecord, 'id' | 'created_at'>;
export type PersonalSlotInsert = Omit<PersonalSlot, 'id' | 'created_at'>;
export type PersonalSlotScheduleInsert = Omit<PersonalSlotSchedule, 'id' | 'duration_hours'>;

// -----------------------------------------------------------------------------
// Update Types (partial versions for PATCH / UPDATE operations)
// -----------------------------------------------------------------------------

export type TextbookUpdate = Partial<TextbookInsert>;

export type BatchUpdate = Partial<BatchInsert>;

export type StudentUpdate = Partial<StudentInsert> & { is_passed_out?: boolean };

export type FeeRecordUpdate = Partial<FeeRecordInsert>;

export type ExamUpdate = Partial<ExamInsert>;

export type ScoreRecordUpdate = Partial<ScoreRecordInsert>;

// -----------------------------------------------------------------------------
// Joined / Extended Types (queries that join related tables)
// -----------------------------------------------------------------------------

export interface StudentWithBatch extends Student {
  batch: Batch & { textbook: Textbook };
}

export interface BatchWithTextbook extends Batch {
  textbook: Textbook;
  student_count?: number;
  schedules: BatchSchedule[];
}

export interface PersonalSlotWithSchedules extends PersonalSlot {
  schedules: PersonalSlotSchedule[];
}

export interface FeeRecordWithStudent extends FeeRecord {
  student: Student & { batch: Batch };
}

export interface AttendanceRecordWithStudent extends AttendanceRecord {
  student: Student;
}

export interface ScoreRecordWithStudent extends ScoreRecord {
  student: Student;
}

export interface PromotionHistoryWithDetails extends PromotionHistory {
  batch: Batch;
  old_textbook: Textbook | null;
  new_textbook: Textbook | null;
}

// -----------------------------------------------------------------------------
// Utility Constants
// -----------------------------------------------------------------------------

export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export const PRESET_COLORS = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Slate', value: '#64748b' },
] as const;

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;
