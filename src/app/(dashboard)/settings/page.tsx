import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from '@/components/settings/settings-client'
import { PageHeader } from '@/components/layout/page-header'

export default async function SettingsPage() {
  const supabase = await createClient()
  
  const { data: settings } = await supabase.from('settings').select('*').single()
  
  const { data: exams } = await supabase
    .from('exams')
    .select('*')
    .eq('academic_year', settings?.academic_year || new Date().getFullYear())
    .order('created_at')

  const { data: students } = await supabase
    .from('students')
    .select('*, batch:batches(*, textbook:textbooks(*))')
    .eq('is_passed_out', false)
    .order('full_name')

  const { data: batches } = await supabase
    .from('batches')
    .select('*, textbook:textbooks(*)')
    .eq('is_active', true)
    .order('display_name')

  const { data: textbooks } = await supabase
    .from('textbooks')
    .select('*')
    .order('grade')

  const { data: promotionHistory } = await supabase
    .from('promotion_history')
    .select('*, batch:batches(display_name), old_textbook:textbooks!old_textbook_id(display_name), new_textbook:textbooks!new_textbook_id(display_name)')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div>
      <PageHeader title="Settings" description="System configuration, exams, and yearly promotions" />
      <SettingsClient 
        settings={settings} 
        exams={exams || []} 
        batches={batches || []} 
        textbooks={textbooks || []}
        promotionHistory={promotionHistory || []}
      />
    </div>
  )
}
