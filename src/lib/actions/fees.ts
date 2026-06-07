'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { FeeRecord, FeeRecordWithStudent } from '@/types/database'

// -----------------------------------------------------------------------------
// generateMonthlyFees
// For each active student, create a fee_record with their monthly_fee amount.
// Skips students that already have a record for the given month/year.
// Returns the count of newly created records.
// -----------------------------------------------------------------------------
export async function generateMonthlyFees(
  month: number,
  year: number
): Promise<{ count: number; error?: string }> {
  try {
    const supabase = await createClient()

    // 1. Get all active students
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, monthly_fee')
      .eq('is_passed_out', false)

    if (studentsError) {
      return { count: 0, error: studentsError.message }
    }

    if (!students || students.length === 0) {
      return { count: 0, error: 'No active students found' }
    }

    // 2. Get existing fee records for this month/year to avoid duplicates
    const { data: existingRecords, error: existingError } = await supabase
      .from('fee_records')
      .select('student_id')
      .eq('month', month)
      .eq('year', year)

    if (existingError) {
      return { count: 0, error: existingError.message }
    }

    const existingStudentIds = new Set(
      (existingRecords || []).map((r) => r.student_id)
    )

    // 3. Build insert array for students that don't already have a record
    const newRecords = students
      .filter((s) => !existingStudentIds.has(s.id))
      .map((s) => ({
        student_id: s.id,
        month,
        year,
        amount: s.monthly_fee,
        is_paid: false,
        paid_date: null,
        remarks: null,
      }))

    if (newRecords.length === 0) {
      return { count: 0 }
    }

    // 4. Insert new fee records
    const { error: insertError } = await supabase
      .from('fee_records')
      .insert(newRecords)

    if (insertError) {
      return { count: 0, error: insertError.message }
    }

    revalidatePath('/fees')
    return { count: newRecords.length }
  } catch {
    return { count: 0, error: 'An unexpected error occurred' }
  }
}

// -----------------------------------------------------------------------------
// getFeeRecords
// Get all fee records for a given month/year, joined with student and batch.
// Ordered by student full_name.
// -----------------------------------------------------------------------------
export async function getFeeRecords(
  month: number,
  year: number
): Promise<{ data: FeeRecordWithStudent[]; error?: string }> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('fee_records')
      .select(
        `
        *,
        student:students (
          id,
          student_code,
          full_name,
          school_name,
          batch_id,
          monthly_fee,
          class_mode,
          student_phone,
          parent_phone,
          join_date,
          notes,
          is_passed_out,
          created_at,
          batch:batches (*)
        )
      `
      )
      .eq('month', month)
      .eq('year', year)
      .order('created_at', { ascending: true })

    if (error) {
      return { data: [], error: error.message }
    }

    // Sort by student full_name on the client side since nested ordering
    // is not straightforward with Supabase
    const sorted = (data || []).sort((a, b) => {
      const nameA = (a as FeeRecordWithStudent).student?.full_name || ''
      const nameB = (b as FeeRecordWithStudent).student?.full_name || ''
      return nameA.localeCompare(nameB)
    })

    return { data: sorted as FeeRecordWithStudent[] }
  } catch {
    return { data: [], error: 'An unexpected error occurred' }
  }
}

// -----------------------------------------------------------------------------
// markFeePaid
// Update a fee record to mark it as paid with the given date.
// -----------------------------------------------------------------------------
export async function markFeePaid(
  feeId: string,
  paidDate: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('fee_records')
      .update({ is_paid: true, paid_date: paidDate })
      .eq('id', feeId)

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/fees')
    return {}
  } catch {
    return { error: 'An unexpected error occurred' }
  }
}

// -----------------------------------------------------------------------------
// markFeeUnpaid
// Update a fee record to mark it as unpaid (clears paid_date).
// -----------------------------------------------------------------------------
export async function markFeeUnpaid(
  feeId: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('fee_records')
      .update({ is_paid: false, paid_date: null })
      .eq('id', feeId)

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/fees')
    return {}
  } catch {
    return { error: 'An unexpected error occurred' }
  }
}

// -----------------------------------------------------------------------------
// getPaymentHistory
// Get all fee records for a student ordered by year desc, month desc.
// -----------------------------------------------------------------------------
export async function getPaymentHistory(
  studentId: string
): Promise<{ data: FeeRecord[]; error?: string }> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('fee_records')
      .select('*')
      .eq('student_id', studentId)
      .order('year', { ascending: false })
      .order('month', { ascending: false })

    if (error) {
      return { data: [], error: error.message }
    }

    return { data: data || [] }
  } catch {
    return { data: [], error: 'An unexpected error occurred' }
  }
}

// -----------------------------------------------------------------------------
// getMonthlyFeeSummary
// Return summary statistics for a given month/year.
// -----------------------------------------------------------------------------
export async function getMonthlyFeeSummary(
  month: number,
  year: number
): Promise<{
  total_students: number
  paid_count: number
  unpaid_count: number
  total_collected: number
  total_pending: number
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('fee_records')
      .select('amount, is_paid')
      .eq('month', month)
      .eq('year', year)

    if (error) {
      return {
        total_students: 0,
        paid_count: 0,
        unpaid_count: 0,
        total_collected: 0,
        total_pending: 0,
        error: error.message,
      }
    }

    const records = data || []
    const total_students = records.length
    const paid_count = records.filter((r) => r.is_paid).length
    const unpaid_count = total_students - paid_count
    const total_collected = records
      .filter((r) => r.is_paid)
      .reduce((sum, r) => sum + r.amount, 0)
    const total_pending = records
      .filter((r) => !r.is_paid)
      .reduce((sum, r) => sum + r.amount, 0)

    return {
      total_students,
      paid_count,
      unpaid_count,
      total_collected,
      total_pending,
    }
  } catch {
    return {
      total_students: 0,
      paid_count: 0,
      unpaid_count: 0,
      total_collected: 0,
      total_pending: 0,
      error: 'An unexpected error occurred',
    }
  }
}
