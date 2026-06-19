'use client'

import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { PRESET_COLORS, type Textbook, type TextbookInsert } from '@/types/database'

interface TextbookFormProps {
  open: boolean
  onClose: () => void
  textbook?: Textbook | null
  onSubmit: (data: TextbookInsert) => Promise<void>
}

export function TextbookForm({
  open,
  onClose,
  textbook,
  onSubmit,
}: TextbookFormProps) {
  const [seriesName, setSeriesName] = useState(textbook?.series_name ?? '')
  const [grade, setGrade] = useState(textbook?.grade ?? 1)
  const [colorCode, setColorCode] = useState(
    textbook?.color_code ?? PRESET_COLORS[0].value
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setSeriesName(textbook?.series_name ?? '')
      setGrade(textbook?.grade ?? 1)
      setColorCode(textbook?.color_code ?? PRESET_COLORS[0].value)
      setError(null)
      setLoading(false)
    }
  }, [open, textbook])

  if (!open) return null

  const isEditing = !!textbook
  const displayPreview =
    seriesName && grade ? `${seriesName} - Grade ${grade}` : ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!seriesName.trim()) {
      setError('Series name is required.')
      return
    }
    if (grade < 1 || grade > 12) {
      setError('Grade must be between 1 and 12.')
      return
    }

    setLoading(true)
    try {
      await onSubmit({
        series_name: seriesName.trim(),
        grade,
        color_code: colorCode,
      })
      onClose()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-lg border border-gray-200 p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {isEditing ? 'Edit Textbook' : 'Add Textbook'}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {isEditing
            ? 'Update the textbook details below.'
            : 'Fill in the details to add a new textbook.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Series Name */}
          <div>
            <label
              htmlFor="series_name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Series Name
            </label>
            <input
              id="series_name"
              type="text"
              value={seriesName}
              onChange={(e) => setSeriesName(e.target.value)}
              placeholder="e.g. Kanika, Ruchira"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              autoFocus
            />
          </div>

          {/* Grade */}
          <div>
            <label
              htmlFor="grade"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Grade
            </label>
            <input
              id="grade"
              type="number"
              min={1}
              max={12}
              value={grade}
              onChange={(e) => setGrade(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
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
                    borderColor:
                      colorCode === color.value ? color.value : 'transparent',
                    boxShadow:
                      colorCode === color.value
                        ? `0 0 0 2px white, 0 0 0 4px ${color.value}`
                        : 'none',
                  }}
                >
                  {colorCode === color.value && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </button>
              ))}
              
              <div className="ml-2 flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Or Custom:</span>
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

          {/* Preview */}
          {displayPreview && (
            <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
              <span className="text-xs text-gray-500">Display name:</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: colorCode }}
                />
                <span className="text-sm font-medium text-gray-900">
                  {displayPreview}
                </span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading
                ? 'Saving...'
                : isEditing
                  ? 'Update Textbook'
                  : 'Add Textbook'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
