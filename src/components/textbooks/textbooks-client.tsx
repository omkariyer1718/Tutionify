'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react'
import type { Textbook, TextbookInsert } from '@/types/database'
import { TextbookForm } from '@/components/textbooks/textbook-form'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/layout/page-header'
import {
  createTextbook,
  updateTextbook,
  deleteTextbook,
} from '@/lib/actions/textbooks'

interface TextbooksClientProps {
  textbooks: Textbook[]
}

export function TextbooksClient({ textbooks }: TextbooksClientProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [editingTextbook, setEditingTextbook] = useState<Textbook | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Textbook | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async (data: TextbookInsert) => {
    const result = await createTextbook(data)
    if (!result.success) {
      throw new Error(result.error)
    }
  }

  const handleUpdate = async (data: TextbookInsert) => {
    if (!editingTextbook) return
    const result = await updateTextbook(editingTextbook.id, data)
    if (!result.success) {
      throw new Error(result.error)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setError(null)
    const result = await deleteTextbook(deleteTarget.id)
    if (!result.success) {
      setError(result.error ?? 'Failed to delete textbook.')
      throw new Error(result.error)
    }
  }

  const openEditForm = (textbook: Textbook) => {
    setEditingTextbook(textbook)
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingTextbook(null)
  }

  return (
    <div>
      <PageHeader
        title="Textbooks"
        description="Manage textbook series and grades used across batches."
      >
        <button
          onClick={() => {
            setEditingTextbook(null)
            setFormOpen(true)
          }}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Textbook
        </button>
      </PageHeader>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 px-4 py-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 text-xs font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {textbooks.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <EmptyState
            icon={BookOpen}
            title="No textbooks yet"
            description="Add your first textbook series to start creating batches."
          >
            <button
              onClick={() => setFormOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Textbook
            </button>
          </EmptyState>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500 w-12">
                  Color
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  Display Name
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  Series
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 w-20">
                  Grade
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {textbooks.map((textbook) => (
                <tr
                  key={textbook.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span
                      className="block w-4 h-4 rounded-full"
                      style={{ backgroundColor: textbook.color_code }}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {textbook.display_name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {textbook.series_name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{textbook.grade}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditForm(textbook)}
                        title="Edit textbook"
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(textbook)}
                        title="Delete textbook"
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* Add / Edit Form Modal */}
      <TextbookForm
        open={formOpen}
        onClose={closeForm}
        textbook={editingTextbook}
        onSubmit={editingTextbook ? handleUpdate : handleCreate}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Textbook"
        description={`Are you sure you want to delete "${deleteTarget?.display_name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}
