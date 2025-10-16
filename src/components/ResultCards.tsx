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

// normalize common figure fields if present; keep unknown fields in "extra"
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

export default function ResultCards({ data }: { data: CheckScriptsResponse }) {
  // UI state
  const [showAllMarks, setShowAllMarks] = useState(false)
  const [showAllFigures, setShowAllFigures] = useState(false)
  const [figureIdx, setFigureIdx] = useState<number | null>(null)

  // Derived data
  const studentKV = useMemo(
    () => parseStudentKV(data.student_info || ''),
    [data.student_info]
  )
  const marksEntries = useMemo(
    () => Object.entries(data.marks || {}),
    [data.marks]
  )
  const figures = data.figures || []

  const visibleMarks = showAllMarks ? marksEntries : marksEntries.slice(0, 5)
  const visibleFigures = showAllFigures ? figures : figures.slice(0, 6)

  return (
    <div className='space-y-6'>
      {/* Student Info */}
      <section className='bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow duration-300'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100'>
            <User className='w-5 h-5 text-blue-600' />
          </div>
          <h3 className='text-xl font-bold text-slate-900'>
            Student Information
          </h3>
        </div>
        {Object.keys(studentKV).length ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            {Object.entries(studentKV).map(([k, v]) => (
              <div
                key={k}
                className='flex gap-2 min-w-0 bg-slate-50 rounded-lg p-3 border border-slate-200'
              >
                <span className='text-slate-600 shrink-0 font-medium'>
                  {k}:
                </span>
                <span className='font-semibold text-slate-900 break-words'>
                  {v}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <pre className='text-sm text-slate-700 bg-slate-50 rounded-lg p-4 border border-slate-200 whitespace-pre-wrap'>
            {data.student_info || 'No student info extracted.'}
          </pre>
        )}
      </section>

      {/* Run Summary */}
      <section className='bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow duration-300'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='flex items-center justify-center w-10 h-10 rounded-lg bg-green-100'>
            <FileCheck className='w-5 h-5 text-green-600' />
          </div>
          <h3 className='text-xl font-bold text-slate-900'>
            Processing Summary
          </h3>
        </div>
        <div className='grid grid-cols-2 gap-4'>
          <div className='bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-5 hover:shadow-md transition-shadow'>
            <div className='text-sm font-medium text-blue-700 mb-1'>
              Pages OCR'd
            </div>
            <div className='text-3xl font-bold text-blue-900'>
              {data.pages_ocrd}
            </div>
          </div>
          <div className='bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-5 hover:shadow-md transition-shadow'>
            <div className='text-sm font-medium text-green-700 mb-1'>
              Status
            </div>
            <div className='text-3xl font-bold text-green-900 capitalize'>
              {data.status}
            </div>
          </div>
        </div>
      </section>

      {/* Assessment Results */}
      <section className='bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow duration-300'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-3'>
            <div className='flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100'>
              <Award className='w-5 h-5 text-purple-600' />
            </div>
            <h3 className='text-xl font-bold text-slate-900'>
              Assessment Results
            </h3>
          </div>
          {marksEntries.length > 5 && (
            <button
              className='flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
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
              } overflow-hidden rounded-lg border border-slate-200`}
            >
              <table className='min-w-full text-sm'>
                <thead className='bg-slate-50'>
                  <tr className='[&>th]:text-left [&>th]:px-4 [&>th]:py-3 [&>th]:font-semibold [&>th]:text-slate-700'>
                    <th className='w-32'>Question</th>
                    <th className='w-20'>Score</th>
                    <th>Feedback</th>
                    <th className='w-56'>Sources</th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-slate-200'>
                  {visibleMarks.map(([qid, v]) => (
                    <tr
                      key={qid}
                      className='hover:bg-slate-50 transition-colors [&>td]:px-4 [&>td]:py-3 align-top'
                    >
                      <td className='font-semibold text-slate-900'>{qid}</td>
                      <td>
                        <span className='inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-sm'>
                          {v.score}
                        </span>
                      </td>
                      <td>
                        <div
                          className={`text-slate-700 ${
                            showAllMarks ? '' : 'max-h-16 overflow-hidden'
                          }`}
                        >
                          <div
                            className={`${showAllMarks ? '' : 'line-clamp-2'}`}
                          >
                            {v.feedback}
                          </div>
                        </div>
                      </td>
                      <td className='text-slate-600 text-xs break-words'>
                        {v.sources || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!showAllMarks && marksEntries.length > 5 && (
              <>
                <div className='pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent rounded-b-lg' />
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
          <p className='text-slate-500 text-center py-8'>
            No results returned.
          </p>
        )}
      </section>

      {/* Figures */}
      <section className='bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow duration-300'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-3'>
            <div className='flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-100'>
              <Image className='w-5 h-5 text-indigo-600' />
            </div>
            <h3 className='text-xl font-bold text-slate-900'>
              Figures & Diagrams
            </h3>
          </div>
          {figures.length > 6 && (
            <button
              className='flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
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
                    className='group bg-slate-50 rounded-xl border border-slate-200 p-4 hover:shadow-lg hover:border-blue-300 transition-all duration-300'
                  >
                    <button
                      onClick={() => setFigureIdx(i)}
                      className='relative block w-full mb-3 rounded-lg overflow-hidden bg-white border-2 border-slate-200 group-hover:border-blue-400 transition-colors'
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
                        <span className='text-xs font-bold text-slate-900 bg-blue-100 px-2 py-1 rounded'>
                          Figure {norm.figure_number ?? i + 1}
                        </span>
                        {norm.marks != null && (
                          <span className='text-sm font-bold text-green-600'>
                            {norm.marks} marks
                          </span>
                        )}
                      </div>
                      <FieldRow label='Target' value={norm.target} />
                      <FieldRow label='Caption' value={norm.caption} />
                      {norm.confidence != null && (
                        <div className='text-xs text-slate-500'>
                          Confidence:{' '}
                          {Math.round(Number(norm.confidence) * 100)}%
                        </div>
                      )}
                      <FieldRow label='Notes' value={norm.notes} />

                      {!showAllFigures && Object.keys(extra).length > 0 && (
                        <button
                          className='text-xs text-blue-600 hover:text-blue-700 font-medium mt-2'
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
                    className='w-full max-h-[60vh] object-contain rounded-xl bg-slate-100 border border-slate-200'
                  />
                  <div className='bg-slate-50 rounded-xl p-4 border border-slate-200'>
                    <h4 className='font-bold text-slate-900 mb-3 flex items-center gap-2'>
                      <Award className='w-5 h-5 text-purple-600' />
                      Assessment Details
                    </h4>
                    {(() => {
                      const parsed = tryParseJSON(figures[figureIdx].assessment)
                      if (!parsed)
                        return (
                          <pre className='text-xs whitespace-pre-wrap bg-white p-4 rounded-lg border border-slate-200 text-slate-700'>
                            {figures[figureIdx].assessment}
                          </pre>
                        )

                      const { norm, extra } = normalizeFigure(parsed)
                      return (
                        <div className='space-y-3'>
                          <div className='grid sm:grid-cols-2 gap-3'>
                            <div className='bg-white rounded-lg p-3 border border-slate-200'>
                              <FieldRow
                                label='Figure'
                                value={norm.figure_number ?? figureIdx + 1}
                              />
                            </div>
                            <div className='bg-white rounded-lg p-3 border border-slate-200'>
                              <FieldRow label='Target' value={norm.target} />
                            </div>
                            <div className='bg-white rounded-lg p-3 border border-slate-200'>
                              <FieldRow label='Caption' value={norm.caption} />
                            </div>
                            <div className='bg-white rounded-lg p-3 border border-slate-200'>
                              <FieldRow label='Marks' value={norm.marks} />
                            </div>
                            <div className='bg-white rounded-lg p-3 border border-slate-200'>
                              <FieldRow
                                label='Confidence'
                                value={norm.confidence}
                              />
                            </div>
                            <div className='bg-white rounded-lg p-3 border border-slate-200'>
                              <FieldRow label='Notes' value={norm.notes} />
                            </div>
                          </div>
                          {Object.keys(extra).length > 0 && (
                            <details className='bg-white rounded-lg border border-slate-200 overflow-hidden'>
                              <summary className='cursor-pointer px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-50 transition-colors'>
                                Additional Fields
                              </summary>
                              <pre className='text-xs whitespace-pre-wrap px-4 pb-4 pt-2 text-slate-700 bg-slate-50'>
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
          <p className='text-slate-500 text-center py-8'>No figures found.</p>
        )}
      </section>
    </div>
  )
}
