'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { StudentInsert, StudentUpdate } from '@/types/database'

export async function getStudents(filters?: {
  batch_id?: string
  is_passed_out?: boolean
  class_mode?: string
  search?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('students')
    .select('*, batch:batches(*, textbook:textbooks(*))')
    .order('full_name', { ascending: true })

  // Default to active students unless explicitly set
  const passedOut = filters?.is_passed_out ?? false
  query = query.eq('is_passed_out', passedOut)

  if (filters?.batch_id) {
    query = query.eq('batch_id', filters.batch_id)
  }

  if (filters?.class_mode && filters.class_mode !== 'all') {
    query = query.eq('class_mode', filters.class_mode)
  }

  if (filters?.search) {
    query = query.or(
      `full_name.ilike.%${filters.search}%,parent_phone.ilike.%${filters.search}%`
    )
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch students: ${error.message}`)
  }

  return data ?? []
}

export async function getStudentsByBatch(batchId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('students')
    .select('*, batch:batches(*, textbook:textbooks(*))')
    .eq('batch_id', batchId)
    .eq('is_passed_out', false)
    .order('full_name', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch students for batch: ${error.message}`)
  }

  return data ?? []
}

export async function createStudent(data: StudentInsert) {
  const supabase = await createClient()

  const { data: student, error } = await supabase
    .from('students')
    .insert(data)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create student: ${error.message}`)
  }

  revalidatePath('/students')
  return student
}

export async function updateStudent(id: string, data: StudentUpdate) {
  const supabase = await createClient()

  const { data: student, error } = await supabase
    .from('students')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update student: ${error.message}`)
  }

  revalidatePath('/students')
  return student
}

export async function markPassedOut(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('students')
    .update({ is_passed_out: true })
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to mark student as passed out: ${error.message}`)
  }

  revalidatePath('/students')
  revalidatePath('/passed-out')
}

export async function restoreStudent(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('students')
    .update({ is_passed_out: false })
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to restore student: ${error.message}`)
  }

  revalidatePath('/students')
  revalidatePath('/passed-out')
}

export async function getActiveStudentCount() {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('is_passed_out', false)

  if (error) {
    throw new Error(`Failed to count students: ${error.message}`)
  }

  return count ?? 0
}

export async function deleteStudent(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id)

  if (error) {
    // 23503 is postgres foreign_key_violation
    if (error.code === '23503') {
      return { success: false, error: 'Cannot delete student. They already have fee, attendance, or exam records. Please mark them as Passed Out instead.' }
    }
    return { success: false, error: `Failed to delete student: ${error.message}` }
  }

  revalidatePath('/students')
  revalidatePath('/passed-out')
  return { success: true }
}
