'use client'

import { useState, useEffect } from 'react'
import { getPaymentHistory } from '@/lib/actions/fees'
import { EmptyState } from '@/components/ui/empty-state'
import { IndianRupee, Loader2, X } from 'lucide-react'
import { formatCurrency, formatDate, getMonthName } from '@/lib/utils'
import type { FeeRecord } from '@/types/database'

interface PaymentHistoryProps {
  open: boolean
  onClose: () => void
  studentId: string
  studentName: string
}

export function PaymentHistory({ open, onClose, studentId, studentName }: PaymentHistoryProps) {
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<FeeRecord[]>([])

  useEffect(() => {
    if (open && studentId) {
      loadHistory()
    }
  }, [open, studentId])

  const loadHistory = async () => {
    setLoading(true)
    const { data } = await getPaymentHistory(studentId)
    setRecords(data || [])
    setLoading(false)
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40 transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl flex flex-col transform transition-transform">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
            <p className="text-sm text-gray-500">{studentName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : records.length === 0 ? (
            <EmptyState icon={IndianRupee} title="No Records" description="No fee records found for this student." />
          ) : (
            <div className="space-y-8">
              {records.map((record, i) => (
                <div key={record.id} className="relative">
                  {i !== records.length - 1 && (
                    <span className="absolute top-8 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                  )}
                  <div className="relative flex items-start space-x-3">
                    <div>
                      <div className="relative px-1">
                        <div className={`h-6 w-6 flex items-center justify-center rounded-full ring-8 ring-white ${
                          record.is_paid ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <IndianRupee className={`h-3 w-3 ${record.is_paid ? 'text-green-600' : 'text-red-600'}`} />
                        </div>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="text-sm font-medium text-gray-900">
                        {getMonthName(record.month)} {record.year}
                      </div>
                      <div className="mt-1 text-sm text-gray-500 flex justify-between">
                        <span>{formatCurrency(record.amount)}</span>
                        {record.is_paid ? (
                          <span className="text-green-600 font-medium">Paid on {record.paid_date ? formatDate(record.paid_date) : 'Unknown'}</span>
                        ) : (
                          <span className="text-red-600 font-medium">Unpaid</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
