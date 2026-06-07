'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getExams(academicYear: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('academic_year', academicYear)
    .order('created_at')
  
  return { data: data || [], error: error?.message }
}

export async function getScoresByBatch(batchId: string, academicYear: number) {
  const supabase = await createClient()
  
  const { data: exams, error: examsErr } = await getExams(academicYear)
  if (examsErr) return { data: null, error: examsErr }

  const { data: students, error: studentErr } = await supabase
    .from('students')
    .select('id, full_name, student_code')
    .eq('batch_id', batchId)
    .eq('is_passed_out', false)
    .order('full_name')

  if (studentErr) return { data: null, error: studentErr.message }

  const examIds = exams.map(e => e.id)
  
  const { data: scores, error: scoresErr } = await supabase
    .from('score_records')
    .select('id, student_id, exam_id, marks, remarks')
    .in('exam_id', examIds.length > 0 ? examIds : ['00000000-0000-0000-0000-000000000000'])

  if (scoresErr) return { data: null, error: scoresErr.message }

  const studentsWithScores = (students || []).map(s => {
    const sScores: Record<string, any> = {}
    ;(scores || []).filter(sc => sc.student_id === s.id).forEach(sc => {
      sScores[sc.exam_id] = { score_id: sc.id, marks: sc.marks, remarks: sc.remarks }
    })
    return {
      student_id: s.id,
      student_name: s.full_name,
      student_code: s.student_code,
      scores: sScores
    }
  })

  return { data: { students: studentsWithScores, exams }, error: null }
}

export async function upsertScore(studentId: string, examId: string, marks: number, remarks?: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('score_records')
    .upsert({ student_id: studentId, exam_id: examId, marks, remarks: remarks || null }, { onConflict: 'student_id,exam_id' })

  if (error) return { error: error.message }
  revalidatePath('/scores')
  return { success: true }
}

export async function deleteScore(scoreId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('score_records')
    .delete()
    .eq('id', scoreId)

  if (error) return { error: error.message }
  revalidatePath('/scores')
  return { success: true }
}

export async function getBatchAnalytics(batchId: string, academicYear: number) {
  const { data, error } = await getScoresByBatch(batchId, academicYear)
  if (error || !data) return { data: null, error }

  const { students, exams } = data
  const averages: Record<string, number> = {}
  const toppers: Record<string, { student_name: string, marks: number }> = {}

  exams.forEach(exam => {
    let sum = 0
    let count = 0
    let maxMarks = -1
    let topperName = ''

    students.forEach(student => {
      const score = student.scores[exam.id]
      if (score && typeof score.marks === 'number') {
        sum += score.marks
        count++
        if (score.marks > maxMarks) {
          maxMarks = score.marks
          topperName = student.student_name
        }
      }
    })

    averages[exam.id] = count > 0 ? Math.round((sum / count) * 100) / 100 : 0
    if (maxMarks >= 0) {
      toppers[exam.id] = { student_name: topperName, marks: maxMarks }
    }
  })

  return { data: { averages, toppers }, error: null }
}
