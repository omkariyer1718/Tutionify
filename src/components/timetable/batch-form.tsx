'use client'

import { useState } from 'react'
import { createBatch, updateBatch, archiveBatch } from '@/lib/actions/batches'
import { WEEKDAYS } from '@/types/database'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import type { BatchWithTextbook, Textbook } from '@/types/database'

interface BatchFormProps {
  open: boolean
  onClose: () => void
  batch: BatchWithTextbook | null
  textbooks: Textbook[]
  initialDate: { weekday: number, start_time: string, end_time: string } | null
}

export function BatchForm({ open, onClose, batch, textbooks, initialDate }: BatchFormProps) {
  const [textbookId, setTextbookId] = useState(batch?.textbook_id || '')
  
  // Array of schedules
  const [schedules, setSchedules] = useState<{ weekday: number; start_time: string; end_time: string }[]>(() => {
    if (batch?.schedules && batch.schedules.length > 0) {
      return batch.schedules.map(s => ({
        weekday: s.weekday,
        start_time: s.start_time.slice(0, 5),
        end_time: s.end_time.slice(0, 5)
      }))
    }
    return [
      {
        weekday: initialDate?.weekday ?? 1,
        start_time: initialDate?.start_time.slice(0, 5) || '16:00',
        end_time: initialDate?.end_time.slice(0, 5) || '17:00'
      }
    ]
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleAddSchedule = () => {
    setSchedules([...schedules, { weekday: 1, start_time: '16:00', end_time: '17:00' }])
  }

  const handleRemoveSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index))
  }

  const handleScheduleChange = (index: number, field: string, value: any) => {
    const newSchedules = [...schedules]
    newSchedules[index] = { ...newSchedules[index], [field]: value }
    setSchedules(newSchedules)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (schedules.length === 0) {
      setError('At least one time slot is required')
      setLoading(false)
      return
    }

    for (const s of schedules) {
      if (s.start_time >= s.end_time) {
        setError('End time must be after start time for all slots')
        setLoading(false)
        return
      }
    }

    const formattedSchedules = schedules.map(s => ({
      weekday: s.weekday,
      start_time: s.start_time + ':00',
      end_time: s.end_time + ':00'
    }))

    if (batch) {
      const res = await updateBatch(batch.id, { textbook_id: textbookId }, formattedSchedules)
      if (res.error) setError(res.error)
      else onClose()
    } else {
      const res = await createBatch({ textbook_id: textbookId, schedules: formattedSchedules })
      if (res.error) setError(res.error)
      else onClose()
    }
    
    setLoading(false)
  }

  const handleArchive = async () => {
    if (!batch) return
    if (!confirm('Are you sure you want to archive this batch?')) return
    
    setLoading(true)
    const res = await archiveBatch(batch.id)
    if (res.error) setError(res.error)
    else onClose()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-lg border border-gray-200 p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{batch ? 'Edit Batch' : 'Add Batch'}</h3>
        
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Textbook</label>
            <select
              value={textbookId}
              onChange={e => setTextbookId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select a textbook...</option>
              {textbooks.map(t => (
                <option key={t.id} value={t.id}>{t.display_name}</option>
              ))}
            </select>
            {textbooks.length === 0 && (
              <p className="mt-1 text-xs text-red-500">Please create a textbook first.</p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Time Slots</label>
              <button
                type="button"
                onClick={handleAddSchedule}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Slot
              </button>
            </div>
            
            <div className="space-y-3">
              {schedules.map((schedule, idx) => (
                <div key={idx} className="flex gap-2 items-center bg-gray-50 p-2 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <select
                      value={schedule.weekday}
                      onChange={e => handleScheduleChange(idx, 'weekday', Number(e.target.value))}
                      required
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {WEEKDAYS.map((w, i) => (
                        <option key={w} value={i}>{w}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <input
                      type="time"
                      value={schedule.start_time}
                      onChange={e => handleScheduleChange(idx, 'start_time', e.target.value)}
                      required
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="time"
                      value={schedule.end_time}
                      onChange={e => handleScheduleChange(idx, 'end_time', e.target.value)}
                      required
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSchedule(idx)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Remove slot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {schedules.length === 0 && (
                <p className="text-sm text-gray-500">No time slots added. Click "Add Slot" to schedule classes.</p>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            {batch ? (
              <button
                type="button"
                onClick={handleArchive}
                disabled={loading}
                className="text-sm font-medium text-red-600 hover:text-red-700"
              >
                Archive
              </button>
            ) : <div />}
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || textbooks.length === 0 || schedules.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
