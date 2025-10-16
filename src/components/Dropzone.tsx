'use client'
import { useCallback, useRef, useState } from 'react'
import type { CheckScriptsResponse } from '@/types'
import { UploadCloud, Loader2 } from 'lucide-react'

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
  const inputRef = useRef<HTMLInputElement | null>(null)

  const API_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'

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

      setLoading(true)
      setProgress({}) // reset

      try {
        await streamCheckScripts({
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
    [rubric, onResult]
  )

  async function streamCheckScripts({
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

      // SSE frames are separated by a blank line
      const frames = buffer.split('\n\n')
      buffer = frames.pop() || ''

      for (const frame of frames) {
        // Each frame looks like:
        // event: progress
        // data: {...}
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
          // you can also handle 'end' if the backend emits it
        } catch {
          // ignore malformed partial chunks
        }
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
            Drop your scanned script{' '}
            <span className='text-light-primary dark:text-dark-primary'>
              .zip
            </span>{' '}
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
            Sends <code>zipfile_in</code> and your <code>rubric_answer</code>.
          </p>
        </>
      ) : (
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
      )}
    </div>
  )
}
