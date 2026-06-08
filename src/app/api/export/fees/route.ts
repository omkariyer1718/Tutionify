import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data: settings } = await supabase.from('settings').select('academic_year').single()
  const year = settings?.academic_year || new Date().getFullYear()

  const { data: fees, error } = await supabase
    .from('fee_records')
    .select('month, year, amount, is_paid, paid_date, remarks, student:students(student_code, full_name, batch:batches(display_name))')
    .eq('year', year)
    .order('month', { ascending: false })

  if (error) {
    return new NextResponse('Error fetching data', { status: 500 })
  }

  const headers = ['Month', 'Year', 'Student Code', 'Student Name', 'Batch', 'Amount', 'Status', 'Paid Date', 'Remarks']
  const rows = fees.map(f => [
    f.month,
    f.year,
    (f.student as any)?.student_code,
    `"${(f.student as any)?.full_name || ''}"`,
    `"${(f.student as any)?.batch?.display_name || ''}"`,
    f.amount,
    f.is_paid ? 'Paid' : 'Pending',
    f.paid_date || '',
    `"${f.remarks || ''}"`
  ])

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="fees_export_${year}.csv"`,
    },
  })
}
