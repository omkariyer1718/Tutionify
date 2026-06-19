'use client'

import { useState, useEffect } from 'react'
import { createPersonalSlot, updatePersonalSlot, deletePersonalSlot } from '@/lib/actions/personal-slots'
import { Loader2, Plus, Trash2, Check } from 'lucide-react'
import { PRESET_COLORS, WEEKDAYS, type PersonalSlotWithSchedules } from '@/types/database'

interface PersonalSlotFormProps {
  open: boolean
  onClose: () => void
  slot?: PersonalSlotWithSchedules | null
  initialDate?: { weekday: number; start_time: string; end_time: string } | null
}

export function PersonalSlotForm({ open, onClose, slot, initialDate }: PersonalSlotFormProps) {
  const [title, setTitle] = useState('')
  const [colorCode, setColorCode] = useState<string>(PRESET_COLORS[0].value)
  const [schedules, setSchedules] = useState([{ weekday: 1, start_time: '16:00', end_time: '17:00' }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      if (slot) {
        setTitle(slot.title)
        setColorCode(slot.color_code || PRESET_COLORS[0].value)
        setSchedules(
          slot.schedules?.length > 0
            ? slot.schedules.map(s => ({
                weekday: s.weekday,
                start_time: s.start_time,
                end_time: s.end_time
              }))
            : [{ weekday: 1, start_time: '16:00', end_time: '17:00' }]
        )
      } else if (initialDate) {
        setTitle('')
        setColorCode(PRESET_COLORS[0].value)
        setSchedules([{ ...initialDate }])
      } else {
        setTitle('')
        setColorCode(PRESET_COLORS[0].value)
        setSchedules([{ weekday: 1, start_time: '16:00', end_time: '17:00' }])
      }
      setError(null)
      setLoading(false)
    }
  }, [open, slot, initialDate])

  if (!open) return null

  const isEditing = !!slot

  const handleAddSchedule = () => {
    setSchedules([...schedules, { weekday: 1, start_time: '16:00', end_time: '17:00' }])
  }

  const handleRemoveSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index))
  }

  const handleScheduleChange = (index: number, field: keyof typeof schedules[0], value: any) => {
    const newSchedules = [...schedules]
    newSchedules[index] = { ...newSchedules[index], [field]: value }
    setSchedules(newSchedules)
  }

  const handleDelete = async () => {
    if (!slot) return
    if (!confirm(`Are you sure you want to delete "${slot.title}"?`)) return
    
    setLoading(true)
    const res = await deletePersonalSlot(slot.id)
    if (res.error) {
      setError(res.error)
      setLoading(false)
    } else {
      setLoading(false)
      onClose()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!title.trim()) {
      setError('Title is required.')
      setLoading(false)
      return
    }

    if (schedules.length === 0) {
      setError('At least one schedule slot is required.')
      setLoading(false)
      return
    }

    for (const sch of schedules) {
      if (sch.start_time >= sch.end_time) {
        setError('End time must be after start time for all schedules.')
        setLoading(false)
        return
      }
    }

    const payload = {
      title: title.trim(),
      color_code: colorCode,
      schedules
    }

    const res = isEditing
      ? await updatePersonalSlot(slot.id, payload)
      : await createPersonalSlot(payload)

    if (res.error) {
      setError(res.error)
      setLoading(false)
    } else {
      setLoading(false)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40 overflow-y-auto pt-10 pb-10" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-lg border border-gray-200 p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{isEditing ? 'Edit Personal Slot' : 'Add Personal Slot'}</h3>
        <p className="text-sm text-gray-500 mb-6">Block time on your calendar for personal activities not related to tuition batches.</p>
        
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Djembe Class, Geeta Reading"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color Label</label>
            <div className="flex flex-wrap gap-2 items-center">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  title={color.name}
                  onClick={() => setColorCode(color.value)}
                  className="relative w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center"
                  style={{
                    backgroundColor: color.value,
                    borderColor: colorCode === color.value ? color.value : 'transparent',
                    boxShadow: colorCode === color.value ? `0 0 0 2px white, 0 0 0 4px ${color.value}` : 'none',
                  }}
                >
                  {colorCode === color.value && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
              <div className="ml-2 flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Custom:</span>
                <input
                  type="color"
                  value={colorCode}
                  onChange={(e) => setColorCode(e.target.value)}
                  className="w-8 h-8 cursor-pointer rounded border border-gray-300 p-0.5"
                  title="Choose custom color"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Schedules</label>
              <button
                type="button"
                onClick={handleAddSchedule}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-900 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded"
              >
                <Plus className="w-3 h-3" /> Add Day
              </button>
            </div>
            
            <div className="space-y-3">
              {schedules.map((sch, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                  <select
                    value={sch.weekday}
                    onChange={e => handleScheduleChange(index, 'weekday', Number(e.target.value))}
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {WEEKDAYS.map((day, i) => (
                      <option key={i} value={i}>{day}</option>
                    ))}
                  </select>
                  <input
                    type="time"
                    required
                    value={sch.start_time}
                    onChange={e => handleScheduleChange(index, 'start_time', e.target.value)}
                    className="w-28 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-gray-500 text-sm">to</span>
                  <input
                    type="time"
                    required
                    value={sch.end_time}
                    onChange={e => handleScheduleChange(index, 'end_time', e.target.value)}
                    className="w-28 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  {schedules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSchedule(index)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                title="Delete Slot"
              >
                <Trash2 className="w-5 h-5" />
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
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEditing ? 'Update Slot' : 'Save Slot'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
