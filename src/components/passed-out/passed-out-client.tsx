'use client'

import { useState } from 'react'
import { updateStudent } from '@/lib/actions/students'
import { EmptyState } from '@/components/ui/empty-state'
import { GraduationCap, Search, RefreshCw, Loader2 } from 'lucide-react'
import type { StudentWithBatch } from '@/types/database'

interface PassedOutClientProps {
  students: StudentWithBatch[]
}

export function PassedOutClient({ students: initialStudents }: PassedOutClientProps) {
  const [students, setStudents] = useState(initialStudents)
  const [search, setSearch] = useState('')
  const [restoring, setRestoring] = useState<string | null>(null)

  const filtered = students.filter(s => 
    s.full_name.toLowerCase().includes(search.toLowerCase()) || 
    s.student_code.toLowerCase().includes(search.toLowerCase())
  )

  const handleRestore = async (id: string) => {
    if (!confirm('Are you sure you want to restore this student to active status?')) return
    setRestoring(id)
    const res = await updateStudent(id, { is_passed_out: false })
    if (!res.error) {
      setStudents(prev => prev.filter(s => s.id !== id))
    } else {
      alert(res.error)
    }
    setRestoring(null)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search alumni by name or code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      {students.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No Alumni" description="There are no passed out students yet." />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Search} title="No Results" description="No alumni found matching your search." />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Batch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map(student => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                        {student.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{student.full_name}</div>
                        <div className="text-sm text-gray-500">{student.student_code}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.batch?.display_name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{student.batch?.textbook?.display_name || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(student.join_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleRestore(student.id)}
                      disabled={restoring === student.id}
                      className="text-indigo-600 hover:text-indigo-900 flex items-center justify-end gap-1 w-full"
                    >
                      {restoring === student.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      Restore
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
