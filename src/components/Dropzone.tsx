'use client'
import { useCallback, useRef, useState } from 'react'
import { checkScripts } from '@/lib/api'
import type { CheckScriptsResponse } from '@/types'
import { UploadCloud, Loader2 } from 'lucide-react'

type Props = {
  rubric: string
  onResult: (r: CheckScriptsResponse) => void
}

export default function Dropzone({ rubric, onResult }: Props) {
  const [drag, setDrag] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const onDrop = useCallback(
    async (files: FileList | null) => {
      if (!files || !files[0]) return
      const file = files[0]
      if (!file.name.toLowerCase().endsWith('.zip')) {
        alert('Please upload a .zip file.')
        return
      }
      if (!rubric.trim()) {
        alert('Please enter the rubric answer text first.')
        return
      }
      setLoading(true)
      try {
        const res = await checkScripts(file, rubric)
        onResult(res)
      } catch (e: any) {
        alert(
          e?.response?.data?.detail ??
            e?.response?.data?.message ??
            'Upload failed.'
        )
      } finally {
        setLoading(false)
      }
    },
    [onResult, rubric]
  )

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
        <div className='flex items-center justify-center gap-2 py-6'>
          <Loader2 className='size-5 animate-spin' />
          <span>Processing…</span>
        </div>
      )}
    </div>
  )
}
