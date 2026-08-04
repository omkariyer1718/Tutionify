import { createClient } from '@/lib/supabase/server'
import { AttendanceClient } from '@/components/attendance/attendance-client'
import { PageHeader } from '@/components/layout/page-header'

export default async function AttendancePage() {
  const supabase = await createClient()
  
  const { data: batches } = await supabase
    .from('batches')
    .select('*, textbook:textbooks(*)')

    .order('display_name')

  return (
    <div>
      <PageHeader title="Attendance" description="Mark daily attendance for batches" />
      <AttendanceClient batches={batches || []} />
    </div>
  )
}
