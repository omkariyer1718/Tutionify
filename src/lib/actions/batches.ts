'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  Batch,
  BatchWithTextbook,
  BatchUpdate,
  BatchScheduleInsert
} from '@/types/database'

// -----------------------------------------------------------------------------
// Read — active batches with textbook and schedules
// -----------------------------------------------------------------------------

export async function getBatches(): Promise<{
  success: boolean
  data?: BatchWithTextbook[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data: batches, error } = await supabase
      .from('batches')
      .select('*, textbook:textbooks(*), schedules:batch_schedules(*)')
      .eq('is_active', true)
      .order('display_name', { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: batches as BatchWithTextbook[] }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to fetch batches',
    }
  }
}

// -----------------------------------------------------------------------------
// Read — batches with dynamic student count
// -----------------------------------------------------------------------------

export async function getBatchesWithStudentCount(): Promise<{
  success: boolean
  data?: BatchWithTextbook[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    // Step 1: fetch active batches with textbook and schedules
    const { data: batches, error: batchError } = await supabase
      .from('batches')
      .select('*, textbook:textbooks(*), schedules:batch_schedules(*)')
      .eq('is_active', true)
      .order('display_name', { ascending: true })

    if (batchError) {
      return { success: false, error: batchError.message }
    }

    if (!batches || batches.length === 0) {
      return { success: true, data: [] }
    }

    // Step 2: get student counts per batch
    const batchIds = batches.map((b) => b.id)
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('batch_id')
      .in('batch_id', batchIds)
      .eq('is_passed_out', false)

    if (studentError) {
      return { success: false, error: studentError.message }
    }

    // Count students per batch
    const countMap: Record<string, number> = {}
    for (const s of students || []) {
      countMap[s.batch_id] = (countMap[s.batch_id] || 0) + 1
    }

    const result: BatchWithTextbook[] = batches.map((b) => ({
      ...b,
      student_count: countMap[b.id] || 0,
    })) as BatchWithTextbook[]

    return { success: true, data: result }
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'Failed to fetch batches with student count',
    }
  }
}

// -----------------------------------------------------------------------------
// Time conflict check
// -----------------------------------------------------------------------------

export async function checkTimeConflict(
  schedules: { weekday: number; start_time: string; end_time: string }[],
  excludeBatchId?: string
): Promise<{ hasConflict: boolean; errorMsg?: string }> {
  try {
    const supabase = await createClient()

    for (const schedule of schedules) {
      let query = supabase
        .from('batch_schedules')
        .select('*, batch:batches!inner(is_active)')
        .eq('weekday', schedule.weekday)
        .eq('batch.is_active', true)

      if (excludeBatchId) {
        query = query.neq('batch_id', excludeBatchId)
      }

      const { data: existing, error } = await query

      if (error || !existing) continue

      // Check overlap
      for (const batchSchedule of existing) {
        if (
          schedule.start_time < batchSchedule.end_time &&
          batchSchedule.start_time < schedule.end_time
        ) {
          return { hasConflict: true, errorMsg: `Time conflict: Another batch already exists on Weekday ${schedule.weekday} between ${batchSchedule.start_time} and ${batchSchedule.end_time}` }
        }
      }
    }
    return { hasConflict: false }
  } catch {
    return { hasConflict: false }
  }
}

// -----------------------------------------------------------------------------
// Create
// -----------------------------------------------------------------------------

export async function createBatch(data: {
  textbook_id: string
  schedules: { weekday: number; start_time: string; end_time: string }[]
}): Promise<{ success: boolean; data?: Batch; error?: string }> {
  try {
    // Validate time overlap
    const conflictCheck = await checkTimeConflict(data.schedules)
    if (conflictCheck.hasConflict) {
      return { success: false, error: conflictCheck.errorMsg }
    }

    const supabase = await createClient()

    // 1. Insert Batch
    const { data: batch, error } = await supabase
      .from('batches')
      .insert({
        textbook_id: data.textbook_id,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    // 2. Insert Schedules
    const scheduleInserts = data.schedules.map(s => ({
      batch_id: batch.id,
      weekday: s.weekday,
      start_time: s.start_time,
      end_time: s.end_time
    }))

    if (scheduleInserts.length > 0) {
      const { error: scheduleError } = await supabase
        .from('batch_schedules')
        .insert(scheduleInserts)
      if (scheduleError) return { success: false, error: scheduleError.message }
    }

    revalidatePath('/timetable')
    revalidatePath('/batches')

    return { success: true, data: batch as Batch }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create batch',
    }
  }
}

// -----------------------------------------------------------------------------
// Update
// -----------------------------------------------------------------------------

export async function updateBatch(
  id: string,
  data: BatchUpdate,
  schedules: { weekday: number; start_time: string; end_time: string }[]
): Promise<{ success: boolean; data?: Batch; error?: string }> {
  try {
    const conflictCheck = await checkTimeConflict(schedules, id)
    if (conflictCheck.hasConflict) {
      return { success: false, error: conflictCheck.errorMsg }
    }

    const supabase = await createClient()

    // Update batch if there are fields
    let batch = null;
    if (Object.keys(data).length > 0) {
      const { data: updatedBatch, error } = await supabase
        .from('batches')
        .update(data)
        .eq('id', id)
        .select()
        .single()
      if (error) return { success: false, error: error.message }
      batch = updatedBatch
    }

    // Delete existing schedules and re-insert
    const { error: deleteError } = await supabase
      .from('batch_schedules')
      .delete()
      .eq('batch_id', id)
    
    if (deleteError) return { success: false, error: deleteError.message }

    const scheduleInserts = schedules.map(s => ({
      batch_id: id,
      weekday: s.weekday,
      start_time: s.start_time,
      end_time: s.end_time
    }))

    if (scheduleInserts.length > 0) {
      const { error: insertError } = await supabase
        .from('batch_schedules')
        .insert(scheduleInserts)
      if (insertError) return { success: false, error: insertError.message }
    }

    revalidatePath('/timetable')
    revalidatePath('/batches')

    return { success: true, data: batch as Batch }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update batch',
    }
  }
}

// -----------------------------------------------------------------------------
// Archive (soft delete)
// -----------------------------------------------------------------------------

export async function archiveBatch(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('batches')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/timetable')
    revalidatePath('/batches')

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to archive batch',
    }
  }
}
