'use client'

import Header from '@/components/Header'
import Dropzone from '@/components/Dropzone'
import ResultCards from '@/components/ResultCards'
import type { CheckScriptsResponse } from '@/types'
import { useState } from 'react'

export default function HomePage() {
  const [data, setData] = useState<CheckScriptsResponse | null>(null)
  const [rubric, setRubric] = useState('')

  return (
    <main className='min-h-screen flex flex-col'>
      <Header />
      <section className='mx-auto max-w-6xl w-full px-4 py-8 md:py-12'>
        <div className='text-center'>
          <h1 className='text-3xl md:text-4xl font-bold tracking-tight'>
            Assess scripts in seconds
          </h1>
          <p className='mt-2 opacity-80'>
            Upload a zipped set of scanned pages and provide the rubric answer
            text.
          </p>
        </div>

        <div className='card p-4 mt-6'>
          <label className='block text-sm font-medium mb-2'>
            Rubric Answer (required)
          </label>
          <textarea
            className='input min-h-28'
            placeholder='Enter rubric text with delimiters if applicable.'
            value={rubric}
            onChange={(e) => setRubric(e.target.value)}
          />
          <p className='text-xs opacity-70 mt-2'>
            Sent as <code>rubric_answer</code> to the backend.
          </p>
        </div>

        <div className='mt-6'>
          <Dropzone rubric={rubric} onResult={setData} />
        </div>

        {data && (
          <div className='mt-8'>
            <ResultCards data={data} />
          </div>
        )}
      </section>
    </main>
  )
}
