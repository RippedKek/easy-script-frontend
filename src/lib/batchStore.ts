'use client'
import { create } from 'zustand'
import type { CheckScriptsResponse } from '@/types'

type BatchState = {
  isRunning: boolean
  meta?: { students_total?: number }
  // last tick
  tick?: { event: string; [k: string]: any }
  // full list of ticks if you want a log
  ticks: Array<{ event: string; [k: string]: any }>
  // final combined results: { status:'ok', students: { [student_id]: CheckScriptsResponse | {status:'error', detail:string} } }
  result?: { status: string; students: Record<string, any> }
  error?: string
  reset: () => void
  setRunning: (v: boolean) => void
  setMeta: (m: BatchState['meta']) => void
  pushTick: (t: BatchState['tick']) => void
  setResult: (r: BatchState['result']) => void
  setError: (e: string) => void
}

export const useBatchStore = create<BatchState>((set) => ({
  isRunning: false,
  ticks: [],
  reset: () =>
    set({
      isRunning: false,
      meta: undefined,
      tick: undefined,
      ticks: [],
      result: undefined,
      error: undefined,
    }),
  setRunning: (v) => set({ isRunning: v }),
  setMeta: (m) => set({ meta: m }),
  pushTick: (t) => set((s) => ({ tick: t, ticks: [...s.ticks, t!] })),
  setResult: (r) => set({ result: r, isRunning: false }),
  setError: (e) => set({ error: e, isRunning: false }),
}))
