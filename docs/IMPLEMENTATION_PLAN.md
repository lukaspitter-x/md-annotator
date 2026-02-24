# Implementation Plan — MD Annotator

## Context

Build a mobile-first web app for annotating Markdown text ranges and exporting a Claude Code handoff payload. The project has a comprehensive PRD (`docs/PRD.md`) but no code yet. The app lets users paste Markdown, select text ranges, attach typed annotations, and generate a structured export that Claude Code can parse and act on.

---

## Tech Stack

- **Next.js** (App Router) + **TypeScript**
- **shadcn/ui** (neutral black/white theme) + **Tailwind CSS**
- **Vercel** deployment
- No backend, no auth — localStorage only

---

## Phase 1: Project Skeleton

### 1.1 Initialize Project

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
npx shadcn@latest init -d --base-color neutral --css-variables
```

### 1.2 Install shadcn/ui Components

```bash
npx shadcn@latest add button sheet drawer tabs badge textarea select label sonner separator scroll-area alert toggle-group tooltip
```

### 1.3 Additional npm Dependencies

```bash
npm install nanoid use-debounce
```

### 1.4 Directory Structure

```
src/
  app/
    layout.tsx          # Root layout, viewport meta, safe areas, Toaster
    page.tsx            # Main editor page (client component)
    globals.css         # Tailwind + mobile-safe custom styles
  components/
    editor/
      MarkdownEditor.tsx     # Textarea with selection detection
      SelectionToolbar.tsx   # Fixed-bottom "Annotate" button on selection
      ReviewRenderer.tsx     # Read-only view with highlighted annotations
    annotations/
      AnnotationSheet.tsx    # Create/edit annotation (bottom drawer)
      AnnotationListSheet.tsx # List all annotations (bottom sheet)
      AnnotationBadge.tsx    # Type badge (edit/ask/keep/del/note)
    export/
      ExportDrawer.tsx       # Export payload drawer with copy buttons
    layout/
      AppHeader.tsx          # Top bar: title + action buttons
      TabSwitcher.tsx        # Edit / Review tab toggle
    ui/                      # shadcn/ui components (auto-generated)
  lib/
    annotations/
      types.ts               # TypeScript interfaces
      selection.ts           # Selection capture, overlap detection
      export.ts              # Marker injection + payload generation
      validation.ts          # Anchor mismatch detection
    storage/
      local-session.ts       # localStorage autosave/load
    hooks/
      useDocumentSession.ts  # Main state hook (session CRUD)
      useSelection.ts        # iOS-safe text selection detection
      useAutosave.ts         # Debounced localStorage persistence
```

### 1.5 Root Layout Key Details

- Viewport: `width=device-width, initialScale=1, maximumScale=1, userScalable=false, viewportFit=cover`
- Use `100dvh` (dynamic viewport height for iOS Safari)
- Safe area padding: `env(safe-area-inset-bottom)`
- Include `<Toaster />` (Sonner) provider
- **Critical**: textarea `font-size: 16px` minimum (prevents iOS auto-zoom)

### 1.6 Milestone
- App runs with `npm run dev`
- Layout shows header, tab switcher, and empty textarea
- No horizontal scroll or zoom on iPhone Safari

---

## Phase 2: Annotation Core

### 2.1 Data Model (`lib/annotations/types.ts`)

```typescript
type AnnotationType = "edit" | "ask" | "keep" | "del" | "note";

interface Annotation {
  id: string;
  type: AnnotationType;
  selectionStart: number;
  selectionEnd: number;
  selectedTextSnapshot: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

interface DocumentSession {
  markdown: string;
  annotations: Annotation[];
  updatedAt: string;
}
```

### 2.2 Core State Hook (`lib/hooks/useDocumentSession.ts`)

- `useState<DocumentSession>` at page level
- CRUD operations: `addAnnotation`, `updateAnnotation`, `deleteAnnotation`
- ID generation: `nanoid(8)` for short readable IDs
- Overlap check on add: reject if `newStart < existingEnd && newEnd > existingStart`

### 2.3 Selection Detection (`lib/hooks/useSelection.ts`)

**The most critical mobile piece.**

- Use `document.addEventListener('selectionchange', handler)` — the **only** reliable event on iOS Safari
- In handler: check `document.activeElement === textareaRef.current`
- Read `textarea.selectionStart` / `textarea.selectionEnd`
- If `start !== end`, report selection
- Do NOT use `selectstart` (never fires on iOS) or `mouseup`/`touchend` (fire before selection finalized)

### 2.4 Selection Toolbar (`components/editor/SelectionToolbar.tsx`)

- **Fixed-bottom position** (not floating near selection) to avoid conflicting with iOS native selection handles
- Shows truncated selected text preview + "Annotate" button
- Animate in/out with CSS transition
- Include safe-area bottom padding

### 2.5 Annotation Sheet (`components/annotations/AnnotationSheet.tsx`)

- Use shadcn **Drawer** (Vaul-based) for native iOS bottom sheet feel
- Content: selected text preview, type picker (5 buttons), comment textarea, save/delete
- Default type: "edit"

### 2.6 Annotation List (`components/annotations/AnnotationListSheet.tsx`)

- Sorted by `selectionStart` (document order)
- Each item: type badge, text excerpt, comment preview, tap-to-edit, jump button
- Jump: `textarea.focus()` then `setSelectionRange()` in `requestAnimationFrame`

### 2.7 Autosave (`lib/hooks/useAutosave.ts`)

- Debounce: 1000ms via `use-debounce`
- Key: `"md-annotator-session"`
- Wrapped in try/catch for Safari private browsing

### 2.8 Milestone
- Can paste markdown, select text, create annotations
- Annotation list with edit/delete/jump works
- Session survives page refresh
- Overlapping annotations rejected with toast

---

## Phase 3: Export Engine

### 3.1 Marker Injection (`lib/annotations/export.ts`)

**Critical algorithm**: Process annotations in **reverse offset order** to avoid shifting offsets.

```typescript
function generateAnnotatedMarkdown(markdown: string, annotations: Annotation[]): string {
  const sorted = [...annotations].sort((a, b) => b.selectionStart - a.selectionStart);
  let result = markdown;
  for (const ann of sorted) {
    result = result.slice(0, ann.selectionEnd) + `<</ANN>>` + result.slice(ann.selectionEnd);
    result = result.slice(0, ann.selectionStart) + `<<ANN:id=${ann.id} type=${ann.type}>>` + result.slice(ann.selectionStart);
  }
  return result;
}
```

### 3.2 Annotation Index

```
<!-- CLAUDE_ANNOTATION_INDEX_START
[ { "id": "a12", "type": "edit", "selectedText": "...", "comment": "..." } ]
CLAUDE_ANNOTATION_INDEX_END -->
```

### 3.3 Claude Instruction Block

Template with the 3-phase workflow:
1. Parse annotations → propose solutions (don't rewrite yet)
2. Wait for approval/chat
3. Rewrite document + show diff

### 3.4 Export Drawer (`components/export/ExportDrawer.tsx`)

- Toggle: instructions top/bottom
- Toggle: include annotation index
- Three copy buttons: Full Payload / Annotated MD Only / Instructions Only
- Clipboard: `navigator.clipboard.writeText()` with `document.execCommand('copy')` fallback for iOS

### 3.5 Milestone
- Export produces valid Claude-parseable payload
- Copy-to-clipboard works on iOS Safari
- Markers correctly positioned (verified by inspection)

---

## Phase 4: Review Mode & Polish

### 4.1 Review Renderer (`components/editor/ReviewRenderer.tsx`)

- Split markdown into segments (plain vs annotated)
- Render in `<pre>` with `whitespace-pre-wrap`
- Annotated spans get grayscale highlights + tap-to-edit:
  - `edit`: light gray bg + dashed underline
  - `ask`: light gray bg + bottom border
  - `keep`: near-white bg + ring outline
  - `del`: medium gray bg + strikethrough
  - `note`: light gray bg + left border

### 4.2 Anchor Validation (`lib/annotations/validation.ts`)

- Compare `selectedTextSnapshot` against current text at offset
- Run on: tab switch to Review, export open
- Show alert banner for mismatches

### 4.3 Error States

- Empty document: "Paste your Markdown to get started"
- No annotations: "No annotations yet"
- Overlap detected: toast warning
- Copy failure: fallback textarea with selectable text
- Anchor mismatch: alert banner with count

### 4.4 Mobile Polish

- Touch targets: minimum 44x44px
- Keyboard detection via `visualViewport` API
- `-webkit-overflow-scrolling: touch` for smooth scroll
- Body scroll lock when sheets/drawers open (handled by shadcn)

### 4.5 Milestone
- Full end-to-end: paste → annotate → review → export → copy
- All error states handled
- Smooth on iPhone Safari

---

## iOS Safari Pitfalls Reference

| Pitfall | Mitigation |
|---------|-----------|
| `selectstart` never fires | Use `document.addEventListener('selectionchange')` |
| Font-size < 16px causes auto-zoom | Always `font-size: 16px` on inputs |
| `100vh` doesn't account for URL bar | Use `100dvh` |
| `setSelectionRange()` fails without focus | Call `.focus()` first, then `setSelectionRange()` in `requestAnimationFrame` |
| Clipboard API fails without user gesture | Call from direct click handler; fallback to `execCommand` |
| Notch/home indicator overlap | `viewport-fit=cover` + `env(safe-area-inset-bottom)` |

---

## File Creation Order

1. `lib/annotations/types.ts`
2. `lib/storage/local-session.ts`
3. `lib/annotations/selection.ts`
4. `lib/hooks/useDocumentSession.ts`
5. `lib/hooks/useAutosave.ts`
6. `lib/hooks/useSelection.ts`
7. `app/globals.css` (update)
8. `app/layout.tsx` (update)
9. `components/layout/AppHeader.tsx`
10. `components/layout/TabSwitcher.tsx`
11. `components/editor/MarkdownEditor.tsx`
12. `components/editor/SelectionToolbar.tsx`
13. `components/annotations/AnnotationBadge.tsx`
14. `components/annotations/AnnotationSheet.tsx`
15. `components/annotations/AnnotationListSheet.tsx`
16. `app/page.tsx` (wire everything)
17. `lib/annotations/export.ts`
18. `components/export/ExportDrawer.tsx`
19. `components/editor/ReviewRenderer.tsx`
20. `lib/annotations/validation.ts`
