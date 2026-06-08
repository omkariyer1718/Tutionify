import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data: students, error } = await supabase
    .from('students')
    .select('student_code, full_name, school_name, monthly_fee, class_mode, parent_phone, student_phone, join_date, is_passed_out, batch:batches(display_name)')
    .order('full_name')

  if (error) {
    return new NextResponse('Error fetching data', { status: 500 })
  }

  // Convert to CSV
  const headers = ['Code', 'Name', 'School', 'Batch', 'Fee', 'Mode', 'Parent Phone', 'Student Phone', 'Join Date', 'Status']
  const rows = students.map(s => [
    s.student_code,
    `"${s.full_name}"`,
    `"${s.school_name || ''}"`,
    `"${(s.batch as any)?.display_name || ''}"`,
    s.monthly_fee,
    s.class_mode,
    `"${s.parent_phone}"`,
    `"${s.student_phone || ''}"`,
    s.join_date,
    s.is_passed_out ? 'Alumni' : 'Active'
  ])

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="students_export.csv"',
    },
  })
}
