'use client'

import Header from '@/components/Header'
import Dropzone from '@/components/Dropzone'
import ResultCards from '@/components/ResultCards'
import type { CheckScriptsResponse } from '@/types'
import { useState, useCallback, useEffect } from 'react'
import { FileText, Upload, CheckCircle, BookOpen, Loader2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'

export default function HomePage() {
  const [data, setData] = useState<CheckScriptsResponse | null>(null)
  const [rubric, setRubric] = useState('')
  const [rubricFile, setRubricFile] = useState<File | null>(null)
  const [referenceBook, setReferenceBook] = useState<File | null>(null)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [pdfName, setPdfName] = useState('')
  const [progress, setProgress] = useState<{
    phase?: string
    processed?: number
    total?: number
    file?: string
  }>({})
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    const fetchPdfName = async () => {
      try {
        const response = await fetch(`${API_URL}/api/v1/pdf-info`)
        if (response.ok) {
          const data = await response.json()
          setPdfName(data.book || '')
        } else {
          setPdfName('')
        }
      } catch (error) {
        console.error('Error fetching PDF name:', error)
        setPdfName('')
      }
    }
    fetchPdfName()
  }, [uploadingPdf])

  const handleRubricFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        setRubricFile(file)
        const reader = new FileReader()
        reader.onload = (e) => {
          setRubric(e.target?.result as string)
        }
        reader.readAsText(file)
      } else {
        setRubricFile(null)
        setRubric('')
      }
    },
    []
  )

  const handleReferenceBookChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        // Validate file type
        if (!file.name.toLowerCase().endsWith('.pdf')) {
          alert('Please upload a PDF file')
          event.target.value = ''
          return
        }

        setReferenceBook(file)
        setUploadingPdf(true)

        try {
          const formData = new FormData()
          formData.append('pdf', file, file.name)

          const response = await fetch(`${API_URL}/api/v1/upload-pdf`, {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(
              errorData.detail || `Upload failed with status ${response.status}`
            )
          }

          const result = await response.json()
          console.log('PDF uploaded successfully:', result)
          setPdfName(result.book || file.name.split('.')[0])
          alert(`Successfully uploaded: ${result.book || file.name}`)
        } catch (error) {
          console.error('Error uploading PDF:', error)
          alert(
            `Failed to upload PDF: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          )
          setReferenceBook(null)
          event.target.value = ''
        } finally {
          setUploadingPdf(false)
        }
      } else {
        setReferenceBook(null)
      }
    },
    []
  )

  return (
    <main className='min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950'>
      <Header />
      <section className='mx-auto max-w-7xl w-full px-4 py-12 md:py-16'>
        <div className='text-center mb-12'>
          <div className='inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg mb-6'>
            <FileText className='w-8 h-8 text-white' />
          </div>
          <h1 className='text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 dark:from-slate-100 dark:via-blue-100 dark:to-indigo-100 bg-clip-text text-transparent mb-4'>
            Assess Scripts in Seconds
          </h1>
          <p className='text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto'>
            Upload scanned pages and provide your rubric answer for instant,
            intelligent assessment
          </p>
        </div>

        <div className='grid md:grid-cols-2 gap-8 mb-8 md:items-start'>
          <div className='flex flex-col gap-6 h-full'>
            {/* Rubric Answer Card */}
            <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-shadow duration-300'>
              <div className='flex items-center gap-3 mb-4'>
                <div className='flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50'>
                  <FileText className='w-5 h-5 text-blue-600 dark:text-blue-400' />
                </div>
                <div>
                  <label className='block text-base font-semibold text-slate-900 dark:text-white'>
                    Rubric Answer
                  </label>
                  <p className='text-xs text-slate-500 dark:text-slate-400'>
                    Required .txt file
                  </p>
                </div>
              </div>

              <div className='relative'>
                <input
                  type='file'
                  accept='.txt'
                  className='file-input file-input-bordered w-full bg-slate-50 dark:bg-slate-700 border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors duration-200'
                  onChange={handleRubricFileChange}
                />
                {rubricFile && (
                  <div className='mt-3 flex items-center gap-2 text-sm text-green-600 dark:text-green-400'>
                    <CheckCircle className='w-4 h-4' />
                    <span className='font-medium'>{rubricFile.name}</span>
                  </div>
                )}
              </div>

              <div className='mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-100 dark:border-blue-800'>
                <p className='text-xs text-blue-800 dark:text-blue-300'>
                  This file will be sent as{' '}
                  <code className='px-1.5 py-0.5 bg-blue-200 dark:bg-blue-800 rounded text-blue-900 dark:text-blue-200 font-mono'>
                    rubric_answer
                  </code>{' '}
                  to the backend
                </p>
              </div>
            </div>

            {/* Reference Book Card */}
            <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-shadow duration-300'>
              <div className='flex items-center gap-3 mb-4'>
                <div className='flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/50'>
                  <BookOpen className='w-5 h-5 text-purple-600 dark:text-purple-400' />
                </div>
                <div className='flex-1'>
                  <label className='block text-base font-semibold text-slate-900 dark:text-white'>
                    Reference Book
                  </label>
                  <p className='text-xs text-slate-500 dark:text-slate-400'>
                    {pdfName ? (
                      <>
                        Currently loaded:{' '}
                        <span className='font-semibold text-purple-600 dark:text-purple-400'>
                          {pdfName}
                        </span>
                      </>
                    ) : (
                      'Optional .pdf file'
                    )}
                  </p>
                </div>
              </div>

              <div className='relative'>
                <input
                  type='file'
                  accept='.pdf,application/pdf'
                  className='file-input file-input-bordered w-full bg-slate-50 dark:bg-slate-700 border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-purple-400 dark:hover:border-purple-500 transition-colors duration-200'
                  onChange={handleReferenceBookChange}
                  disabled={uploadingPdf}
                />
                {uploadingPdf && (
                  <div className='mt-3 flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400'>
                    <Loader2 className='w-4 h-4 animate-spin' />
                    <span className='font-medium'>
                      Uploading and indexing...
                    </span>
                  </div>
                )}
                {referenceBook && !uploadingPdf && (
                  <div className='mt-3 flex items-center gap-2 text-sm text-green-600 dark:text-green-400'>
                    <CheckCircle className='w-4 h-4' />
                    <span className='font-medium'>
                      Uploaded: {referenceBook.name}
                    </span>
                  </div>
                )}
              </div>

              <div className='mt-4 p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg border border-purple-100 dark:border-purple-800'>
                <p className='text-xs text-purple-800 dark:text-purple-300'>
                  Upload a reference textbook for context-aware assessment
                </p>
              </div>
            </div>

            {/* Dropzone */}
            <div className='flex-1'>
              <Dropzone rubric={rubric} onResult={setData} />
            </div>
          </div>

          {/* Instructions Panel */}
          <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full'>
            <div className='flex items-center gap-3 mb-6'>
              <div className='flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50'>
                <Upload className='w-5 h-5 text-indigo-600 dark:text-indigo-400' />
              </div>
              <h2 className='text-xl font-bold text-slate-900 dark:text-white'>
                Quick Guide
              </h2>
            </div>

            <div className='overflow-y-auto max-h-[500px] pr-2 space-y-5'>
              <div className='group'>
                <div className='flex items-start gap-3'>
                  <div className='flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-md'>
                    1
                  </div>
                  <div>
                    <h3 className='font-semibold text-slate-900 dark:text-white mb-2'>
                      Upload Rubric Answer
                    </h3>
                    <p className='text-sm text-slate-600 dark:text-slate-400 leading-relaxed'>
                      Click the file input above to upload a{' '}
                      <code className='px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-800 dark:text-slate-300 font-mono text-xs'>
                        .txt
                      </code>{' '}
                      file containing the rubric answer. This text will be
                      extracted and sent to the backend for assessment.
                    </p>
                  </div>
                </div>
              </div>

              <div className='h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent'></div>

              <div className='group'>
                <div className='flex items-start gap-3'>
                  <div className='flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-md'>
                    2
                  </div>
                  <div>
                    <h3 className='font-semibold text-slate-900 dark:text-white mb-2'>
                      Upload Reference Book (Optional)
                    </h3>
                    <p className='text-sm text-slate-600 dark:text-slate-400 leading-relaxed'>
                      Upload a{' '}
                      <code className='px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-800 dark:text-slate-300 font-mono text-xs'>
                        .pdf
                      </code>{' '}
                      reference textbook to provide additional context for more
                      accurate assessment.
                    </p>
                  </div>
                </div>
              </div>

              <div className='h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent'></div>

              <div className='group'>
                <div className='flex items-start gap-3'>
                  <div className='flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md'>
                    3
                  </div>
                  <div>
                    <h3 className='font-semibold text-slate-900 dark:text-white mb-2'>
                      Upload Scanned Pages
                    </h3>
                    <p className='text-sm text-slate-600 dark:text-slate-400 leading-relaxed'>
                      Drag and drop or click to upload a{' '}
                      <code className='px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-800 dark:text-slate-300 font-mono text-xs'>
                        .zip
                      </code>{' '}
                      file containing scanned pages of student scripts. Ensure
                      the file contains only image files like JPG or PNG. The
                      zip must contain an image named "title" for title page.
                      Figure pages must be named starting with "figure".
                    </p>
                  </div>
                </div>
              </div>

              <div className='h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent'></div>

              <div className='group'>
                <div className='flex items-start gap-3'>
                  <div className='flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-sm font-bold shadow-md'>
                    4
                  </div>
                  <div>
                    <h3 className='font-semibold text-slate-900 dark:text-white mb-2'>
                      Review Results
                    </h3>
                    <p className='text-sm text-slate-600 dark:text-slate-400 leading-relaxed'>
                      Once all files are uploaded, the system will process them
                      automatically. Assessment results will appear below with
                      detailed feedback.
                    </p>
                  </div>
                </div>
              </div>

              <div className='mt-6 p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800'>
                <h4 className='font-semibold text-amber-900 dark:text-amber-300 mb-3 flex items-center gap-2'>
                  <span className='text-lg'>💡</span> Important Tips
                </h4>
                <ul className='space-y-2 text-sm text-amber-800 dark:text-amber-300'>
                  <li className='flex items-start gap-2'>
                    <span className='text-amber-500 dark:text-amber-400 mt-0.5'>
                      •
                    </span>
                    <span>
                      Ensure your rubric answer is clear and well-formatted
                      within the text file. Each answers must start and end with
                      delimiters. Starting delimiter is "Answer to the question
                      no-X" and ending delimiter is "End of answer-X"
                    </span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-amber-500 dark:text-amber-400 mt-0.5'>
                      •
                    </span>
                    <span>
                      Reference books help provide better context for complex
                      assessments
                    </span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-amber-500 dark:text-amber-400 mt-0.5'>
                      •
                    </span>
                    <span>
                      Verify that scanned pages are legible and correctly
                      oriented for accurate assessment
                    </span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-amber-500 dark:text-amber-400 mt-0.5'>
                      •
                    </span>
                    <span>High-quality scans produce better results</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {data && (
          <div className='animate-in fade-in slide-in-from-bottom-4 duration-500'>
            <ResultCards data={data} />
          </div>
        )}
      </section>
    </main>
  )
}
