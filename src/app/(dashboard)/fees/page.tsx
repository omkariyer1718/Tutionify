import { getFeeRecords, getMonthlyFeeSummary } from '@/lib/actions/fees'
import { getCurrentMonth, getCurrentYear } from '@/lib/utils'
import { FeesClient } from '@/components/fees/fees-client'
import type { FeeRecordWithStudent } from '@/types/database'

interface FeesPageProps {
  searchParams: Promise<{ month?: string; year?: string }>
}

export default async function FeesPage({ searchParams }: FeesPageProps) {
  const params = await searchParams
  const month = params.month ? parseInt(params.month, 10) : getCurrentMonth()
  const year = params.year ? parseInt(params.year, 10) : getCurrentYear()

  const [feeResult, summaryResult] = await Promise.all([
    getFeeRecords(month, year),
    getMonthlyFeeSummary(month, year),
  ])

  return (
    <FeesClient
      initialRecords={feeResult.data}
      initialSummary={{
        total_students: summaryResult.total_students,
        paid_count: summaryResult.paid_count,
        unpaid_count: summaryResult.unpaid_count,
        total_collected: summaryResult.total_collected,
        total_pending: summaryResult.total_pending,
      }}
      initialMonth={month}
      initialYear={year}
      error={feeResult.error || summaryResult.error}
    />
  )
}
