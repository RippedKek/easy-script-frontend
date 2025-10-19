'use client'
import { useBatchStore } from '@/lib/batchStore'
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Users,
  Award,
  BarChart3,
  X,
  ChevronDown,
} from 'lucide-react'
import ResultCards from '@/components/ResultCards'
import { useState, useMemo, useEffect } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'

const COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#6366f1',
  '#ef4444',
  '#14b8a6',
]

type ViewMode = 'overview' | 'questions' | 'students' | 'distribution'

export default function ResultsPage() {
  const { isRunning, meta, tick, ticks, result, error } = useBatchStore()
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('overview')
  const [fullMarks, setFullMarks] = useState<Record<string, number>>({})

  // derive all question ids from current batch result
  const questionIds = useMemo(() => {
    const ids = new Set<string>()
    const students = result?.students
      ? (Object.values(result.students as Record<string, any>) as any[])
      : []
    for (const s of students) {
      if (s?.marks) {
        for (const qid of Object.keys((s as any).marks)) ids.add(qid)
      }
    }
    return Array.from(ids).sort()
  }, [result])

  // ensure defaults (10) for any new questions discovered
  useEffect(() => {
    if (!questionIds.length) return
    setFullMarks((prev) => {
      const next: Record<string, number> = { ...prev }
      let changed = false
      for (const qid of questionIds) {
        if (next[qid] == null || Number.isNaN(next[qid])) {
          next[qid] = 10
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [questionIds])

  // Calculate statistics
  const stats = useMemo(() => {
    if (!result?.students) return null

    const students = Object.entries(result.students)
    const validStudents = students.filter(
      ([_, data]: any) => data?.status !== 'error'
    )

    // Collect all marks
    const allMarks: Record<string, number[]> = {}
    const studentScores: { id: string; total: number; percentage: number }[] =
      []

    validStudents.forEach(([id, data]: any) => {
      if (data?.marks) {
        let totalMarks = 0
        let totalPossible = 0

        Object.entries(data.marks).forEach(([qid, mark]: any) => {
          if (!allMarks[qid]) allMarks[qid] = []
          const obtainedPct = parseFloat(mark.score) || 0
          const fm = Number(fullMarks[qid] ?? 10)
          const scoreActual = (fm * obtainedPct) / 100
          allMarks[qid].push(scoreActual)
          totalMarks += scoreActual
          totalPossible += fm
        })

        studentScores.push({
          id,
          total: totalMarks,
          percentage:
            totalPossible > 0 ? (totalMarks / totalPossible) * 100 : 0,
        })
      }
    })

    // Calculate question-wise statistics
    const questionStats = Object.entries(allMarks).map(([qid, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length
      const max = Math.max(...scores)
      const min = Math.min(...scores)
      return {
        question: qid,
        average: avg,
        max,
        min,
        count: scores.length,
        fullMark: Number(fullMarks[qid] ?? 10),
      }
    })

    // Calculate grade distribution
    const gradeRanges = [
      { grade: 'A+ (90-100)', min: 90, max: 100, count: 0 },
      { grade: 'A (80-89)', min: 80, max: 90, count: 0 },
      { grade: 'B (70-79)', min: 70, max: 80, count: 0 },
      { grade: 'C (60-69)', min: 60, max: 70, count: 0 },
      { grade: 'D (50-59)', min: 50, max: 60, count: 0 },
      { grade: 'F (<50)', min: 0, max: 50, count: 0 },
    ]

    studentScores.forEach(({ percentage }) => {
      const range = gradeRanges.find(
        (r) => percentage >= r.min && percentage < r.max
      )
      if (range) range.count++
    })

    const totalScore = studentScores.reduce((sum, s) => sum + s.total, 0)
    const avgScore =
      studentScores.length > 0 ? totalScore / studentScores.length : 0
    const avgPercentage =
      studentScores.length > 0
        ? studentScores.reduce((sum, s) => sum + s.percentage, 0) /
          studentScores.length
        : 0

    return {
      totalStudents: students.length,
      validStudents: validStudents.length,
      errorStudents: students.length - validStudents.length,
      questionStats,
      gradeDistribution: gradeRanges.filter((r) => r.count > 0),
      studentScores: studentScores.sort((a, b) => b.percentage - a.percentage),
      avgScore,
      avgPercentage,
      highestScore:
        studentScores.length > 0
          ? Math.max(...studentScores.map((s) => s.total))
          : 0,
      lowestScore:
        studentScores.length > 0
          ? Math.min(...studentScores.map((s) => s.total))
          : 0,
    }
  }, [result, fullMarks])

  const header = (
    <div className='mb-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-slate-900 dark:text-white mb-2'>
            Batch Assessment Dashboard
          </h1>
          {meta?.students_total !== undefined && (
            <p className='text-sm text-slate-600 dark:text-slate-400'>
              Total students detected: {meta.students_total}
            </p>
          )}
        </div>
        {stats && !isRunning && (
          <div className='flex gap-2'>
            <button
              onClick={() => setViewMode('overview')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'overview'
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setViewMode('questions')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'questions'
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              Questions
            </button>
            <button
              onClick={() => setViewMode('students')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'students'
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              Students
            </button>
            <button
              onClick={() => setViewMode('distribution')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'distribution'
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              Distribution
            </button>
          </div>
        )}
      </div>
    </div>
  )

  if (error) {
    return (
      <main className='max-w-7xl mx-auto p-6'>
        {header}
        <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6'>
          <div className='flex items-center gap-3 text-red-600 dark:text-red-400'>
            <AlertTriangle className='w-6 h-6' />
            <div>
              <h3 className='font-semibold text-lg'>Error</h3>
              <p className='text-sm mt-1'>{error}</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className='max-w-7xl mx-auto p-6'>
      {header}

      {/* Full marks editor */}
      {stats && !isRunning && questionIds.length > 0 && (
        <div className='mb-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-bold text-slate-900 dark:text-white'>
              Set Full Marks per Question
            </h3>
            <button
              className='text-sm px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
              onClick={() =>
                setFullMarks((prev) => {
                  const next: Record<string, number> = { ...prev }
                  for (const qid of questionIds) next[qid] = 10
                  return next
                })
              }
            >
              Reset all to 10
            </button>
          </div>
          <div className='grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
            {questionIds.map((qid) => (
              <label
                key={qid}
                className='flex items-center gap-3 bg-slate-50 dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700'
              >
                <span className='font-medium text-slate-900 dark:text-white truncate'>
                  {qid}
                </span>
                <input
                  type='number'
                  min={1}
                  step={1}
                  value={Number.isFinite(fullMarks[qid]) ? fullMarks[qid] : 10}
                  onChange={(e) =>
                    setFullMarks((prev) => ({
                      ...prev,
                      [qid]: Math.max(
                        1,
                        Math.round(Number(e.target.value) || 0)
                      ),
                    }))
                  }
                  className='ml-auto w-24 px-2 py-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                />
                <span className='text-sm text-slate-600 dark:text-slate-400'>
                  marks
                </span>
              </label>
            ))}
          </div>
          <p className='mt-3 text-xs text-slate-500'>
            These values update all percentages and charts.
          </p>
        </div>
      )}

      {/* Live status */}
      {isRunning && (
        <div className='mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl border border-blue-200 dark:border-blue-800 p-6'>
          <div className='flex items-center gap-3 mb-4'>
            <Loader2 className='w-5 h-5 animate-spin text-blue-600 dark:text-blue-400' />
            <span className='font-semibold text-slate-900 dark:text-white'>
              {tick?.event === 'progress' && tick?.phase === 'student_start'
                ? `Processing student ${tick.index}/${tick.total}: ${tick.student_id}`
                : tick?.event === 'progress' && tick?.phase === 'student_done'
                ? `Completed student ${tick.index}/${tick.total}: ${tick.student_id}`
                : 'Initializing assessment...'}
            </span>
          </div>

          {tick?.total && (
            <div className='w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3'>
              <div
                className='bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300'
                style={{ width: `${((tick.index || 0) / tick.total) * 100}%` }}
              />
            </div>
          )}

          {/* Activity log */}
          <details className='mt-4'>
            <summary className='cursor-pointer text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'>
              View activity log
            </summary>
            <div className='mt-3 max-h-48 overflow-auto bg-white dark:bg-slate-800 rounded-lg p-3 text-xs space-y-1 font-mono'>
              {ticks.slice(-15).map((t, i) => (
                <div key={i} className='text-slate-600 dark:text-slate-400'>
                  <span className='text-blue-600 dark:text-blue-400'>
                    {t.event}
                  </span>{' '}
                  · {JSON.stringify(t)}
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      {/* Statistics Overview */}
      {stats && !isRunning && (
        <>
          {viewMode === 'overview' && (
            <div className='space-y-6'>
              {/* Key Metrics */}
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                <div className='bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 rounded-2xl p-6 border border-blue-200 dark:border-blue-800'>
                  <div className='flex items-center justify-between mb-2'>
                    <Users className='w-8 h-8 text-blue-600 dark:text-blue-400' />
                  </div>
                  <div className='text-3xl font-bold text-blue-900 dark:text-blue-100'>
                    {stats.validStudents}
                  </div>
                  <div className='text-sm text-blue-700 dark:text-blue-300'>
                    Students Assessed
                  </div>
                  {stats.errorStudents > 0 && (
                    <div className='text-xs text-red-600 dark:text-red-400 mt-1'>
                      {stats.errorStudents} errors
                    </div>
                  )}
                </div>

                <div className='bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 rounded-2xl p-6 border border-green-200 dark:border-green-800'>
                  <div className='flex items-center justify-between mb-2'>
                    <TrendingUp className='w-8 h-8 text-green-600 dark:text-green-400' />
                  </div>
                  <div className='text-3xl font-bold text-green-900 dark:text-green-100'>
                    {stats.avgPercentage.toFixed(1)}%
                  </div>
                  <div className='text-sm text-green-700 dark:text-green-300'>
                    Class Average
                  </div>
                </div>

                <div className='bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 rounded-2xl p-6 border border-purple-200 dark:border-purple-800'>
                  <div className='flex items-center justify-between mb-2'>
                    <Award className='w-8 h-8 text-purple-600 dark:text-purple-400' />
                  </div>
                  <div className='text-3xl font-bold text-purple-900 dark:text-purple-100'>
                    {stats.highestScore}
                  </div>
                  <div className='text-sm text-purple-700 dark:text-purple-300'>
                    Highest Score
                  </div>
                </div>

                <div className='bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50 rounded-2xl p-6 border border-orange-200 dark:border-orange-800'>
                  <div className='flex items-center justify-between mb-2'>
                    <BarChart3 className='w-8 h-8 text-orange-600 dark:text-orange-400' />
                  </div>
                  <div className='text-3xl font-bold text-orange-900 dark:text-orange-100'>
                    {stats.lowestScore}
                  </div>
                  <div className='text-sm text-orange-700 dark:text-orange-300'>
                    Lowest Score
                  </div>
                </div>
              </div>

              {/* Charts Row */}
              <div className='grid md:grid-cols-2 gap-6'>
                {/* Grade Distribution */}
                <div className='bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700'>
                  <h3 className='text-lg font-bold text-slate-900 dark:text-white mb-4'>
                    Grade Distribution
                  </h3>
                  <ResponsiveContainer width='100%' height={300}>
                    <PieChart>
                      <Pie
                        data={stats.gradeDistribution}
                        dataKey='count'
                        nameKey='grade'
                        cx='50%'
                        cy='50%'
                        outerRadius={100}
                        label={(entry) => `${entry.grade}: ${entry.count}`}
                      >
                        {stats.gradeDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Top Performers */}
                <div className='bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700'>
                  <h3 className='text-lg font-bold text-slate-900 dark:text-white mb-4'>
                    Top 10 Students
                  </h3>
                  <div className='space-y-2 max-h-[300px] overflow-y-auto'>
                    {stats.studentScores.slice(0, 10).map((student, index) => (
                      <div
                        key={student.id}
                        className='flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer transition-colors'
                        onClick={() => setSelectedStudent(student.id)}
                      >
                        <div className='flex items-center gap-3'>
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              index === 0
                                ? 'bg-yellow-400 text-yellow-900'
                                : index === 1
                                ? 'bg-slate-300 text-slate-900'
                                : index === 2
                                ? 'bg-orange-400 text-orange-900'
                                : 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                            }`}
                          >
                            {index + 1}
                          </div>
                          <span className='font-medium text-slate-900 dark:text-white'>
                            {student.id}
                          </span>
                        </div>
                        <div className='text-right'>
                          <div className='font-bold text-slate-900 dark:text-white'>
                            {student.percentage.toFixed(1)}%
                          </div>
                          <div className='text-xs text-slate-600 dark:text-slate-400'>
                            {student.total} marks
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'questions' && (
            <div className='space-y-6'>
              <div className='bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700'>
                <h3 className='text-lg font-bold text-slate-900 dark:text-white mb-4'>
                  Question-wise Performance
                </h3>
                <ResponsiveContainer width='100%' height={400}>
                  <BarChart data={stats.questionStats}>
                    <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
                    <XAxis dataKey='question' stroke='#64748b' />
                    <YAxis stroke='#64748b' />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: 'none',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey='average'
                      fill='#3b82f6'
                      name='Average Score'
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar
                      dataKey='max'
                      fill='#10b981'
                      name='Maximum Score'
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar
                      dataKey='min'
                      fill='#ef4444'
                      name='Minimum Score'
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className='bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700'>
                <h3 className='text-lg font-bold text-slate-900 dark:text-white mb-4'>
                  Difficulty Analysis
                </h3>
                <div className='grid gap-4'>
                  {stats.questionStats
                    .sort((a, b) => a.average - b.average)
                    .map((q, index) => (
                      <div key={q.question} className='flex items-center gap-4'>
                        <div className='w-32 font-medium text-slate-900 dark:text-white'>
                          {q.question}
                        </div>
                        <div className='flex-1'>
                          <div className='flex items-center gap-2'>
                            <div className='flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-6'>
                              <div
                                className={`h-6 rounded-full flex items-center justify-end pr-2 text-xs font-bold text-white ${
                                  q.average >= 0.8 * q.fullMark
                                    ? 'bg-green-500'
                                    : q.average >= 0.6 * q.fullMark
                                    ? 'bg-blue-500'
                                    : q.average >= 0.4 * q.fullMark
                                    ? 'bg-orange-500'
                                    : 'bg-red-500'
                                }`}
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (q.average / q.fullMark) * 100
                                  )}%`,
                                }}
                              >
                                {q.average.toFixed(1)}
                              </div>
                            </div>
                            <span className='text-sm text-slate-600 dark:text-slate-400 w-20'>
                              {q.average >= 0.8 * q.fullMark
                                ? 'Easy'
                                : q.average >= 0.6 * q.fullMark
                                ? 'Medium'
                                : q.average >= 0.4 * q.fullMark
                                ? 'Hard'
                                : 'Very Hard'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {viewMode === 'students' && (
            <div className='bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700'>
              <h3 className='text-lg font-bold text-slate-900 dark:text-white mb-4'>
                All Students
              </h3>
              <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {stats.studentScores.map((student) => (
                  <div
                    key={student.id}
                    className='p-4 bg-slate-50 dark:bg-slate-700 rounded-xl hover:shadow-lg hover:scale-105 transition-all cursor-pointer border-2 border-transparent hover:border-blue-500'
                    onClick={() => setSelectedStudent(student.id)}
                  >
                    <div className='flex items-center justify-between mb-2'>
                      <span className='font-semibold text-slate-900 dark:text-white'>
                        {student.id}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                          student.percentage >= 90
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : student.percentage >= 80
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : student.percentage >= 70
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : student.percentage >= 60
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {student.percentage >= 90
                          ? 'A+'
                          : student.percentage >= 80
                          ? 'A'
                          : student.percentage >= 70
                          ? 'B'
                          : student.percentage >= 60
                          ? 'C'
                          : student.percentage >= 50
                          ? 'D'
                          : 'F'}
                      </span>
                    </div>
                    <div className='text-2xl font-bold text-slate-900 dark:text-white mb-1'>
                      {student.percentage.toFixed(1)}%
                    </div>
                    <div className='text-sm text-slate-600 dark:text-slate-400'>
                      {student.total} marks
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'distribution' && (
            <div className='space-y-6'>
              <div className='bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700'>
                <h3 className='text-lg font-bold text-slate-900 dark:text-white mb-4'>
                  Score Distribution
                </h3>
                <ResponsiveContainer width='100%' height={400}>
                  <LineChart
                    data={stats.studentScores.map((s, i) => ({
                      index: i + 1,
                      score: s.total,
                      percentage: s.percentage,
                    }))}
                  >
                    <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
                    <XAxis
                      dataKey='index'
                      label={{
                        value: 'Student Rank',
                        position: 'insideBottom',
                        offset: -5,
                      }}
                      stroke='#64748b'
                    />
                    <YAxis stroke='#64748b' />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: 'none',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line
                      type='monotone'
                      dataKey='percentage'
                      stroke='#3b82f6'
                      strokeWidth={2}
                      name='Percentage'
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className='bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700'>
                <h3 className='text-lg font-bold text-slate-900 dark:text-white mb-4'>
                  Performance Radar
                </h3>
                <ResponsiveContainer width='100%' height={400}>
                  <RadarChart data={stats.questionStats.slice(0, 8)}>
                    <PolarGrid stroke='#e5e7eb' />
                    <PolarAngleAxis dataKey='question' stroke='#64748b' />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[
                        0,
                        Math.max(
                          ...stats.questionStats.map(
                            (q: any) => q.fullMark || 10
                          )
                        ),
                      ]}
                      stroke='#64748b'
                    />
                    <Radar
                      name='Average Score'
                      dataKey='average'
                      stroke='#3b82f6'
                      fill='#3b82f6'
                      fillOpacity={0.6}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: 'none',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}

      {/* Student Detail Modal */}
      {selectedStudent && result?.students[selectedStudent] && (
        <div
          className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'
          onClick={() => setSelectedStudent(null)}
        >
          <div
            className='bg-white dark:bg-slate-900 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-auto'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between z-10'>
              <div>
                <h2 className='text-2xl font-bold text-slate-900 dark:text-white'>
                  Student: {selectedStudent}
                </h2>
                <p className='text-sm text-slate-600 dark:text-slate-400'>
                  Detailed Assessment Results
                </p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className='p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors'
              >
                <X className='w-6 h-6 text-slate-600 dark:text-slate-400' />
              </button>
            </div>
            <div className='p-6'>
              {result.students[selectedStudent]?.status === 'error' ? (
                <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6'>
                  <p className='text-red-600 dark:text-red-400'>
                    Error: {result.students[selectedStudent].detail}
                  </p>
                </div>
              ) : (
                <ResultCards data={result.students[selectedStudent]} />
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
