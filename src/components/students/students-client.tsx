'use client'

import { useState, useMemo } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { StudentForm } from '@/components/students/student-form'
import { markPassedOut, deleteStudent } from '@/lib/actions/students'
import { StudentWithBatch, BatchWithTextbook } from '@/types/database'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Pencil, GraduationCap, Search, Users, Trash2 } from 'lucide-react'

interface StudentsClientProps {
  students: StudentWithBatch[]
  batches: BatchWithTextbook[]
}

export function StudentsClient({ students, batches }: StudentsClientProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<StudentWithBatch | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [passingOutId, setPassingOutId] = useState<string | null>(null)
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Filters
  const [batchFilter, setBatchFilter] = useState('')
  const [modeFilter, setModeFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      if (batchFilter && student.batch_id !== batchFilter) return false
      if (modeFilter && student.class_mode !== modeFilter) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesName = student.full_name.toLowerCase().includes(query)
        const matchesPhone = student.parent_phone.toLowerCase().includes(query)
        const matchesCode = student.student_code.toLowerCase().includes(query)
        if (!matchesName && !matchesPhone && !matchesCode) return false
      }
      return true
    })
  }, [students, batchFilter, modeFilter, searchQuery])

  const handleEdit = (student: StudentWithBatch) => {
    setEditingStudent(student)
    setFormOpen(true)
  }

  const handleCloseForm = () => {
    setFormOpen(false)
    setEditingStudent(null)
  }

  const handlePassedOutClick = (id: string) => {
    setPassingOutId(id)
    setConfirmOpen(true)
  }

  const handleConfirmPassedOut = async () => {
    if (passingOutId) {
      await markPassedOut(passingOutId)
      setPassingOutId(null)
    }
  }

  const handleDeleteClick = (id: string) => {
    setDeletingId(id)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (deletingId) {
      const res = await deleteStudent(deletingId)
      if (!res.success) {
        alert(res.error)
      }
      setDeleteConfirmOpen(false)
      setDeletingId(null)
    }
  }

  return (
    <>
      <PageHeader title="Students" description={`${students.length} active students`}>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Student
        </button>
      </PageHeader>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone, or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <select
          value={batchFilter}
          onChange={(e) => setBatchFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">All Batches</option>
          {batches.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.display_name}
            </option>
          ))}
        </select>

        <select
          value={modeFilter}
          onChange={(e) => setModeFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">All Modes</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>

        {(batchFilter || modeFilter || searchQuery) && (
          <button
            onClick={() => {
              setBatchFilter('')
              setModeFilter('')
              setSearchQuery('')
            }}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <EmptyState
            icon={Users}
            title="No students found"
            description={
              students.length === 0
                ? 'Add your first student to get started.'
                : 'No students match the current filters.'
            }
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Code</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">School</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Batch</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Fee (₹)</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Mode</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Join Date</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                    {student.student_code}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {student.full_name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {student.school_name || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: student.batch.textbook.color_code }}
                      />
                      <span className="text-gray-700">{student.batch.display_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900 tabular-nums">
                    {formatCurrency(student.monthly_fee)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        student.class_mode === 'offline'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {student.class_mode === 'offline' ? 'Offline' : 'Online'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(student.join_date)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(student)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit student"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePassedOutClick(student.id)}
                        className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Mark as passed out"
                      >
                        <GraduationCap className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(student.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Filtered count */}
      {filteredStudents.length > 0 && filteredStudents.length !== students.length && (
        <p className="text-xs text-gray-500 mt-2">
          Showing {filteredStudents.length} of {students.length} students
        </p>
      )}

      {/* Add / Edit Form Modal */}
      <StudentForm
        open={formOpen}
        onClose={handleCloseForm}
        student={editingStudent}
        batches={batches}
      />

      {/* Passed Out Confirmation */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false)
          setPassingOutId(null)
        }}
        onConfirm={handleConfirmPassedOut}
        title="Mark as Passed Out"
        description="This student will be moved to the Passed Out list. They will no longer appear in active student lists, attendance, or fee records. You can restore them later."
        confirmText="Mark Passed Out"
        variant="danger"
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false)
          setDeletingId(null)
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Student"
        description="Are you sure you want to permanently delete this student? This action cannot be undone. (Note: You cannot delete a student if they have attendance or fee records; mark them as Passed Out instead)."
        confirmText="Delete Permanently"
        variant="danger"
      />
    </>
  )
}
