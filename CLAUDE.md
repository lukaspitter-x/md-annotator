# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MD Annotator is a Next.js web app for annotating Markdown documents. Users write/paste markdown, select text ranges to annotate with types (edit, ask, keep, del, note), then export as a structured payload for Claude Code handoffs.

## Commands

```bash
npm run dev      # Start dev server (port 3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

## Tech Stack

- **Next.js 16** with App Router (all page components are client-side via "use client")
- **React 19** with hooks-based state management (no external state library)
- **Tailwind CSS v4** with PostCSS plugin, OKLch color variables in globals.css
- **shadcn/ui** (New York style) built on Radix UI primitives — components in `src/components/ui/`
- **TypeScript** in strict mode; path alias `@/*` → `src/*`

## Architecture

### State Flow

`page.tsx` is the single top-level client component that owns all state:
- `useDocumentSession` hook manages `DocumentSession` (markdown + annotations array) with debounced autosave to localStorage (key: `md-annotator-session`)
- `useSelection` hook tracks textarea selection ranges with debounce
- All CRUD and UI state flows down as props; mutations flow up as callbacks

### Core Data Model (`lib/annotations/types.ts`)

`Annotation` has: id (nanoid), type, selectionStart/End (character offsets into markdown), selectedTextSnapshot, comment, timestamps. Annotations must not overlap — enforced by `hasOverlap()` in `lib/annotations/selection.ts`.

### Directory Layout

- `src/components/editor/` — MarkdownEditor (textarea), ReviewRenderer (highlighted preview), SelectionToolbar (floating annotation trigger)
- `src/components/annotations/` — AnnotationSheet (create/edit modal), AnnotationListSheet (sidebar list), AnnotationBadge
- `src/components/export/` — ExportDrawer generates the handoff payload
- `src/components/layout/` — AppHeader, TabSwitcher (Edit/Review modes)
- `src/lib/annotations/` — types, validation, selection overlap, export payload generation
- `src/lib/hooks/` — useDocumentSession, useSelection
- `src/lib/storage/` — localStorage persistence

### Export Payload (`lib/annotations/export.ts`)

The export wraps annotated text with `<<ANN:id=... type=...>>...<</ANN>>` markers, generates a JSON annotation index, and Claude-facing processing instructions. The ExportDrawer lets users configure order and inclusion of these sections.

### Styling

Annotation highlight styles use `.ann-*` classes defined in `globals.css` (not Tailwind utilities) — each annotation type has distinct background/border/text-decoration. Dark mode is supported via `next-themes` with CSS custom properties.

### Mobile Considerations

The app is optimized for mobile: fixed viewport (no zoom), 16px+ input font sizes to prevent iOS zoom-on-focus, safe area insets, Vaul-based drawers, and a fallback clipboard API for iOS Safari.
