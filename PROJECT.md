# Anti Gravity — Project Documentation

## What is Anti Gravity?

Anti Gravity is a free, open, browser-based PDF reader that delivers a Kindle-quality (or better) reading experience for any PDF. Unlike Kindle, it doesn't lock users into an ecosystem. Unlike browser PDF viewers, it actually reflows text and provides a premium reading experience with AI-powered intelligence features.

**Tagline:** The reading experience that defies everything you know.

---

## Why Build This?

Kindle's PDF support is terrible — it treats pages as images with no reflow. Browser PDF viewers (Chrome, Firefox) are basic and ugly. There's no free tool that takes a PDF, reflows the text, and gives you a proper e-reader experience with bookmarks, highlights, dictionary, themes, and smart features — all running in the browser with zero cost.

Anti Gravity fills that gap.

---

## Core Principles

1. **Free forever** — No paid APIs, no subscriptions to use core features
2. **No lock-in** — Works without sign-up. All data exportable. You own everything.
3. **Offline-first** — Core features work without internet. Data stored locally in IndexedDB.
4. **PDF-first** — Actually reflows PDF text (Kindle can't do this well)
5. **Privacy** — PDFs are parsed client-side. Nothing uploaded to any server unless user opts into cloud sync.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 14 (App Router) | SSR, file-based routing, Vercel-native |
| Language | TypeScript | Type safety across the project |
| Styling | Tailwind CSS + CSS Variables | Utility classes + theming via variables |
| PDF Parsing | pdf.js (Mozilla) | Industry standard, client-side, free |
| State Management | Zustand | Lightweight, no boilerplate |
| Local Storage | IndexedDB via `idb` | Large binary storage (PDFs), structured data |
| Database | Supabase (Postgres) | Free tier, auth, RLS, real-time |
| Auth | Supabase Auth (Google OAuth) | One-click sign-in, free |
| NLP / Entity Extraction | compromise.js | Client-side NER, no API needed |
| Summarization | TextRank (custom JS) | Extractive summarization, no API |
| Dictionary | dictionaryapi.dev | Free, no API key, English |
| TTS | Web Speech API | Browser-native, free |
| Deployment | Vercel (free tier) | Zero config with Next.js |

**Total running cost: $0/month** (Vercel free + Supabase free)

---

## Features by Phase

### Phase 1 — Core Reader + Dictionary + Flashcards (MVP)

**Reading:**
- PDF upload via drag-and-drop or file browse
- Client-side PDF parsing with pdf.js (text extraction + reflow)
- Clean paginated reading view — one page at a time
- 4 full UI themes: Light, Dark, Sepia, Midnight (themes ENTIRE app, not just reading pane)
- Font picker: Literata, Merriweather, Lora, Source Serif 4, IBM Plex Sans, Nunito, Atkinson Hyperlegible (accessibility), JetBrains Mono
- Font size slider: 12px - 32px
- Line height slider: 1.2 - 2.4
- Keyboard navigation: ArrowRight/Space = next page, ArrowLeft = prev, number input = jump to page
- Progress bar showing % read
- Two-column layout toggle (auto-disabled on screens < 900px)
- Responsive design (mobile, tablet, desktop)
- System dark mode auto-detection (prefers-color-scheme)

**Dictionary & Vocabulary:**
- Double-click / long-press any word → popup with definition (via dictionaryapi.dev — free, no key)
- Every looked-up word auto-saved to vocabulary list in IndexedDB
- Vocabulary flashcard mode: show word → tap to flip → see definition + context sentence from the book
- Mark words as "Mastered" to filter them out
- Vocabulary list view with search/filter

**Storage:**
- All data in IndexedDB — bookmarks, progress, vocabulary, preferences
- No account needed. Zero friction.

**UI/UX:**
- Upload screen: centered card with drag-and-drop zone, floating background orbs, premium feel
- Reader screen: top bar (file name, page count, controls), reading pane, optional sidebar
- Settings panel: slide-in from right with all reading preferences
- Smooth transitions and micro-interactions throughout
- Design direction: premium indie product, anti-generic, no AI slop aesthetics

---

### Phase 2 — Annotations, Library & Smart Navigation

**Annotations:**
- Bookmarks: save/remove per page, icon in top bar
- Highlights: select text → choose color (yellow, green, blue, pink) → save with page reference
- Notes: attach text notes to any page
- My Notebook sidebar tab: all bookmarks, highlights, notes in one place

**Navigation:**
- Full-text search across entire document with result count and snippets
- Sidebar with tabs: Pages (TOC), Bookmarks, Highlights, Notes, Search Results
- Reading position memory: auto-save last page per book in IndexedDB
- Page jump input: type a page number and go
- Continuous scroll toggle (alternative to paginated view)
- Reading Ruler: highlights current line or dims surrounding text to reduce eye drift

**Library:**
- Upload and store multiple PDFs in IndexedDB
- Library grid view: cover thumbnail (first page render), title, progress %, last read date
- Search/filter library
- Delete books from library
- Reading time estimate per book (based on word count ÷ 230 wpm)

**Stats:**
- Track pages read per session
- Time spent reading
- Reading streak (consecutive days)

---

### Phase 3 — Intelligence Layer (Free AI, $0 Cost)

**Entity Extraction (compromise.js — runs in browser):**
- Auto-detect character names, locations, organizations in the text
- "Characters & Places" panel in sidebar showing all entities found with page references
- Tap any entity → see all occurrences across the document

**Summarization (TextRank — runs in browser):**
- Auto-generate extractive summary per page range / chapter
- "Key Passages" feature: highlights the most important sentences
- Summaries saved to IndexedDB (and Supabase if signed in)

**Language:**
- Wikipedia lookup: select any term → see Wikipedia summary in a popup (via Wikipedia API, free)
- Instant translation for selected text (via LibreTranslate or MyMemory API, free)
- Vocabulary flashcard quiz mode: multiple choice, spaced repetition logic

**Audio:**
- Text-to-speech via Web Speech API
- Play / pause / speed control (0.5x to 2.0x)
- Current sentence highlighting during TTS playback

**Export:**
- Export all highlights + notes as Markdown (.md) file
- Export vocabulary list as CSV
- Export reading stats summary

---

### Phase 4 — Cloud Sync, PWA & Launch

**Auth & Sync:**
- Supabase Auth: Google sign-in (one click), completely optional
- Cloud sync when signed in:
  - Write to IndexedDB first (instant UX)
  - Push to Supabase Postgres in background
  - Pull from Supabase on app load on new device
  - Conflict resolution: latest timestamp wins
- Supabase Row Level Security on all tables

**Supabase Schema:**
```
books:        id, user_id, file_name, file_hash (SHA-256), total_pages, created_at
bookmarks:    id, user_id, book_id, page_number, label, created_at
highlights:   id, user_id, book_id, page_number, text, color, created_at
notes:        id, user_id, book_id, page_number, content, created_at
progress:     id, user_id, book_id, current_page, percent, last_read_at
summaries:    id, user_id, book_id, page_start, page_end, summary_text, created_at
vocabulary:   id, user_id, word, definition, context, book_id, page_number, mastered, created_at
```

**PWA:**
- Service worker for offline support
- Installable on phone/tablet home screen via next-pwa
- App icon, splash screen, manifest.json

**Format Expansion:**
- EPUB support via epub.js library
- Format detection on upload: route to pdf.js or epub.js accordingly

**Data Portability:**
- Export ALL data as single JSON file (bookmarks, highlights, notes, vocabulary, progress)
- Import JSON to restore on any device
- No lock-in, ever.

**Landing Page:**
- Product hero section with demo animation
- Feature highlights
- "Start Reading — No Sign Up" CTA
- Open source badge if you choose to open-source it

---

## Project Structure

```
anti-gravity/
├── app/
│   ├── layout.tsx              # Root layout with theme provider
│   ├── page.tsx                # Landing / Upload screen
│   ├── reader/
│   │   └── page.tsx            # Main reading view
│   ├── library/
│   │   └── page.tsx            # Book library grid (Phase 2)
│   ├── vocabulary/
│   │   └── page.tsx            # Vocabulary list + flashcards
│   └── globals.css             # Theme CSS variables + Tailwind
├── components/
│   ├── UploadZone.tsx          # Drag-and-drop upload
│   ├── ReaderView.tsx          # Main reading pane
│   ├── TopBar.tsx              # Navigation bar
│   ├── Sidebar.tsx             # Pages, bookmarks, highlights tabs
│   ├── SettingsPanel.tsx       # Font, theme, layout controls
│   ├── DictionaryPopup.tsx     # Word definition popup
│   ├── FlashcardMode.tsx       # Vocabulary flashcard component
│   ├── ReadingRuler.tsx        # Line guide overlay (Phase 2)
│   ├── SearchBar.tsx           # Full-text search (Phase 2)
│   ├── TTSControls.tsx         # Text-to-speech player (Phase 3)
│   └── SyncStatus.tsx          # Cloud sync indicator (Phase 4)
├── lib/
│   ├── pdfParser.ts            # pdf.js wrapper
│   ├── epubParser.ts           # epub.js wrapper (Phase 4)
│   ├── storage.ts              # IndexedDB operations via idb
│   ├── supabase.ts             # Supabase client + sync logic (Phase 4)
│   ├── dictionary.ts           # dictionaryapi.dev wrapper
│   ├── textrank.ts             # TextRank summarization (Phase 3)
│   ├── entities.ts             # compromise.js NER wrapper (Phase 3)
│   └── themes.ts               # Theme definitions + CSS variable mapping
├── stores/
│   └── readerStore.ts          # Zustand store for reading state
├── public/
│   └── fonts/                  # Self-hosted fonts (fallback)
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── next.config.js
└── PROJECT.md                  # This file
```

---

## Competitive Edge Over Kindle

| Feature | Kindle | Anti Gravity |
|---------|--------|-------------|
| PDF text reflow | Bad (treats as image) | Proper reflow via pdf.js |
| UI theming | Page color only (4 options) | Full app theming (4 themes, everything) |
| Ecosystem | Locked to Amazon | Open, no account needed |
| AI features | X-Ray (Amazon books only) | Entity extraction + summarization on ANY PDF |
| Highlight export | Difficult, limited | One-click Markdown/CSV export |
| Dictionary | Built-in (Amazon) | Free API, auto-saves to vocabulary |
| Vocabulary training | Flashcards (Kindle only) | Flashcards in browser, works everywhere |
| Two-column layout | Not available | Available on wide screens |
| Cost | Kindle Unlimited $11.99/mo | Free forever |
| Data ownership | Amazon owns it | You own it (JSON export) |

---

## Future Ideas (Post V1)

- Transformers.js for in-browser ML (better summarization, AI X-Ray)
- Gemini free tier toggle for higher quality AI
- DOCX and HTML format support
- Share highlights as social image cards
- Browser extension "Send to Anti Gravity"
- Spaced repetition algorithm for vocabulary (SM-2)
- Cross-book search across entire library
- Reading goals and yearly challenges
- Collaborative highlights (see what others highlighted — requires user base)
