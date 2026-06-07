'use client'

import { useState, useEffect } from 'react'
import { getScoresByBatch, upsertScore, getBatchAnalytics } from '@/lib/actions/scores'
import { EmptyState } from '@/components/ui/empty-state'
import { Trophy, Loader2, Check } from 'lucide-react'
import type { BatchWithTextbook, Exam } from '@/types/database'

interface ScoresClientProps {
  batches: BatchWithTextbook[]
  academicYear: number
}

export function ScoresClient({ batches, academicYear }: ScoresClientProps) {
  const [batchId, setBatchId] = useState('')
  const [students, setStudents] = useState<any[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(false)
  const [analytics, setAnalytics] = useState<{ averages: Record<string, number>, toppers: Record<string, any> } | null>(null)
  
  // To track saving states per cell: { [studentId_examId]: 'saving' | 'saved' | null }
  const [saveStatus, setSaveStatus] = useState<Record<string, 'saving' | 'saved'>>({})

  useEffect(() => {
    if (batchId) {
      loadData()
    } else {
      setStudents([])
      setExams([])
      setAnalytics(null)
    }
  }, [batchId])

  const loadData = async () => {
    setLoading(true)
    const [scoresRes, analyticsRes] = await Promise.all([
      getScoresByBatch(batchId, academicYear),
      getBatchAnalytics(batchId, academicYear)
    ])
    
    if (scoresRes.data) {
      setStudents(scoresRes.data.students)
      setExams(scoresRes.data.exams)
    }
    if (analyticsRes.data) {
      setAnalytics(analyticsRes.data)
    }
    setLoading(false)
  }

  const handleScoreChange = async (studentId: string, examId: string, value: string) => {
    const marks = value === '' ? null : Number(value)
    if (marks !== null && isNaN(marks)) return // invalid input

    // Update local state immediately for fast typing
    setStudents(prev => prev.map(s => {
      if (s.student_id === studentId) {
        return {
          ...s,
          scores: {
            ...s.scores,
            [examId]: { ...s.scores[examId], marks }
          }
        }
      }
      return s
    }))
  }

  const handleScoreBlur = async (studentId: string, examId: string, value: string) => {
    const marks = value === '' ? null : Number(value)
    if (marks === null || isNaN(marks)) return

    const key = `${studentId}_${examId}`
    setSaveStatus(prev => ({ ...prev, [key]: 'saving' }))
    
    await upsertScore(studentId, examId, marks)
    
    setSaveStatus(prev => ({ ...prev, [key]: 'saved' }))
    
    // Refresh analytics
    const analyticsRes = await getBatchAnalytics(batchId, academicYear)
    if (analyticsRes.data) {
      setAnalytics(analyticsRes.data)
    }

    setTimeout(() => {
      setSaveStatus(prev => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
        <select 
          value={batchId} 
          onChange={e => setBatchId(e.target.value)}
          className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">Select a batch...</option>
          {batches.map(b => (
            <option key={b.id} value={b.id}>{b.display_name}</option>
          ))}
        </select>
      </div>

      {!batchId ? (
        <EmptyState icon={Trophy} title="No Batch Selected" description="Please select a batch to view and manage scores." />
      ) : loading ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : students.length === 0 ? (
        <EmptyState icon={Trophy} title="No Students" description="There are no active students in this batch." />
      ) : exams.length === 0 ? (
        <EmptyState icon={Trophy} title="No Exams Configured" description="Please configure exams in Settings for this academic year." />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Student</th>
                  {exams.map(exam => (
                    <th key={exam.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {exam.name}
                      <div className="text-[10px] text-gray-400 mt-0.5">Max: {exam.max_marks}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map(student => (
                  <tr key={student.student_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{student.student_name}</div>
                      <div className="text-xs text-gray-500">{student.student_code}</div>
                    </td>
                    {exams.map(exam => {
                      const score = student.scores[exam.id]
                      const marks = score?.marks ?? ''
                      const percentage = marks !== '' ? Math.round((marks / exam.max_marks) * 100) : null
                      const key = `${student.student_id}_${exam.id}`
                      const status = saveStatus[key]

                      return (
                        <td key={exam.id} className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex flex-col items-center">
                            <div className="relative flex items-center">
                              <input
                                type="number"
                                min="0"
                                max={exam.max_marks}
                                value={marks}
                                onChange={e => handleScoreChange(student.student_id, exam.id, e.target.value)}
                                onBlur={e => handleScoreBlur(student.student_id, exam.id, e.target.value)}
                                className="w-16 px-2 py-1 text-center text-sm border border-gray-300 rounded focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                              />
                              <div className="absolute -right-5 w-4 h-4">
                                {status === 'saving' && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                                {status === 'saved' && <Check className="w-4 h-4 text-green-500" />}
                              </div>
                            </div>
                            {percentage !== null && (
                              <div className={`text-[10px] mt-1 font-medium ${
                                percentage >= 75 ? 'text-green-600' :
                                percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {percentage}%
                              </div>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Analytics Footer */}
          {analytics && (
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Batch Analytics</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {exams.map(exam => {
                  const avg = analytics.averages[exam.id] || 0
                  const topper = analytics.toppers[exam.id]
                  return (
                    <div key={exam.id} className="bg-white border border-gray-200 rounded-lg p-3">
                      <div className="text-xs font-medium text-gray-500 mb-2">{exam.name}</div>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-sm text-gray-500">Average:</span>
                        <span className="text-sm font-semibold text-gray-900">{avg}</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-sm text-gray-500">Topper:</span>
                        <span className="text-sm font-medium text-indigo-600 text-right">
                          {topper ? `${topper.student_name} (${topper.marks})` : '-'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
