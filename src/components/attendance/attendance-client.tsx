'use client'

import { useState, useEffect } from 'react'
import { getAttendanceForDate, saveAttendance, getAttendanceStats } from '@/lib/actions/attendance'
import { EmptyState } from '@/components/ui/empty-state'
import { toISODateString, getCurrentMonth, getCurrentYear } from '@/lib/utils'
import { MONTHS } from '@/types/database'
import { ClipboardCheck, Loader2 } from 'lucide-react'
import type { BatchWithTextbook } from '@/types/database'

interface AttendanceClientProps {
  batches: BatchWithTextbook[]
}

type StudentRecord = {
  student_id: string
  student_name: string
  student_code: string
  is_present: boolean
  record_id?: string
}

export function AttendanceClient({ batches }: AttendanceClientProps) {
  const [date, setDate] = useState(toISODateString(new Date()))
  const [batchId, setBatchId] = useState('')
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Stats state
  const [statsMonth, setStatsMonth] = useState(getCurrentMonth())
  const [statsYear, setStatsYear] = useState(getCurrentYear())
  const [stats, setStats] = useState<any[]>([])
  const [loadingStats, setLoadingStats] = useState(false)
  const [activeTab, setActiveTab] = useState<'mark' | 'stats'>('mark')

  useEffect(() => {
    if (batchId && date && activeTab === 'mark') {
      loadAttendance()
    }
  }, [batchId, date, activeTab])

  useEffect(() => {
    if (batchId && activeTab === 'stats') {
      loadStats()
    }
  }, [batchId, statsMonth, statsYear, activeTab])

  const loadAttendance = async () => {
    setLoading(true)
    const { data, error } = await getAttendanceForDate(batchId, date)
    if (!error && data) {
      setStudents(data)
    }
    setLoading(false)
  }

  const loadStats = async () => {
    setLoadingStats(true)
    const { data, error } = await getAttendanceStats(batchId, statsMonth, statsYear)
    if (!error && data) {
      setStats(data)
    }
    setLoadingStats(false)
  }

  const handleToggle = (studentId: string) => {
    setStudents(prev => prev.map(s => s.student_id === studentId ? { ...s, is_present: !s.is_present } : s))
  }

  const handleSave = async () => {
    setSaving(true)
    await saveAttendance(batchId, date, students)
    setSaving(false)
    alert('Attendance saved successfully')
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
          <select 
            value={batchId} 
            onChange={e => setBatchId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Select a batch...</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.display_name}</option>
            ))}
          </select>
        </div>
        {activeTab === 'mark' ? (
          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        ) : (
          <>
            <div className="w-40">
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select 
                value={statsMonth} 
                onChange={e => setStatsMonth(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div className="w-32">
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <input 
                type="number" 
                value={statsYear} 
                onChange={e => setStatsYear(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </>
        )}
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('mark')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'mark'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Mark Attendance
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'stats'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Monthly Stats
          </button>
        </nav>
      </div>

      {!batchId ? (
        <EmptyState icon={ClipboardCheck} title="No Batch Selected" description="Please select a batch to view or mark attendance." />
      ) : activeTab === 'mark' ? (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : students.length === 0 ? (
            <EmptyState icon={ClipboardCheck} title="No Students" description="There are no active students in this batch." />
          ) : (
            <>
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  {students.filter(s => s.is_present).length} / {students.length} present
                </span>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Attendance'}
                </button>
              </div>
              <ul className="divide-y divide-gray-200">
                {students.map(student => (
                  <li key={student.student_id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium text-gray-900">{student.student_name}</div>
                      <div className="text-xs text-gray-500">{student.student_code}</div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className={`text-sm ${student.is_present ? 'text-green-600' : 'text-red-600'}`}>
                        {student.is_present ? 'Present' : 'Absent'}
                      </span>
                      <input 
                        type="checkbox"
                        checked={student.is_present}
                        onChange={() => handleToggle(student.student_id)}
                        className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </label>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {loadingStats ? (
            <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : stats.length === 0 ? (
            <EmptyState icon={ClipboardCheck} title="No Stats" description="No attendance records found for this month." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classes Attended</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Classes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.map(s => (
                    <tr key={s.student_name}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{s.student_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.attended}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.total}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          s.percentage >= 75 ? 'bg-green-100 text-green-800' :
                          s.percentage >= 50 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {s.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
