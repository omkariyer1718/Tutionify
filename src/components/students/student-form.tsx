'use client'

import { useState, useEffect } from 'react'
import { createStudent, updateStudent } from '@/lib/actions/students'
import { Loader2 } from 'lucide-react'
import type { StudentWithBatch, BatchWithTextbook } from '@/types/database'

interface StudentFormProps {
  open: boolean
  onClose: () => void
  student: StudentWithBatch | null
  batches: BatchWithTextbook[]
}

export function StudentForm({ open, onClose, student, batches }: StudentFormProps) {
  const [fullName, setFullName] = useState(student?.full_name || '')
  const [schoolName, setSchoolName] = useState(student?.school_name || '')
  const [batchId, setBatchId] = useState(student?.batch_id || '')
  const [monthlyFee, setMonthlyFee] = useState(student?.monthly_fee?.toString() || '')
  const [classMode, setClassMode] = useState<'online' | 'offline'>(student?.class_mode || 'offline')
  const [parentPhone, setParentPhone] = useState(student?.parent_phone || '')
  const [studentPhone, setStudentPhone] = useState(student?.student_phone || '')
  const [joinDate, setJoinDate] = useState(student?.join_date || new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState(student?.notes || '')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setFullName(student?.full_name || '')
      setSchoolName(student?.school_name || '')
      setBatchId(student?.batch_id || '')
      setMonthlyFee(student?.monthly_fee?.toString() || '')
      setClassMode(student?.class_mode || 'offline')
      setParentPhone(student?.parent_phone || '')
      setStudentPhone(student?.student_phone || '')
      setJoinDate(student?.join_date || new Date().toISOString().split('T')[0])
      setNotes(student?.notes || '')
      setError(null)
    }
  }, [open, student])

  if (!open) return null

  // Group batches by textbook
  const batchesByTextbook = batches.reduce((acc, batch) => {
    const key = batch.textbook?.display_name || 'Unassigned'
    if (!acc[key]) acc[key] = []
    acc[key].push(batch)
    return acc
  }, {} as Record<string, BatchWithTextbook[]>)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const data = {
      full_name: fullName,
      school_name: schoolName || null,
      batch_id: batchId,
      monthly_fee: Number(monthlyFee),
      class_mode: classMode,
      parent_phone: parentPhone,
      student_phone: studentPhone || null,
      join_date: joinDate,
      notes: notes || null
    }

    let res
    if (student) {
      res = await updateStudent(student.id, data)
    } else {
      res = await createStudent(data)
    }

    if (res.error) {
      setError(res.error)
      setLoading(false)
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40 overflow-y-auto pt-10 pb-10" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-lg border border-gray-200 p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{student ? 'Edit Student' : 'Add Student'}</h3>
        
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
              <input
                type="text"
                value={schoolName}
                onChange={e => setSchoolName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Join Date *</label>
              <input
                type="date"
                required
                value={joinDate}
                onChange={e => setJoinDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch *</label>
              <select
                required
                value={batchId}
                onChange={e => setBatchId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Select a batch...</option>
                {Object.entries(batchesByTextbook).map(([textbookName, textbookBatches]) => (
                  <optgroup key={textbookName} label={textbookName}>
                    {textbookBatches.map(b => (
                      <option key={b.id} value={b.id}>{b.display_name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Fee (₹) *</label>
              <input
                type="number"
                required
                min="0"
                value={monthlyFee}
                onChange={e => setMonthlyFee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Class Mode</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="classMode"
                    value="offline"
                    checked={classMode === 'offline'}
                    onChange={() => setClassMode('offline')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Offline</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="classMode"
                    value="online"
                    checked={classMode === 'online'}
                    onChange={() => setClassMode('online')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Online</span>
                </label>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent Phone *</label>
              <input
                type="text"
                required
                value={parentPhone}
                onChange={e => setParentPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Student Phone</label>
              <input
                type="text"
                value={studentPhone}
                onChange={e => setStudentPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
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
              Save Student
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
