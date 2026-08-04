'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getSettings() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('settings').select('*').single()
  return { data, error: error?.message }
}

export async function updateSettings(id: string, fee_due_day: number, academic_year: number) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('settings')
    .update({ fee_due_day, academic_year })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { success: true }
}

export async function processPromotions(promotionList: Array<{ batch_id: string, action: 'promote' | 'pass_out' | 'none', new_textbook_id?: string }>) {
  const supabase = await createClient()
  
  const { data: batches } = await supabase.from('batches').select('id, textbook_id')
  const batchMap = new Map(batches?.map(b => [b.id, b.textbook_id]))

  for (const promo of promotionList) {
    if (promo.action === 'pass_out') {
      await supabase.from('students').update({ is_passed_out: true, batch_id: null }).eq('batch_id', promo.batch_id)
      await supabase.from('batches').delete().eq('id', promo.batch_id)
      await supabase.from('promotion_history').insert({
        batch_id: promo.batch_id,
        action: 'pass_out',
        old_textbook_id: batchMap.get(promo.batch_id)
      })
    } else if (promo.action === 'promote' && promo.new_textbook_id) {
      await supabase.from('batches').update({ textbook_id: promo.new_textbook_id }).eq('id', promo.batch_id)
      await supabase.from('promotion_history').insert({
        batch_id: promo.batch_id,
        action: 'promote',
        old_textbook_id: batchMap.get(promo.batch_id),
        new_textbook_id: promo.new_textbook_id
      })
    }
  }

  revalidatePath('/settings')
  revalidatePath('/timetable')
  revalidatePath('/students')
  revalidatePath('/passed-out')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function undoPromotion(historyId: string) {
  const supabase = await createClient()
  const { data: history } = await supabase.from('promotion_history').select('*').eq('id', historyId).single()
  
  if (!history) return { success: false, error: 'History not found' }

  if (history.action === 'pass_out') {
    // Cannot fully undo pass_out since batch was hard deleted
    await supabase.from('students').update({ is_passed_out: false }).eq('batch_id', history.batch_id)
  } else if (history.action === 'promote' && history.old_textbook_id) {
    await supabase.from('batches').update({ textbook_id: history.old_textbook_id }).eq('id', history.batch_id)
  }

  await supabase.from('promotion_history').delete().eq('id', historyId)

  revalidatePath('/settings')
  revalidatePath('/timetable')
  revalidatePath('/students')
  revalidatePath('/passed-out')
  revalidatePath('/dashboard')
  return { success: true }
}
