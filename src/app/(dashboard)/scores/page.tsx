import { createClient } from '@/lib/supabase/server'
import { ScoresClient } from '@/components/scores/scores-client'
import { PageHeader } from '@/components/layout/page-header'

export default async function ScoresPage() {
  const supabase = await createClient()
  
  const { data: settings } = await supabase.from('settings').select('academic_year').single()
  const academicYear = settings?.academic_year || new Date().getFullYear()

  const { data: batches } = await supabase
    .from('batches')
    .select('*, textbook:textbooks(*)')
    .eq('is_active', true)
    .order('display_name')

  return (
    <div>
      <PageHeader title="Scores" description={`Manage exam scores for Academic Year ${academicYear}`} />
      <ScoresClient batches={batches || []} academicYear={academicYear} />
    </div>
  )
}
