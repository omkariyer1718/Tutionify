'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { PaymentHistory } from '@/components/fees/payment-history'
import { formatCurrency, formatDate, getMonthName, toISODateString } from '@/lib/utils'
import {
  generateMonthlyFees,
  markFeePaid,
  markFeeUnpaid,
} from '@/lib/actions/fees'
import { MONTHS } from '@/types/database'
import type { FeeRecordWithStudent } from '@/types/database'
import {
  IndianRupee,
  Users,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Sparkles,
  History,
  Check,
  X,
} from 'lucide-react'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface FeeSummary {
  total_students: number
  paid_count: number
  unpaid_count: number
  total_collected: number
  total_pending: number
}

interface FeesClientProps {
  initialRecords: FeeRecordWithStudent[]
  initialSummary: FeeSummary
  initialMonth: number
  initialYear: number
  error?: string
}

// -----------------------------------------------------------------------------
// FeesClient
// -----------------------------------------------------------------------------

export function FeesClient({
  initialRecords,
  initialSummary,
  initialMonth,
  initialYear,
  error,
}: FeesClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // State
  const [month, setMonth] = useState(initialMonth)
  const [year, setYear] = useState(initialYear)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [showPayDatePicker, setShowPayDatePicker] = useState<string | null>(null)
  const [payDate, setPayDate] = useState(toISODateString(new Date()))
  const [historyStudent, setHistoryStudent] = useState<{
    id: string
    name: string
  } | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Derive year options (current year ± 2)
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  // ---- Handlers ----

  const handleMonthYearChange = (newMonth: number, newYear: number) => {
    setMonth(newMonth)
    setYear(newYear)
    startTransition(() => {
      router.push(`/fees?month=${newMonth}&year=${newYear}`)
      router.refresh()
    })
  }

  const handleGenerate = async () => {
    setActionError(null)
    setSuccessMessage(null)
    const result = await generateMonthlyFees(month, year)
    if (result.error) {
      setActionError(result.error)
    } else {
      setSuccessMessage(
        result.count > 0
          ? `Generated ${result.count} fee record${result.count > 1 ? 's' : ''} for ${getMonthName(month)} ${year}`
          : `All fee records already exist for ${getMonthName(month)} ${year}`
      )
      startTransition(() => {
        router.refresh()
      })
    }
  }

  const handleMarkPaid = async (feeId: string) => {
    setActionError(null)
    setSuccessMessage(null)
    const result = await markFeePaid(feeId, payDate)
    if (result.error) {
      setActionError(result.error)
    } else {
      setShowPayDatePicker(null)
      startTransition(() => {
        router.refresh()
      })
    }
  }

  const handleMarkUnpaid = async (feeId: string) => {
    setActionError(null)
    setSuccessMessage(null)
    const result = await markFeeUnpaid(feeId)
    if (result.error) {
      setActionError(result.error)
    } else {
      startTransition(() => {
        router.refresh()
      })
    }
  }

  const dismissMessages = () => {
    setActionError(null)
    setSuccessMessage(null)
  }

  // ---- Render ----

  return (
    <div>
      <PageHeader title="Fees" description="Manage monthly fee collection">
        <button
          onClick={() => setShowGenerateDialog(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Generate Monthly Fees
        </button>
      </PageHeader>

      {/* Alerts */}
      {(error || actionError) && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error || actionError}
          <button onClick={dismissMessages} className="ml-auto text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {successMessage && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-sm text-green-700">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {successMessage}
          <button onClick={dismissMessages} className="ml-auto text-green-500 hover:text-green-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Month / Year Selector */}
      <div className="flex items-center gap-3 mb-6">
        <select
          value={month}
          onChange={(e) =>
            handleMonthYearChange(parseInt(e.target.value, 10), year)
          }
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          {MONTHS.map((m, i) => (
            <option key={i} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) =>
            handleMonthYearChange(month, parseInt(e.target.value, 10))
          }
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <SummaryCard
          icon={Users}
          label="Total Students"
          value={initialSummary.total_students.toString()}
          color="indigo"
        />
        <SummaryCard
          icon={CheckCircle2}
          label="Paid"
          value={initialSummary.paid_count.toString()}
          color="green"
        />
        <SummaryCard
          icon={AlertCircle}
          label="Unpaid"
          value={initialSummary.unpaid_count.toString()}
          color="red"
        />
        <SummaryCard
          icon={IndianRupee}
          label="Collected"
          value={formatCurrency(initialSummary.total_collected)}
          color="green"
        />
        <SummaryCard
          icon={IndianRupee}
          label="Pending"
          value={formatCurrency(initialSummary.total_pending)}
          color="red"
        />
      </div>

      {/* Fee Records Table */}
      {initialRecords.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <EmptyState
            icon={Receipt}
            title="No fee records"
            description={`No fee records found for ${getMonthName(month)} ${year}. Click "Generate Monthly Fees" to create them.`}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Student Code
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Student Name
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Batch
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">
                    Amount
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Paid Date
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {initialRecords.map((record) => (
                  <tr
                    key={record.id}
                    className={
                      record.is_paid
                        ? 'hover:bg-gray-50'
                        : 'bg-rose-50/60 hover:bg-rose-100/60'
                    }
                  >
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                      {record.student?.student_code}
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      <button
                        onClick={() =>
                          setHistoryStudent({
                            id: record.student_id,
                            name: record.student?.full_name || 'Student',
                          })
                        }
                        className="hover:text-indigo-600 transition-colors text-left"
                        title="View payment history"
                      >
                        {record.student?.full_name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {record.student?.batch?.display_name || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-900 text-right font-medium tabular-nums">
                      {formatCurrency(record.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {record.is_paid ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                          <Check className="w-3 h-3" />
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
                          <X className="w-3 h-3" />
                          Unpaid
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {record.paid_date ? formatDate(record.paid_date) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* History button */}
                        <button
                          onClick={() =>
                            setHistoryStudent({
                              id: record.student_id,
                              name: record.student?.full_name || 'Student',
                            })
                          }
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Payment history"
                        >
                          <History className="w-4 h-4" />
                        </button>

                        {record.is_paid ? (
                          <button
                            onClick={() => handleMarkUnpaid(record.id)}
                            disabled={isPending}
                            className="px-3 py-1.5 text-xs font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                          >
                            Mark Unpaid
                          </button>
                        ) : showPayDatePicker === record.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="date"
                              value={payDate}
                              onChange={(e) => setPayDate(e.target.value)}
                              className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <button
                              onClick={() => handleMarkPaid(record.id)}
                              disabled={isPending}
                              className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setShowPayDatePicker(null)}
                              className="px-2 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setPayDate(toISODateString(new Date()))
                              setShowPayDatePicker(record.id)
                            }}
                            disabled={isPending}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generate Fees Dialog */}
      <ConfirmDialog
        open={showGenerateDialog}
        onClose={() => setShowGenerateDialog(false)}
        onConfirm={handleGenerate}
        title="Generate Monthly Fees"
        description={`This will create fee records for all active students for ${getMonthName(month)} ${year}. Students who already have a record for this month will be skipped.`}
        confirmText="Generate"
      />

      {/* Payment History Slide-over */}
      {historyStudent && (
        <PaymentHistory
          open={!!historyStudent}
          onClose={() => setHistoryStudent(null)}
          studentId={historyStudent.id}
          studentName={historyStudent.name}
        />
      )}
    </div>
  )
}

// -----------------------------------------------------------------------------
// SummaryCard (internal)
// -----------------------------------------------------------------------------

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  color: 'indigo' | 'green' | 'red'
}) {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-50',
      icon: 'text-indigo-600',
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
    },
  }

  const c = colorMap[color]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 ${c.bg} rounded-lg flex items-center justify-center shrink-0`}
        >
          <Icon className={`w-4.5 h-4.5 ${c.icon}`} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 truncate">{label}</p>
          <p className="text-lg font-semibold text-gray-900 truncate">
            {value}
          </p>
        </div>
      </div>
    </div>
  )
}
