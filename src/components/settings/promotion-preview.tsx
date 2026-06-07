'use client'

import { useState } from 'react'
import { processPromotions, undoPromotion } from '@/lib/actions/settings'
import { Loader2, RotateCcw } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export function PromotionPreview({ batches, textbooks, promotionHistory }: any) {
  const [loading, setLoading] = useState(false)
  const [undoingId, setUndoingId] = useState<string | null>(null)

  const [actions, setActions] = useState<Record<string, { action: 'promote' | 'pass_out' | 'none', new_textbook_id?: string }>>(() => {
    const init: Record<string, any> = {}
    batches.forEach((b: any) => {
      const currentGrade = b.textbook?.grade
      if (currentGrade === 10) {
        init[b.id] = { action: 'pass_out' }
      } else if (currentGrade) {
        const nextGradeTextbooks = textbooks.filter((t: any) => t.grade === currentGrade + 1)
        
        const exactMatch = nextGradeTextbooks.find((t: any) => t.series_name === b.textbook?.series_name)
        
        if (exactMatch) {
          init[b.id] = { action: 'promote', new_textbook_id: exactMatch.id }
        } else if (nextGradeTextbooks.length > 0) {
          init[b.id] = { action: 'promote', new_textbook_id: nextGradeTextbooks[0].id }
        } else {
          init[b.id] = { action: 'none' }
        }
      } else {
        init[b.id] = { action: 'none' }
      }
    })
    return init
  })

  const handleActionChange = (batchId: string, val: string) => {
    if (val === 'none') {
      setActions(prev => ({ ...prev, [batchId]: { action: 'none' } }))
    } else if (val === 'pass_out') {
      setActions(prev => ({ ...prev, [batchId]: { action: 'pass_out' } }))
    } else {
      setActions(prev => ({ ...prev, [batchId]: { action: 'promote', new_textbook_id: val } }))
    }
  }

  const handleExecute = async () => {
    if (!confirm('Are you sure you want to execute these promotions?')) return
    
    setLoading(true)
    const list = Object.entries(actions)
      .filter(([_, data]) => data.action !== 'none')
      .map(([batch_id, data]) => ({ batch_id, ...data }))
    
    const res = await processPromotions(list)
    setLoading(false)
    if (res.success) {
      alert('Promotions executed successfully.')
      setActions({})
    }
  }

  const handleUndo = async (historyId: string) => {
    if (!confirm('Are you sure you want to undo this promotion?')) return
    setUndoingId(historyId)
    const res = await undoPromotion(historyId)
    if (!res.success) alert(res.error)
    setUndoingId(null)
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Yearly Promotion Preview</h3>
        <p className="text-sm text-gray-500 mb-6">Review and confirm batch promotions to the next grade. 10th grade batches are marked to pass out by default. When a batch is promoted, its timetable slots remain exactly the same.</p>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Grade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action / Next Grade</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {batches.map((batch: any) => {
                const currentGrade = batch.textbook?.grade
                const nextGradeTextbooks = textbooks.filter((t: any) => t.grade === currentGrade + 1)
                const action = actions[batch.id]

                return (
                  <tr key={batch.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {batch.display_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {currentGrade ? `Grade ${currentGrade}` : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <select
                        value={action?.action === 'promote' ? action.new_textbook_id : action?.action || 'none'}
                        onChange={e => handleActionChange(batch.id, e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="none">No Action (Stay in current grade)</option>
                        <option value="pass_out">Pass Out (Archive Batch & Students)</option>
                        {nextGradeTextbooks.length > 0 && (
                          <optgroup label={`Promote to Grade ${currentGrade + 1}`}>
                            {nextGradeTextbooks.map((t: any) => (
                              <option key={t.id} value={t.id}>Promote to {t.display_name}</option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </td>
                  </tr>
                )
              })}
              {batches.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">No active batches found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <button
          onClick={handleExecute}
          disabled={loading || batches.length === 0}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Execute Promotions
        </button>
      </div>

      <div className="pt-8 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Promotion History</h3>
        <p className="text-sm text-gray-500 mb-6">Review recent promotions. You can undo mistakes to revert a batch to its original state.</p>
        
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Undo</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {promotionHistory.map((history: any) => (
                <tr key={history.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(history.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {history.batch?.display_name || 'Unknown Batch'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {history.action === 'promote' ? 'Promoted' : 'Passed Out'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {history.action === 'promote' 
                      ? `${history.old_textbook?.display_name || 'Unknown'} → ${history.new_textbook?.display_name || 'Unknown'}`
                      : 'Moved to Alumni'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleUndo(history.id)}
                      disabled={undoingId === history.id}
                      className="text-red-600 hover:text-red-900 flex items-center justify-end gap-1 ml-auto"
                    >
                      {undoingId === history.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RotateCcw className="w-4 h-4" />
                      )}
                      Undo
                    </button>
                  </td>
                </tr>
              ))}
              {promotionHistory.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">No promotion history found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
