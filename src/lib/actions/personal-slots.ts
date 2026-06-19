'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createPersonalSlot(data: {
  title: string
  color_code: string
  schedules: { weekday: number; start_time: string; end_time: string }[]
}) {
  const supabase = await createClient()

  // 1. Insert the slot
  const { data: slot, error: slotError } = await supabase
    .from('personal_slots')
    .insert({
      title: data.title,
      color_code: data.color_code
    })
    .select()
    .single()

  if (slotError) return { error: slotError.message }

  // 2. Insert schedules
  if (data.schedules.length > 0) {
    const schedulesToInsert = data.schedules.map(sch => ({
      personal_slot_id: slot.id,
      weekday: sch.weekday,
      start_time: sch.start_time,
      end_time: sch.end_time
    }))

    const { error: schedulesError } = await supabase
      .from('personal_slot_schedules')
      .insert(schedulesToInsert)

    if (schedulesError) return { error: schedulesError.message }
  }

  revalidatePath('/timetable')
  return { success: true }
}

export async function updatePersonalSlot(id: string, data: {
  title: string
  color_code: string
  schedules: { weekday: number; start_time: string; end_time: string }[]
}) {
  const supabase = await createClient()

  // 1. Update the slot
  const { error: slotError } = await supabase
    .from('personal_slots')
    .update({
      title: data.title,
      color_code: data.color_code
    })
    .eq('id', id)

  if (slotError) return { error: slotError.message }

  // 2. Delete old schedules
  await supabase.from('personal_slot_schedules').delete().eq('personal_slot_id', id)

  // 3. Insert new schedules
  if (data.schedules.length > 0) {
    const schedulesToInsert = data.schedules.map(sch => ({
      personal_slot_id: id,
      weekday: sch.weekday,
      start_time: sch.start_time,
      end_time: sch.end_time
    }))

    const { error: schedulesError } = await supabase
      .from('personal_slot_schedules')
      .insert(schedulesToInsert)

    if (schedulesError) return { error: schedulesError.message }
  }

  revalidatePath('/timetable')
  return { success: true }
}

export async function deletePersonalSlot(id: string) {
  const supabase = await createClient()
  
  // Due to ON DELETE CASCADE on the schedule table, deleting the slot deletes its schedules automatically.
  const { error } = await supabase
    .from('personal_slots')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  
  revalidatePath('/timetable')
  return { success: true }
}
