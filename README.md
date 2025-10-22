# Easy Script — Frontend (Next.js + Tailwind)

Elegant, dark/light-aware UI for your OCR-based student assessment system.

## ✨ Features

- Next.js App Router + TypeScript
- TailwindCSS with custom blue/white (light) and black/blue (dark) schemes
- Drag & drop ZIP upload
- Student info card, assessment table, figure results, and raw OCR viewer
- Theme toggle (system-aware) and responsive layout

## 🔧 Quick Start

```bash
# 1) Install deps
npm i

# 2) Set backend base URL (default http://localhost:8000)
echo 'NEXT_PUBLIC_API_BASE=http://localhost:8000' > .env.local

# 3) Run dev
npm run dev
```

## 🧠 Expected Backend

This UI calls:

- `POST /process-zip` with multipart `{ file: .zip }`
- Response shape:

```json
{
  "title_text": "Name: ...",
  "pages_texts": { "page1.jpg": "Answer to the question no-1a ..." },
  "marks": { "1a": { "score": 82, "feedback": "…" } },
  "figures": [
    { "figure_number": "1a", "target": "eye", "caption": "…", "marks": 75 }
  ]
}
```

Adapt `src/lib/api.ts` if your routes differ.

## 🖌️ Theming

- Light mode: white background, blue accents
- Dark mode: deep black/blue palette
- Tailwind tokens are under `theme.extend.colors.light` & `colors.dark`

---
