'use client'

import { useState } from 'react'
import { updateSettings } from '@/lib/actions/settings'
import { deleteExam } from '@/lib/actions/exams'
import { ExamForm } from './exam-form'
import { PromotionPreview } from './promotion-preview'
import { ExportTools } from './export-tools'
import { Settings, BookOpen, UserPlus, Database, Loader2, Trash2, Edit2, Plus } from 'lucide-react'

export function SettingsClient({ settings, exams, batches, textbooks, promotionHistory }: any) {
  const [activeTab, setActiveTab] = useState<'general' | 'exams' | 'promotions' | 'export'>('general')
  
  // General Settings
  const [feeDueDay, setFeeDueDay] = useState(settings?.fee_due_day || 5)
  const [academicYear, setAcademicYear] = useState(settings?.academic_year || new Date().getFullYear())
  const [savingGeneral, setSavingGeneral] = useState(false)

  // Exam Form
  const [examFormOpen, setExamFormOpen] = useState(false)
  const [selectedExam, setSelectedExam] = useState<any>(null)

  const handleSaveGeneral = async () => {
    setSavingGeneral(true)
    await updateSettings(settings.id, feeDueDay, academicYear)
    setSavingGeneral(false)
    alert('Settings updated successfully')
  }

  const handleDeleteExam = async (id: string) => {
    if (confirm('Are you sure you want to delete this exam? All related scores will be deleted.')) {
      await deleteExam(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('general')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'general' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings className="w-4 h-4" /> General
          </button>
          <button
            onClick={() => setActiveTab('exams')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'exams' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Exams
          </button>
          <button
            onClick={() => setActiveTab('promotions')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'promotions' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <UserPlus className="w-4 h-4" /> Yearly Promotions
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'export' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Database className="w-4 h-4" /> Export & Tools
          </button>
        </nav>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        {activeTab === 'general' && (
          <div className="max-w-md space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Preferences</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fee Due Date (Day of Month)</label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={feeDueDay}
                    onChange={e => setFeeDueDay(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">Fees will be marked as overdue after this day.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Academic Year</label>
                  <input
                    type="number"
                    value={academicYear}
                    onChange={e => setAcademicYear(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={handleSaveGeneral}
              disabled={savingGeneral}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
            >
              {savingGeneral && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        )}

        {activeTab === 'exams' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Exams for {settings?.academic_year}</h3>
              <button
                onClick={() => { setSelectedExam(null); setExamFormOpen(true) }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Exam
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Marks</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {exams.map((exam: any) => (
                    <tr key={exam.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{exam.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{exam.max_marks}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => { setSelectedExam(exam); setExamFormOpen(true) }} className="text-indigo-600 hover:text-indigo-900 mr-4">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteExam(exam.id)} className="text-red-600 hover:text-red-900">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {exams.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">No exams configured.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {examFormOpen && (
              <ExamForm 
                open={examFormOpen} 
                onClose={() => setExamFormOpen(false)} 
                exam={selectedExam} 
                academicYear={settings?.academic_year} 
              />
            )}
          </div>
        )}

        {activeTab === 'promotions' && (
          <PromotionPreview batches={batches} textbooks={textbooks} promotionHistory={promotionHistory} />
        )}

        {activeTab === 'export' && (
          <ExportTools />
        )}
      </div>
    </div>
  )
}
