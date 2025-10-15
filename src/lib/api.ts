import axios from 'axios'
import type { CheckScriptsResponse } from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'

export async function checkScripts(
  zip: File,
  rubricAnswer: string
): Promise<CheckScriptsResponse> {
  const form = new FormData()
  form.append('zipfile_in', zip) // must match FastAPI param name
  form.append('rubric_answer', rubricAnswer)

  const { data } = await axios.post(`${API_BASE}/api/v1/check-scripts`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data as CheckScriptsResponse
}
