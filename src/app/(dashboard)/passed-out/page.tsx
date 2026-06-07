import { createClient } from '@/lib/supabase/server'
import { PassedOutClient } from '@/components/passed-out/passed-out-client'
import { PageHeader } from '@/components/layout/page-header'

export default async function PassedOutPage() {
  const supabase = await createClient()
  
  const { data: students } = await supabase
    .from('students')
    .select('*, batch:batches(*, textbook:textbooks(*))')
    .eq('is_passed_out', true)
    .order('full_name')

  return (
    <div>
      <PageHeader title="Passed Out Students" description="Alumni and past students" />
      <PassedOutClient students={students || []} />
    </div>
  )
}
