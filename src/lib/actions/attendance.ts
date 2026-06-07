'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getAttendanceForDate(batchId: string, date: string) {
  const supabase = await createClient()
  const { data: students, error: studentError } = await supabase
    .from('students')
    .select('id, full_name, student_code')
    .eq('batch_id', batchId)
    .eq('is_passed_out', false)
    
  if (studentError) return { data: [], error: studentError.message }

  const { data: records, error: recordError } = await supabase
    .from('attendance_records')
    .select('id, student_id, is_present')
    .eq('batch_id', batchId)
    .eq('attendance_date', date)

  if (recordError) return { data: [], error: recordError.message }

  const recordMap = new Map((records || []).map(r => [r.student_id, r]))

  const result = (students || []).map(s => {
    const r = recordMap.get(s.id)
    return {
      student_id: s.id,
      student_name: s.full_name,
      student_code: s.student_code,
      is_present: r ? r.is_present : true,
      record_id: r?.id
    }
  })

  return { data: result }
}

export async function saveAttendance(batchId: string, date: string, records: Array<{ student_id: string, is_present: boolean }>) {
  const supabase = await createClient()
  const inserts = records.map(r => ({
    student_id: r.student_id,
    batch_id: batchId,
    attendance_date: date,
    is_present: r.is_present
  }))

  const { error } = await supabase
    .from('attendance_records')
    .upsert(inserts, { onConflict: 'student_id,attendance_date' })

  if (error) return { error: error.message }
  revalidatePath('/attendance')
  return { success: true }
}

export async function getAttendanceStats(batchId: string, month: number, year: number) {
  const supabase = await createClient()
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]

  const { data: students, error: studentErr } = await supabase
    .from('students')
    .select('id, full_name')
    .eq('batch_id', batchId)
    .eq('is_passed_out', false)
    
  if (studentErr) return { data: [], error: studentErr.message }

  const { data: records, error: recordErr } = await supabase
    .from('attendance_records')
    .select('student_id, is_present, attendance_date')
    .eq('batch_id', batchId)
    .gte('attendance_date', startDate)
    .lte('attendance_date', endDate)

  if (recordErr) return { data: [], error: recordErr.message }

  // Total classes is distinct dates for this batch in this month
  const uniqueDates = new Set((records || []).map(r => r.attendance_date))
  const totalClasses = uniqueDates.size

  const stats = (students || []).map(s => {
    const studentRecords = (records || []).filter(r => r.student_id === s.id)
    const attended = studentRecords.filter(r => r.is_present).length
    const percentage = totalClasses > 0 ? Math.round((attended / totalClasses) * 100) : 0
    return {
      student_name: s.full_name,
      attended,
      total: totalClasses,
      percentage
    }
  }).sort((a, b) => a.student_name.localeCompare(b.student_name))

  return { data: stats }
}

export async function getBatchAttendanceDates(batchId: string, month: number, year: number) {
  const supabase = await createClient()
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('attendance_records')
    .select('attendance_date')
    .eq('batch_id', batchId)
    .gte('attendance_date', startDate)
    .lte('attendance_date', endDate)

  if (error) return { data: [], error: error.message }
  
  const dates = Array.from(new Set((data || []).map(d => d.attendance_date))).sort()
  return { data: dates }
}
