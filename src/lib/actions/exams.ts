'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createExam(name: string, max_marks: number, academic_year: number) {
  const supabase = await createClient()
  const { error } = await supabase.from('exams').insert({ name, max_marks, academic_year })
  if (error) return { error: error.message }
  revalidatePath('/settings')
  revalidatePath('/scores')
  return { success: true }
}

export async function updateExam(id: string, name: string, max_marks: number) {
  const supabase = await createClient()
  const { error } = await supabase.from('exams').update({ name, max_marks }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/settings')
  revalidatePath('/scores')
  return { success: true }
}

export async function deleteExam(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('exams').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/settings')
  revalidatePath('/scores')
  return { success: true }
}
