'use client'
import { useCallback, useRef, useState } from 'react'
import type { CheckScriptsResponse } from '@/types'
import { UploadCloud, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useBatchStore } from '@/lib/batchStore'

type Props = {
  rubric: string
  onResult: (r: CheckScriptsResponse) => void
}

type Progress = {
  phase?: 'meta' | 'answers' | 'figures' | 'start'
  processed?: number
  total?: number
  file?: string
}

export default function Dropzone({ rubric, onResult }: Props) {
  const [drag, setDrag] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<Progress>({})
  const [batch, setBatch] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const router = useRouter()

  const API_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'

  // store for batch mode
  const { reset, setRunning, setMeta, pushTick, setResult, setError } =
    useBatchStore()

  const onDrop = useCallback(
    async (files: FileList | null) => {
      if (!files || !files[0]) return
      const file = files[0]
      if (!file.name.toLowerCase().endsWith('.zip')) {
        alert('Please upload a .zip file.')
        return
      }
      if (!rubric.trim()) {
        alert('Please upload the rubric answer text file first.')
        return
      }

      if (batch) {
        // Batch flow: stream to store and redirect to /results
        reset()
        setRunning(true)
        setLoading(true)
        router.push('/results')
        try {
          await streamBatch({
            parentZip: file,
            rubricText: rubric,
            onMeta: (m) => setMeta(m),
            onProgress: (t) => pushTick(t),
            onResult: (payload) => setResult(payload),
            onError: (msg) => setError(msg),
          })
        } finally {
          setLoading(false)
        }
        return
      }

      // Single flow (existing)
      setLoading(true)
      setProgress({}) // reset
      try {
        await streamSingle({
          zipFile: file,
          rubricText: rubric,
          onProgress: (p) => setProgress(p),
          onResult: (payload) => onResult(payload as CheckScriptsResponse),
          onError: (msg) => alert(msg),
        })
      } finally {
        setLoading(false)
      }
    },
    [
      rubric,
      batch,
      onResult,
      reset,
      setRunning,
      setMeta,
      pushTick,
      setResult,
      setError,
      router,
    ]
  )

  // --- single-file streamer (unchanged) ---
  async function streamSingle({
    zipFile,
    rubricText,
    onProgress,
    onResult,
    onError,
  }: {
    zipFile: File
    rubricText: string
    onProgress: (p: Progress) => void
    onResult: (data: any) => void
    onError: (msg: string) => void
  }) {
    const form = new FormData()
    form.append('zipfile_in', zipFile, zipFile.name)
    form.append('rubric_answer', rubricText)

    const res = await fetch(`${API_URL}/api/v1/check-scripts-stream`, {
      method: 'POST',
      body: form,
      headers: { Accept: 'text/event-stream' },
    })
    if (!res.ok || !res.body) {
      onError(`Stream failed: ${res.status}`)
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const frames = buffer.split('\n\n')
      buffer = frames.pop() || ''
      for (const frame of frames) {
        const lines = frame.split('\n')
        const ev = (lines.find((l) => l.startsWith('event:')) || '')
          .slice(6)
          .trim()
        const dataLine = lines.find((l) => l.startsWith('data:'))
        if (!ev || !dataLine) continue
        try {
          const payload = JSON.parse(dataLine.slice(5))
          if (ev === 'progress') onProgress(payload as Progress)
          else if (ev === 'meta')
            onProgress({ phase: 'meta', ...(payload as Progress) })
          else if (ev === 'result') onResult(payload)
          else if (ev === 'error') onError(payload.error || 'Unknown error')
        } catch {}
      }
    }
  }

  // --- batch streamer (new) ---
  async function streamBatch({
    parentZip,
    rubricText,
    onMeta,
    onProgress,
    onResult,
    onError,
  }: {
    parentZip: File
    rubricText: string
    onMeta: (m: any) => void
    onProgress: (e: any) => void
    onResult: (data: any) => void
    onError: (msg: string) => void
  }) {
    const form = new FormData()
    form.append('parent_zip', parentZip, parentZip.name)
    form.append('rubric_answer', rubricText)

    const res = await fetch(`${API_URL}/api/v1/batch-check-scripts-stream`, {
      method: 'POST',
      body: form,
      headers: { Accept: 'text/event-stream' },
    })
    if (!res.ok || !res.body) {
      onError(`Stream failed: ${res.status}`)
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const frames = buffer.split('\n\n')
      buffer = frames.pop() || ''
      for (const frame of frames) {
        const lines = frame.split('\n')
        const ev = (lines.find((l) => l.startsWith('event:')) || '')
          .slice(6)
          .trim()
        const dataLine = lines.find((l) => l.startsWith('data:'))
        if (!ev || !dataLine) continue
        try {
          const payload = JSON.parse(dataLine.slice(5))
          if (ev === 'meta')
            onMeta(payload) // {phase:"start", students_total:n}
          else if (ev === 'progress') onProgress({ event: ev, ...payload })
          else if (ev === 'result')
            onResult(payload) // {status:"ok", students:{...}}
          else if (ev === 'error') onError(payload.error || 'Unknown error')
        } catch {}
      }
    }
  }

  const pct =
    progress.total && progress.processed
      ? Math.round((progress.processed / progress.total) * 100)
      : 0

  return (
    <div
      onDragEnter={() => setDrag(true)}
      onDragOver={(e) => {
        e.preventDefault()
        setDrag(true)
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDrag(false)
        onDrop(e.dataTransfer.files)
      }}
      className={`card relative p-6 text-center border-dashed ${
        drag ? 'ring-2 ring-light-primary/50 dark:ring-dark-primary/40' : ''
      }`}
    >
      {/* Batch toggle */}
      <div className='absolute top-3 left-3 flex items-center gap-2 text-sm'>
        <input
          id='batchToggle'
          type='checkbox'
          className='checkbox'
          checked={batch}
          onChange={(e) => setBatch(e.target.checked)}
        />
        <label htmlFor='batchToggle' className='cursor-pointer'>
          Batch assess
        </label>
      </div>

      <input
        ref={inputRef}
        type='file'
        accept='.zip'
        className='hidden'
        onChange={(e) => onDrop(e.target.files)}
      />

      {!loading ? (
        <>
          <UploadCloud className='mx-auto mb-3 size-10 opacity-80' />
          <p className='text-lg font-medium'>
            {batch
              ? 'Drop parent .zip containing student folders'
              : 'Drop your scanned script '}
            {!batch && (
              <span className='text-light-primary dark:text-dark-primary'>
                .zip
              </span>
            )}{' '}
            here
          </p>
          <p className='text-sm opacity-80'>or</p>
          <div className='mt-3'>
            <button
              className='btn-primary'
              onClick={() => inputRef.current?.click()}
            >
              Choose a file
            </button>
          </div>
          <p className='mt-2 text-xs opacity-70'>
            {batch ? (
              <>
                Sends <code>parent_zip</code> and your{' '}
                <code>rubric_answer</code>.
              </>
            ) : (
              <>
                Sends <code>zipfile_in</code> and your{' '}
                <code>rubric_answer</code>.
              </>
            )}
          </p>
        </>
      ) : // Only show inline progress for single mode; batch progress lives on /results
      !batch ? (
        <div className='py-6 space-y-3'>
          <div className='flex items-center justify-center gap-2'>
            <Loader2 className='size-5 animate-spin' />
            <span>
              {progress.phase === 'answers' && progress.total
                ? `OCR ${progress.processed}/${progress.total}${
                    progress.file ? ` (${progress.file})` : ''
                  }`
                : progress.phase === 'figures' && progress.total
                ? `Processing figures ${progress.processed}/${progress.total}`
                : 'Preparing…'}
            </span>
          </div>
          <div className='mx-auto max-w-md w-full h-2 rounded bg-slate-200 dark:bg-slate-600 overflow-hidden'>
            <div
              className='h-2 bg-indigo-500 dark:bg-indigo-400 transition-all'
              style={{ width: `${pct}%` }}
            />
          </div>
          {progress.file ? (
            <p className='text-xs opacity-70 truncate max-w-md mx-auto'>
              {progress.file}
            </p>
          ) : null}
        </div>
      ) : (
        <div className='py-6 space-y-3'>
          <div className='flex items-center justify-center gap-2'>
            <Loader2 className='size-5 animate-spin' />
            <span>Starting batch… redirecting to results</span>
          </div>
        </div>
      )}
    </div>
  )
}
