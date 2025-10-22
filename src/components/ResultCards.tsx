'use client'
import { useMemo, useState } from 'react'
import type { CheckScriptsResponse } from '@/types'
import Modal from '@/components/Modal'
import {
  User,
  FileCheck,
  Award,
  Image,
  ChevronDown,
  ChevronUp,
  Maximize2,
  FileText,
  Edit3,
  Check,
  X,
} from 'lucide-react'

function tryParseJSON(s: string): any | null {
  try {
    return JSON.parse(s)
  } catch {
    return null
  }
}
function parseStudentKV(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
  const kv: Record<string, string> = {}
  for (const line of lines) {
    const m = line.match(/^([A-Za-z _-]+):\s*(.+)$/)
    if (m) kv[m[1].trim()] = m[2].trim()
  }
  return kv
}

function normalizeFigure(json: any) {
  const j = typeof json === 'object' && json ? json : {}
  const norm = {
    figure_number: j.figure_number ?? j.id ?? null,
    target: j.target ?? j.label ?? null,
    caption: j.caption ?? j.title ?? null,
    marks: j.marks ?? j.score ?? null,
    confidence: j.confidence ?? j.conf ?? null,
    notes: j.notes ?? j.comment ?? null,
  }
  const known = new Set(
    Object.keys(norm).filter((k) => norm[k as keyof typeof norm] !== null)
  )
  const extra: Record<string, any> = {}
  for (const [k, v] of Object.entries(j)) {
    if (!known.has(k)) extra[k] = v
  }
  return { norm, extra }
}

function FieldRow({ label, value }: { label: string; value: any }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className='flex gap-2 text-sm min-w-0'>
      <span className='text-slate-600 shrink-0'>{label}:</span>
      <span className='font-medium text-slate-900 break-words'>
        {String(value)}
      </span>
    </div>
  )
}

interface ResultCardsProps {
  data: CheckScriptsResponse
  onMarksUpdate?: (updatedMarks: Record<string, any>) => void
}

export default function ResultCards({ data, onMarksUpdate }: ResultCardsProps) {
  // UI state
  const [showAllMarks, setShowAllMarks] = useState(false)
  const [showAllFigures, setShowAllFigures] = useState(false)
  const [figureIdx, setFigureIdx] = useState<number | null>(null)
  const [answerPageIdx, setAnswerPageIdx] = useState<number | null>(null)
  const [showExtractedText, setShowExtractedText] = useState(false)

  // Editable marks state
  const [localMarks, setLocalMarks] = useState(data.marks || {})
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editingFeedback, setEditingFeedback] = useState<string | null>(null)
  const [feedbackValue, setFeedbackValue] = useState('')

  // Derived data
  const studentKV = useMemo(
    () => parseStudentKV(data.student_info || ''),
    [data.student_info]
  )
  const marksEntries = useMemo(
    () => Object.entries(localMarks || {}),
    [localMarks]
  )
  const figures = data.figures || []
  const answerPages = data.answer_pages || []
  const extractedText = data.extracted_text || ''

  const visibleMarks = showAllMarks ? marksEntries : marksEntries.slice(0, 5)
  const visibleFigures = showAllFigures ? figures : figures.slice(0, 6)

  const handleEditClick = (qid: string, currentScore: string) => {
    setEditingQuestion(qid)
    setEditValue(currentScore)
  }

  const handleSaveEdit = (qid: string) => {
    const numValue = parseFloat(editValue)
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      const updated = {
        ...localMarks,
        [qid]: {
          ...localMarks[qid],
          score: editValue,
        },
      }
      setLocalMarks(updated)
      if (onMarksUpdate) {
        onMarksUpdate(updated)
      }
    }
    setEditingQuestion(null)
  }

  const handleCancelEdit = () => {
    setEditingQuestion(null)
    setEditValue('')
  }

  const handleEditFeedbackClick = (qid: string, currentFeedback: string) => {
    setEditingFeedback(qid)
    setFeedbackValue(currentFeedback)
  }

  const handleSaveFeedback = (qid: string) => {
    const updated = {
      ...localMarks,
      [qid]: {
        ...localMarks[qid],
        feedback: feedbackValue,
      },
    }
    setLocalMarks(updated)
    if (onMarksUpdate) {
      onMarksUpdate(updated)
    }
    setEditingFeedback(null)
  }

  const handleCancelFeedback = () => {
    setEditingFeedback(null)
    setFeedbackValue('')
  }

  return (
    <div className='space-y-6'>
      {/* Student Info */}
      <section className='bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-shadow duration-300'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900'>
            <User className='w-5 h-5 text-blue-600 dark:text-blue-400' />
          </div>
          <h3 className='text-xl font-bold text-slate-900 dark:text-white'>
            Student Information
          </h3>
        </div>
        {Object.keys(studentKV).length ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            {Object.entries(studentKV).map(([k, v]) => (
              <div
                key={k}
                className='flex gap-2 min-w-0 bg-slate-50 dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700'
              >
                <span className='text-slate-600 dark:text-slate-400 shrink-0 font-medium'>
                  {k}:
                </span>
                <span className='font-semibold text-slate-900 dark:text-white break-words'>
                  {v}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <pre className='text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700 whitespace-pre-wrap'>
            {data.student_info || 'No student info extracted.'}
          </pre>
        )}
      </section>

      {/* Run Summary */}
      <section className='bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-shadow duration-300'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900'>
            <FileCheck className='w-5 h-5 text-green-600 dark:text-green-400' />
          </div>
          <h3 className='text-xl font-bold text-slate-900 dark:text-white'>
            Processing Summary
          </h3>
        </div>
        <div className='grid grid-cols-2 gap-4'>
          <div className='bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-900/50 rounded-xl border border-blue-200 dark:border-blue-800 p-5 hover:shadow-md transition-shadow'>
            <div className='text-sm font-medium text-blue-700 dark:text-blue-300 mb-1'>
              Pages OCR'd
            </div>
            <div className='text-3xl font-bold text-blue-900 dark:text-blue-100'>
              {data.pages_ocrd}
            </div>
          </div>
          <div className='bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-900/50 rounded-xl border border-green-200 dark:border-green-800 p-5 hover:shadow-md transition-shadow'>
            <div className='text-sm font-medium text-green-700 dark:text-green-300 mb-1'>
              Status
            </div>
            <div className='text-3xl font-bold text-green-900 dark:text-green-100 capitalize'>
              {data.status}
            </div>
          </div>
        </div>
      </section>

      {/* Answer Pages & Extracted Text */}
      {(answerPages.length > 0 || extractedText) && (
        <section className='bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-shadow duration-300'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900'>
              <FileText className='w-5 h-5 text-amber-600 dark:text-amber-400' />
            </div>
            <h3 className='text-xl font-bold text-slate-900 dark:text-white'>
              Answer Pages & Extracted Text
            </h3>
          </div>

          {answerPages.length > 0 && (
            <div className='mb-4'>
              <h4 className='text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3'>
                Answer Page Images ({answerPages.length})
              </h4>
              <div className='grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                {answerPages.map((pageB64, idx) => (
                  <button
                    key={idx}
                    onClick={() => setAnswerPageIdx(idx)}
                    className='group relative bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors'
                  >
                    <img
                      src={`data:image/jpeg;base64,${pageB64}`}
                      alt={`Answer page ${idx + 1}`}
                      className='w-full h-32 object-cover'
                    />
                    <div className='absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center'>
                      <Maximize2 className='w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity' />
                    </div>
                    <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2'>
                      <span className='text-xs font-semibold text-white'>
                        Page {idx + 1}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {extractedText && (
            <div>
              <div className='flex items-center justify-between mb-3'>
                <h4 className='text-sm font-semibold text-slate-700 dark:text-slate-300'>
                  Extracted Text
                </h4>
                <button
                  onClick={() => setShowExtractedText(!showExtractedText)}
                  className='text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium'
                >
                  {showExtractedText ? 'Hide' : 'Show'}
                </button>
              </div>
              {showExtractedText && (
                <pre className='text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700 whitespace-pre-wrap max-h-96 overflow-auto'>
                  {extractedText}
                </pre>
              )}
            </div>
          )}
        </section>
      )}

      {/* Assessment Results with Editing */}
      <section className='bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-shadow duration-300'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-3'>
            <div className='flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900'>
              <Award className='w-5 h-5 text-purple-600 dark:text-purple-400' />
            </div>
            <h3 className='text-xl font-bold text-slate-900 dark:text-white'>
              Assessment Results
            </h3>
          </div>
          {marksEntries.length > 3 && (
            <button
              className='flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors'
              onClick={() => setShowAllMarks((s) => !s)}
            >
              {showAllMarks ? (
                <>
                  <ChevronUp className='w-4 h-4' />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className='w-4 h-4' />
                  Show all ({marksEntries.length})
                </>
              )}
            </button>
          )}
        </div>

        {marksEntries.length ? (
          <div className='relative'>
            <div
              className={`overflow-x-auto ${
                showAllMarks ? '' : 'max-h-80'
              } overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700`}
            >
              <table className='min-w-full text-sm'>
                <thead className='bg-slate-50 dark:bg-slate-900'>
                  <tr className='[&>th]:text-left [&>th]:px-4 [&>th]:py-3 [&>th]:font-semibold [&>th]:text-slate-700 dark:[&>th]:text-slate-300'>
                    <th className='w-32'>Question</th>
                    <th className='w-32'>Score</th>
                    <th>Feedback</th>
                    <th className='w-56'>Sources</th>
                  </tr>
                </thead>
                <tbody className='bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700'>
                  {visibleMarks.map(([qid, v]) => (
                    <tr
                      key={qid}
                      className='hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors [&>td]:px-4 [&>td]:py-3 align-top'
                    >
                      <td className='font-semibold text-slate-900 dark:text-white'>
                        {qid}
                      </td>
                      <td>
                        {editingQuestion === qid ? (
                          <div className='flex items-center gap-2'>
                            <input
                              type='number'
                              min='0'
                              max='100'
                              step='0.1'
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className='w-20 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit(qid)
                                if (e.key === 'Escape') handleCancelEdit()
                              }}
                            />
                            <button
                              onClick={() => handleSaveEdit(qid)}
                              className='p-1 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded'
                            >
                              <Check className='w-4 h-4' />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className='p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded'
                            >
                              <X className='w-4 h-4' />
                            </button>
                          </div>
                        ) : (
                          <div className='flex items-center gap-2'>
                            <span className='inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-bold text-sm'>
                              {v.score}
                            </span>
                            <button
                              onClick={() => handleEditClick(qid, v.score)}
                              className='p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors'
                              title='Edit score'
                            >
                              <Edit3 className='w-4 h-4' />
                            </button>
                          </div>
                        )}
                      </td>
                      <td>
                        {editingFeedback === qid ? (
                          <div className='flex flex-col gap-2'>
                            <textarea
                              value={feedbackValue}
                              onChange={(e) => setFeedbackValue(e.target.value)}
                              className='w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-h-[80px] text-sm'
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') handleCancelFeedback()
                              }}
                            />
                            <div className='flex items-center gap-2'>
                              <button
                                onClick={() => handleSaveFeedback(qid)}
                                className='px-3 py-1 text-sm text-white bg-green-600 hover:bg-green-700 rounded flex items-center gap-1'
                              >
                                <Check className='w-4 h-4' />
                                Save
                              </button>
                              <button
                                onClick={handleCancelFeedback}
                                className='px-3 py-1 text-sm text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded flex items-center gap-1'
                              >
                                <X className='w-4 h-4' />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className='group relative'>
                            <div
                              className={`text-slate-700 dark:text-slate-300 ${
                                showAllMarks ? '' : 'max-h-16 overflow-hidden'
                              }`}
                            >
                              <div
                                className={`${
                                  showAllMarks ? '' : 'line-clamp-2'
                                }`}
                              >
                                {v.feedback}
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                handleEditFeedbackClick(qid, v.feedback)
                              }
                              className='absolute top-0 right-0 p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors opacity-0 group-hover:opacity-100'
                              title='Edit feedback'
                            >
                              <Edit3 className='w-4 h-4' />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className='text-slate-600 dark:text-slate-400 text-xs break-words'>
                        {v.sources || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!showAllMarks && marksEntries.length > 5 && (
              <>
                <div className='pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-slate-800 to-transparent rounded-b-lg' />
                <div className='mt-4 flex justify-center'>
                  <button
                    className='px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-indigo-700 transition-all'
                    onClick={() => setShowAllMarks(true)}
                  >
                    Show full results
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <p className='text-slate-500 dark:text-slate-400 text-center py-8'>
            No results returned.
          </p>
        )}
      </section>

      {/* Figures */}
      <section className='bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-shadow duration-300'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-3'>
            <div className='flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900'>
              <Image className='w-5 h-5 text-indigo-600 dark:text-indigo-400' />
            </div>
            <h3 className='text-xl font-bold text-slate-900 dark:text-white'>
              Figures & Diagrams
            </h3>
          </div>
          {figures.length > 3 && (
            <button
              className='flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors'
              onClick={() => setShowAllFigures((s) => !s)}
            >
              {showAllFigures ? (
                <>
                  <ChevronUp className='w-4 h-4' />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className='w-4 h-4' />
                  Show all ({figures.length})
                </>
              )}
            </button>
          )}
        </div>

        {figures.length ? (
          <>
            <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-5'>
              {visibleFigures.map((f, i) => {
                const parsed = tryParseJSON(f.assessment)
                const { norm, extra } = normalizeFigure(parsed)

                return (
                  <div
                    key={i}
                    className='group bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300'
                  >
                    <button
                      onClick={() => setFigureIdx(i)}
                      className='relative block w-full mb-3 rounded-lg overflow-hidden bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 group-hover:border-blue-400 dark:group-hover:border-blue-500 transition-colors'
                      title='Click to enlarge'
                    >
                      <img
                        src={`data:image/jpeg;base64,${f.image_b64}`}
                        alt={`Figure ${i + 1}`}
                        className='w-full h-40 object-contain'
                      />
                      <div className='absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center'>
                        <Maximize2 className='w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity' />
                      </div>
                    </button>

                    <div className='space-y-2'>
                      <div className='flex items-center justify-between'>
                        <span className='text-xs font-bold text-slate-900 dark:text-white bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded'>
                          Figure {norm.figure_number ?? i + 1}
                        </span>
                        {norm.marks != null && (
                          <span className='text-sm font-bold text-green-600 dark:text-green-400'>
                            {norm.marks} marks
                          </span>
                        )}
                      </div>
                      <FieldRow label='Target' value={norm.target} />
                      <FieldRow label='Caption' value={norm.caption} />
                      {norm.confidence != null && (
                        <div className='text-xs text-slate-500 dark:text-slate-400'>
                          Confidence:{' '}
                          {Math.round(Number(norm.confidence) * 100)}%
                        </div>
                      )}
                      <FieldRow label='Notes' value={norm.notes} />

                      {!showAllFigures && Object.keys(extra).length > 0 && (
                        <button
                          className='text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium mt-2'
                          onClick={() => setFigureIdx(i)}
                        >
                          View details →
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {!showAllFigures && figures.length > 6 && (
              <div className='mt-6 flex justify-center'>
                <button
                  className='px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-indigo-700 transition-all'
                  onClick={() => setShowAllFigures(true)}
                >
                  Show all figures
                </button>
              </div>
            )}

            {/* Modal for enlarged figure + full JSON */}
            <Modal
              open={figureIdx !== null}
              onClose={() => setFigureIdx(null)}
              title={figureIdx !== null ? `Figure ${figureIdx + 1}` : ''}
            >
              {figureIdx !== null && (
                <div className='space-y-4'>
                  <img
                    src={`data:image/jpeg;base64,${figures[figureIdx].image_b64}`}
                    alt={`Figure ${figureIdx + 1}`}
                    className='w-full max-h-[60vh] object-contain rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700'
                  />
                  <div className='bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700'>
                    <h4 className='font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2'>
                      <Award className='w-5 h-5 text-purple-600 dark:text-purple-400' />
                      Assessment Details
                    </h4>
                    {(() => {
                      const parsed = tryParseJSON(figures[figureIdx].assessment)
                      if (!parsed)
                        return (
                          <pre className='text-xs whitespace-pre-wrap bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'>
                            {figures[figureIdx].assessment}
                          </pre>
                        )

                      const { norm, extra } = normalizeFigure(parsed)
                      return (
                        <div className='space-y-3'>
                          <div className='grid sm:grid-cols-2 gap-3'>
                            <div className='bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700'>
                              <FieldRow
                                label='Figure'
                                value={norm.figure_number ?? figureIdx + 1}
                              />
                            </div>
                            <div className='bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700'>
                              <FieldRow label='Target' value={norm.target} />
                            </div>
                            <div className='bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700'>
                              <FieldRow label='Caption' value={norm.caption} />
                            </div>
                            <div className='bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700'>
                              <FieldRow label='Marks' value={norm.marks} />
                            </div>
                            <div className='bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700'>
                              <FieldRow
                                label='Confidence'
                                value={norm.confidence}
                              />
                            </div>
                            <div className='bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700'>
                              <FieldRow label='Notes' value={norm.notes} />
                            </div>
                          </div>
                          {Object.keys(extra).length > 0 && (
                            <details className='bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden'>
                              <summary className='cursor-pointer px-4 py-3 text-sm font-medium text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors'>
                                Additional Fields
                              </summary>
                              <pre className='text-xs whitespace-pre-wrap px-4 pb-4 pt-2 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900'>
                                {JSON.stringify(extra, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )}
            </Modal>
          </>
        ) : (
          <p className='text-slate-500 dark:text-slate-400 text-center py-8'>
            No figures found.
          </p>
        )}
      </section>

      {/* Answer Page Modal */}
      <Modal
        open={answerPageIdx !== null}
        onClose={() => setAnswerPageIdx(null)}
        title={answerPageIdx !== null ? `Answer Page ${answerPageIdx + 1}` : ''}
      >
        {answerPageIdx !== null && answerPages[answerPageIdx] && (
          <img
            src={`data:image/jpeg;base64,${answerPages[answerPageIdx]}`}
            alt={`Answer page ${answerPageIdx + 1}`}
            className='w-full max-h-[80vh] object-contain rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700'
          />
        )}
      </Modal>
    </div>
  )
}
