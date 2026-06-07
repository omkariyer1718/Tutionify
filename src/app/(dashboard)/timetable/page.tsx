import { createClient } from '@/lib/supabase/server'
import { TimetableClient } from '@/components/timetable/timetable-client'
import { PageHeader } from '@/components/layout/page-header'

export default async function TimetablePage() {
  const supabase = await createClient()
  
  const { data: batches } = await supabase
    .from('batches')
    .select('*, textbook:textbooks(*), schedules:batch_schedules(*)')
    .eq('is_active', true)

  const { data: textbooks } = await supabase
    .from('textbooks')
    .select('*')
    .order('series_name')
    .order('grade')

  const { data: students } = await supabase
    .from('students')
    .select('batch_id')
    .eq('is_passed_out', false)

  const batchCounts = new Map<string, number>()
  students?.forEach(s => {
    batchCounts.set(s.batch_id, (batchCounts.get(s.batch_id) || 0) + 1)
  })

  const batchesWithCounts = (batches || []).map(b => ({
    ...b,
    student_count: batchCounts.get(b.id) || 0
  }))

  return (
    <div>
      <PageHeader title="Timetable" description="Weekly schedule of all active batches" />
      <TimetableClient batches={batchesWithCounts} textbooks={textbooks || []} />
    </div>
  )
}
