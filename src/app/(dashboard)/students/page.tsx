import { getStudents } from '@/lib/actions/students'
import { createClient } from '@/lib/supabase/server'
import { StudentsClient } from '@/components/students/students-client'
import { BatchWithTextbook, StudentWithBatch } from '@/types/database'

export default async function StudentsPage() {
  const supabase = await createClient()

  const [students, batchesResult] = await Promise.all([
    getStudents(),
    supabase
      .from('batches')
      .select('*, textbook:textbooks(*)')
      .eq('is_active', true)
      .order('display_name', { ascending: true }),
  ])

  const batches = (batchesResult.data ?? []) as BatchWithTextbook[]

  return (
    <StudentsClient
      students={students as StudentWithBatch[]}
      batches={batches}
    />
  )
}
