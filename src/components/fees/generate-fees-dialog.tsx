'use client'

import { useState } from 'react'
import { generateMonthlyFees } from '@/lib/actions/fees'
import { Loader2 } from 'lucide-react'
import { getMonthName } from '@/lib/utils'

interface GenerateFeesDialogProps {
  open: boolean
  onClose: () => void
  month: number
  year: number
  onSuccess: () => void
}

export function GenerateFeesDialog({ open, onClose, month, year, onSuccess }: GenerateFeesDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    
    const { count, error } = await generateMonthlyFees(month, year)
    
    if (error) {
      setError(error)
      setLoading(false)
    } else {
      alert(`Successfully generated ${count} fee records for ${getMonthName(month)} ${year}`)
      setLoading(false)
      onSuccess()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-lg border border-gray-200 p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate Monthly Fees</h3>
        <p className="text-sm text-gray-600 mb-6">
          This will generate fee records for all active students for <strong>{getMonthName(month)} {year}</strong>. 
          Students that already have a record for this month will be skipped to prevent duplicates.
        </p>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Generate Fees
          </button>
        </div>
      </div>
    </div>
  )
}
