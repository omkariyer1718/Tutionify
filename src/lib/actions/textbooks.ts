'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Textbook, TextbookInsert, TextbookUpdate } from '@/types/database'

// -----------------------------------------------------------------------------
// Read
// -----------------------------------------------------------------------------

export async function getTextbooks(): Promise<{
  success: boolean
  data?: Textbook[]
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('textbooks')
      .select('*')
      .order('series_name', { ascending: true })
      .order('grade', { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data as Textbook[] }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to fetch textbooks',
    }
  }
}

// -----------------------------------------------------------------------------
// Create
// -----------------------------------------------------------------------------

export async function createTextbook(
  data: TextbookInsert
): Promise<{ success: boolean; data?: Textbook; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: textbook, error } = await supabase
      .from('textbooks')
      .insert({
        series_name: data.series_name,
        grade: data.grade,
        color_code: data.color_code,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/textbooks')
    revalidatePath('/timetable')

    return { success: true, data: textbook as Textbook }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create textbook',
    }
  }
}

// -----------------------------------------------------------------------------
// Update
// -----------------------------------------------------------------------------

export async function updateTextbook(
  id: string,
  data: TextbookUpdate
): Promise<{ success: boolean; data?: Textbook; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: textbook, error } = await supabase
      .from('textbooks')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/textbooks')
    revalidatePath('/timetable')

    return { success: true, data: textbook as Textbook }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update textbook',
    }
  }
}

// -----------------------------------------------------------------------------
// Delete
// -----------------------------------------------------------------------------

export async function deleteTextbook(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('textbooks').delete().eq('id', id)

    if (error) {
      // FK constraint failure when batches still reference this textbook
      if (error.code === '23503') {
        return {
          success: false,
          error:
            'Cannot delete this textbook because it has batches assigned to it. Remove all batches first.',
        }
      }
      return { success: false, error: error.message }
    }

    revalidatePath('/textbooks')
    revalidatePath('/timetable')

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to delete textbook',
    }
  }
}
