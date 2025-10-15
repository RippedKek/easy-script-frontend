'use client'
import { X } from 'lucide-react'
import { useEffect } from 'react'

type ModalProps = {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center'>
      <div className='absolute inset-0 bg-black/60' onClick={onClose} />
      <div className='relative z-[101] max-w-4xl w-[92vw] max-h-[88vh] overflow-auto rounded-2xl bg-light-card dark:bg-dark-card p-4 md:p-6 shadow-soft border border-light-subtle/60 dark:border-dark-subtle/60'>
        <div className='flex items-center justify-between mb-3'>
          <h3 className='text-lg font-semibold'>{title}</h3>
          <button
            onClick={onClose}
            className='btn-ghost rounded-full p-2'
            aria-label='Close'
          >
            <X className='size-5' />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
