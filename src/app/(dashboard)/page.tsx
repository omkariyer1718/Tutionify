import { createClient } from '@/lib/supabase/server'
import {
  formatCurrency,
  formatTime,
  getWeekdayName,
  getTodayWeekday,
  getCurrentMonth,
  getCurrentYear,
  getMonthName,
} from '@/lib/utils'
import { PageHeader } from '@/components/layout/page-header'
import { Users, BookOpen, IndianRupee, AlertCircle, Clock, CalendarDays } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const todayWeekday = getTodayWeekday()
  const currentMonth = getCurrentMonth()
  const currentYear = getCurrentYear()

  // 1. Today's schedules with batch and textbook info
  const { data: todaySchedules } = await supabase
    .from('batch_schedules')
    .select('*, batch:batches!inner(*, textbook:textbooks(*))')
    .eq('weekday', todayWeekday)
    .eq('batch.is_active', true)
    .order('start_time', { ascending: true })

  // 2. For each today's schedule, count active students in that batch
  const batchesWithCounts = await Promise.all(
    (todaySchedules ?? []).map(async (schedule) => {
      const batch = schedule.batch as any
      const { count } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('batch_id', batch.id)
        .eq('is_passed_out', false)

      return { 
        ...batch, 
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        student_count: count ?? 0 
      }
    })
  )

  // 3. Quick stats
  const { count: activeStudentsCount } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('is_passed_out', false)

  const { count: activeBatchesCount } = await supabase
    .from('batches')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  const { data: paidFees } = await supabase
    .from('fee_records')
    .select('amount')
    .eq('is_paid', true)
    .eq('month', currentMonth)
    .eq('year', currentYear)

  const feesCollected = (paidFees ?? []).reduce(
    (sum, fee) => sum + fee.amount,
    0
  )

  const { count: pendingFeesCount } = await supabase
    .from('fee_records')
    .select('*', { count: 'exact', head: true })
    .eq('is_paid', false)
    .eq('month', currentMonth)
    .eq('year', currentYear)

  // 4. Pending fee students with student and batch info
  const { data: pendingFeeRecords } = await supabase
    .from('fee_records')
    .select('*, student:students(*, batch:batches(*))')
    .eq('is_paid', false)
    .eq('month', currentMonth)
    .eq('year', currentYear)
    .order('created_at', { ascending: true })

  const stats = [
    {
      label: 'Active Students',
      value: activeStudentsCount ?? 0,
      icon: Users,
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
    },
    {
      label: 'Active Batches',
      value: activeBatchesCount ?? 0,
      icon: BookOpen,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      label: `Collected — ${getMonthName(currentMonth)}`,
      value: formatCurrency(feesCollected),
      icon: IndianRupee,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      label: 'Pending Fees',
      value: pendingFeesCount ?? 0,
      icon: AlertCircle,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
  ]

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`${getWeekdayName(todayWeekday)}, ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`}
      />

      {/* ── Stat Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="bg-white border border-gray-200 rounded-xl p-5 flex items-start justify-between"
            >
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.iconBg} p-2.5 rounded-lg`}>
                <Icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Today's Classes ──────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-indigo-600" />
          Today&apos;s Classes
        </h2>

        {batchesWithCounts.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <CalendarDays className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No classes scheduled for today</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {batchesWithCounts.map((batch) => (
              <div
                key={batch.id}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{
                      backgroundColor: batch.textbook?.color_code ?? '#6366f1',
                    }}
                  />
                  <h3 className="font-medium text-gray-900 truncate">
                    {batch.display_name}
                  </h3>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {formatTime(batch.start_time)} – {formatTime(batch.end_time)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    {batch.student_count}{' '}
                    {batch.student_count === 1 ? 'student' : 'students'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Pending Fees ─────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          Pending Fees — {getMonthName(currentMonth)} {currentYear}
        </h2>

        {(pendingFeeRecords ?? []).length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <IndianRupee className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">All fees are up to date</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Student Name
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Batch
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(pendingFeeRecords ?? []).map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">
                      {record.student?.full_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {record.student?.batch?.display_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-900 text-right font-medium">
                      {formatCurrency(record.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
