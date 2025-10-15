export type AssessmentMark = {
  score: number
  feedback: string
  sources?: string
}

export type FigureResult = {
  image_b64: string // base64-encoded image (no data: prefix)
  assessment: string // JSON string or error text
}

export type CheckScriptsResponse = {
  status: 'ok'
  pages_ocrd: number
  student_info: string // raw text from title page
  marks: Record<string, AssessmentMark>
  figures: FigureResult[]
}
