'use client'
import { useMemo, useState } from 'react'
import type { CheckScriptsResponse } from '@/types'
import Modal from '@/components/Modal'

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
      <span className='opacity-70 shrink-0'>{label}:</span>
      <span className='font-medium break-words'>{String(value)}</span>
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
      {/* full-width sections stacked */}
      {/* Student Info */}
      <section className='card p-5'>
        <h3 className='text-lg font-semibold mb-3'>Student Info</h3>
        {Object.keys(studentKV).length ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm'>
            {Object.entries(studentKV).map(([k, v]) => (
              <div key={k} className='flex gap-2 min-w-0'>
                <span className='opacity-70 shrink-0'>{k}:</span>
                <span className='font-medium break-words'>{v}</span>
              </div>
            ))}
          </div>
        ) : (
          <pre className='text-sm opacity-80 whitespace-pre-wrap'>
            {data.student_info || 'No student info extracted.'}
          </pre>
        )}
      </section>

      {/* Run Summary */}
      <section className='card p-5'>
        <h3 className='text-lg font-semibold mb-3'>Run Summary</h3>
        <div className='grid grid-cols-2 gap-4 text-sm'>
          <div className='rounded-xl border p-4 border-light-subtle/60 dark:border-dark-subtle/60'>
            <div className='opacity-70'>Pages OCR’d</div>
            <div className='text-2xl font-semibold'>{data.pages_ocrd}</div>
          </div>
          <div className='rounded-xl border p-4 border-light-subtle/60 dark:border-dark-subtle/60'>
            <div className='opacity-70'>Status</div>
            <div className='text-2xl font-semibold'>{data.status}</div>
          </div>
        </div>
      </section>

      {/* Assessment Results — full width, compact by default */}
      <section className='card p-5'>
        <div className='flex items-center justify-between mb-3'>
          <h3 className='text-lg font-semibold'>Assessment Results</h3>
          {marksEntries.length > 5 && (
            <button
              className='btn-ghost text-sm'
              onClick={() => setShowAllMarks((s) => !s)}
            >
              {showAllMarks ? 'Show less' : `Show all (${marksEntries.length})`}
            </button>
          )}
        </div>

        {marksEntries.length ? (
          <div
            className={`relative overflow-x-auto ${
              showAllMarks ? '' : 'max-h-64 overflow-hidden'
            }`}
          >
            {!showAllMarks && (
              <div className='pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-light-card to-transparent dark:from-dark-card' />
            )}
            <table className='min-w-full text-sm'>
              <thead>
                <tr className='[&>th]:text-left [&>th]:py-2 border-b border-light-subtle/60 dark:border-dark-subtle/60'>
                  <th className='w-28'>Question</th>
                  <th className='w-20'>Score</th>
                  <th>Feedback</th>
                  <th className='w-56'>Sources</th>
                </tr>
              </thead>
              <tbody>
                {visibleMarks.map(([qid, v]) => (
                  <tr
                    key={qid}
                    className='[&>td]:py-2 border-b border-light-subtle/40 dark:border-dark-subtle/40 align-top'
                  >
                    <td className='font-semibold'>{qid}</td>
                    <td>{v.score}</td>
                    <td>
                      <div
                        className={`${
                          showAllMarks ? '' : 'max-h-14 overflow-hidden'
                        } pr-2`}
                      >
                        <div
                          className={`${showAllMarks ? '' : 'line-clamp-2'}`}
                        >
                          {v.feedback}
                        </div>
                      </div>
                    </td>
                    <td className='opacity-80 break-words'>
                      {v.sources || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!showAllMarks && marksEntries.length > 5 && (
              <div className='mt-3 flex justify-center'>
                <button
                  className='btn-primary'
                  onClick={() => setShowAllMarks(true)}
                >
                  Show full results
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className='opacity-70'>No results returned.</p>
        )}
      </section>

      {/* Figures — full width, thumbnails + parsed details, modal to enlarge */}
      <section className='card p-5'>
        <div className='flex items-center justify-between mb-3'>
          <h3 className='text-lg font-semibold'>Figures</h3>
          {figures.length > 6 && (
            <button
              className='btn-ghost text-sm'
              onClick={() => setShowAllFigures((s) => !s)}
            >
              {showAllFigures ? 'Show less' : `Show all (${figures.length})`}
            </button>
          )}
        </div>

        {figures.length ? (
          <>
            <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              {visibleFigures.map((f, i) => {
                const parsed = tryParseJSON(f.assessment)
                const { norm, extra } = normalizeFigure(parsed)

                return (
                  <div
                    key={i}
                    className='rounded-xl border p-3 border-light-subtle/60 dark:border-dark-subtle/60'
                  >
                    <button
                      onClick={() => setFigureIdx(i)}
                      className='block w-full'
                      title='Click to enlarge'
                    >
                      <img
                        src={`data:image/jpeg;base64,${f.image_b64}`}
                        alt={`Figure ${i + 1}`}
                        className='w-full h-40 object-contain rounded-lg bg-black/5 dark:bg-white/5'
                      />
                    </button>

                    {/* Parsed, elegant summary */}
                    <div className='mt-3 space-y-1'>
                      <FieldRow
                        label='Figure'
                        value={norm.figure_number ?? i + 1}
                      />
                      <FieldRow label='Target' value={norm.target} />
                      <FieldRow label='Caption' value={norm.caption} />
                      <div className='flex items-center gap-2 text-sm'>
                        <FieldRow label='Marks' value={norm.marks} />
                        {norm.confidence != null && (
                          <span className='text-xs opacity-70'>
                            (conf{' '}
                            {Math.round(Number(norm.confidence) * 100) / 100})
                          </span>
                        )}
                      </div>
                      <FieldRow label='Notes' value={norm.notes} />

                      {/* If collapsed, keep it brief */}
                      {!showAllFigures && Object.keys(extra).length > 0 && (
                        <button
                          className='btn-ghost text-xs'
                          onClick={() => setFigureIdx(i)}
                        >
                          View details
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {!showAllFigures && figures.length > 6 && (
              <div className='mt-4 flex justify-center'>
                <button
                  className='btn-primary'
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
                    className='w-full max-h-[60vh] object-contain rounded-xl bg-black/5 dark:bg-white/5'
                  />
                  <div>
                    <h4 className='font-semibold mb-2'>Assessment details</h4>
                    {(() => {
                      const parsed = tryParseJSON(figures[figureIdx].assessment)
                      if (!parsed)
                        return (
                          <pre className='text-xs whitespace-pre-wrap bg-black/5 dark:bg-white/5 p-3 rounded-lg'>
                            {figures[figureIdx].assessment}
                          </pre>
                        )

                      const { norm, extra } = normalizeFigure(parsed)
                      return (
                        <div className='space-y-2'>
                          <div className='grid sm:grid-cols-2 gap-2'>
                            <FieldRow
                              label='Figure'
                              value={norm.figure_number ?? figureIdx + 1}
                            />
                            <FieldRow label='Target' value={norm.target} />
                            <FieldRow label='Caption' value={norm.caption} />
                            <FieldRow label='Marks' value={norm.marks} />
                            <FieldRow
                              label='Confidence'
                              value={norm.confidence}
                            />
                            <FieldRow label='Notes' value={norm.notes} />
                          </div>
                          {Object.keys(extra).length > 0 && (
                            <details className='rounded-lg border border-light-subtle/60 dark:border-dark-subtle/60'>
                              <summary className='cursor-pointer px-3 py-2 text-sm'>
                                Other fields
                              </summary>
                              <pre className='text-xs whitespace-pre-wrap px-3 pb-3 opacity-90'>
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
          <p className='opacity-70'>No figures found.</p>
        )}
      </section>
    </div>
  )
}
