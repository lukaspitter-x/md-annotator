PRD — Mobile Markdown Annotation App for Claude Code Handoff
1) Product Summary

A mobile-first web app that lets a user:

Open/paste/import a Markdown file

Select text ranges (word(s) to paragraphs)

Attach annotations/comments to selected ranges

Visually distinguish annotated text while keeping the Markdown readable

Review/manage multiple annotations in one file

Generate a Claude Code handoff package (single text output) that includes:

original Markdown with embedded annotation markers

structured todo/instruction block

explicit workflow instructions for Claude Code:

propose solutions to comments first,

wait for approval/chat,

rewrite original doc,

show diffs vs original

Core principle

The document should look mostly normal “at first sight,” while annotated regions are:

visually distinct

tappable/editable

exportable in a deterministic format that Claude Code can parse

2) Goals / Non-Goals
Goals (MVP)

Mobile-friendly text selection + annotation

Multiple annotations per .md file

Local-only usage (no login)

Export one copy/paste payload for Claude Code

Beautiful black/white UI using shadcn/ui “neutral” aesthetic

Free hosting on Vercel

No backend database required (MVP)

Non-Goals (MVP)

Real-time collaboration

User accounts / cloud sync

AI integration inside the app

Full Markdown WYSIWYG editor parity

Desktop-optimized power-user features (later)

3) Target User
Primary

A technical/creative user who edits Markdown docs on mobile and wants to leave granular comments/instructions for Claude Code.

Jobs to be done

“Mark exactly what I want changed in this .md.”

“Keep the original readable.”

“Export a clean instruction package Claude can follow reliably.”

“Do this quickly on iPhone.”

4) User Stories
Core Stories

As a user, I can paste a Markdown document into the app and see it rendered in an editable text view.

As a user, I can select a range of text and attach an annotation/comment to it.

As a user, annotated text is visually distinct and tappable.

As a user, I can edit or delete an annotation later.

As a user, I can view a list of all annotations and jump to each one.

As a user, I can export a Claude Code-ready payload with:

inline annotation markers

instruction preamble/postamble

todos/processing workflow

As a user, I can copy the generated payload with one tap.

Nice-to-have (post-MVP)

Import/export .md file directly

Local autosave in browser

Multiple documents in local storage

Annotation types (edit, ask, keep, del, note)

Approvals/checklist state per annotation

5) UX Requirements (Mobile-First)
5.1 Core UX concept

Use a hybrid editor:

base is a plain-text Markdown editing area

annotation actions are triggered via text selection

annotations are displayed with lightweight overlays/highlights and chips

Why hybrid

True inline rich annotations in a raw <textarea> are hard. For MVP, use:

Editable source view (textarea/code editor)

Interactive annotation layer (positioned highlights or selection-based metadata)

Generated export view (final Claude-ready text)

This keeps the .md faithful while enabling interaction.

5.2 Screens
A) Editor Screen (main)

Header

App name

“New / Paste”

“Export”

Markdown editor area (large)

Floating action bar (appears on selection)

Add annotation

Bottom sheet / drawer (mobile)

Selected text preview

Annotation type picker

Comment field

Save / Cancel

Annotation list toggle (sheet/panel)

B) Annotation List Sheet

List items:

annotation type badge

short selected text excerpt

short comment preview

tap to jump

edit/delete

Filter by type (optional in MVP)

C) Export / Handoff Screen

Generated Claude Code payload preview

Buttons:

Copy payload

Copy original+markers only

Copy instructions only

Optional toggles:

“Instructions at top” / “Instructions at bottom”

Include annotation index table (on/off)

5.3 Visual style (shadcn/ui black & white)

Use shadcn/ui with Neutral base style/theme direction (black/white minimal aesthetic). shadcn/ui is explicitly built to be customized and supports current CLI/config workflows.

Style guidelines

Black/white/gray palette only

High contrast

Minimal chrome

Rounded corners default

Mono font for editor text

Annotation highlights:

grayscale backgrounds/patterns (not color-dependent)

type icon/badge for distinction

6) Functional Requirements
6.1 Document Input

User can:

paste Markdown text

clear/reset document

(optional MVP+) upload .md

Acceptance criteria

Pasted text appears immediately in editor

Large files (at least ~50KB) remain usable on mobile (best effort)

6.2 Text Selection + Annotation Creation

User can select any contiguous text range in the document:

a word

multiple words

a sentence

paragraph(s)

Then add annotation:

type (default edit)

comment/instruction text

Annotation object (MVP)

Each annotation stores:

id

type (edit | ask | keep | del | note)

selectionStart (character offset in raw markdown)

selectionEnd (character offset)

selectedTextSnapshot

comment

createdAt

updatedAt

Acceptance criteria

Selection action works on mobile Safari/Chrome

Annotation persists while editing session is open

User can create multiple annotations in one doc

Overlapping annotations are initially not allowed (MVP simplification)

6.3 Visual Annotation Display

Annotated segments should look normal-ish but clearly marked:

subtle background highlight

underline/dashed underline

small inline badge on tap/selection (optional)

tap annotated region → open edit sheet

Acceptance criteria

User can visually spot annotated regions

User can tap region to inspect/edit annotation

Document remains readable

6.4 Annotation Management

User can:

view all annotations in a list

edit type/comment

delete annotation

jump to annotation position in document

Acceptance criteria

List reflects current annotations

Deleting annotation removes visual mark

Jump scrolls and briefly highlights target region

6.5 Export: Claude Code Handoff Payload

App generates a single text output that includes:

A) Claude instructions block

Explains:

Parse annotation markers

Propose fixes first (do not rewrite yet)

Wait for approval/chat

Rewrite original doc

Show diff vs original

Remove annotation markers only in final rewritten version (unless asked otherwise)

B) Annotated Markdown

Original Markdown with inline markers around annotated ranges

C) Annotation index (optional but recommended)

A structured list of annotations with IDs, types, selected text excerpts, and comments

D) Suggested workflow checklist for Claude Code

Step-by-step sequence to drive conversation

Acceptance criteria

One-tap copy works

Export is deterministic

Export preserves original markdown content except added markers/metadata

Export supports multiple annotations

6.6 Local Persistence (No login)

No login needed. Store current session locally using browser storage.

MVP storage

localStorage for active document + annotations

autosave on changes (debounced)

Acceptance criteria

Refresh page restores active work (best effort)

“Clear all” removes local data

7) Export Format Specification (Claude-Readable)

This is the most important part.

7.1 Inline marker format (inside Markdown)

Use a marker that is:

valid plain text

unlikely to occur naturally

easy for Claude Code to parse

still readable

Proposed inline syntax (MVP)
<<ANN:id=a12 type=edit>>
selected text here
<</ANN>>

This wraps the exact selected range.

If inline wrapping is too hard due to shifting offsets after edits, generate export from original text by applying annotations in reverse offset order.

7.2 Annotation index block

Append (or prepend) a machine-friendly block:

<!-- CLAUDE_ANNOTATION_INDEX_START
[
  {
    "id": "a12",
    "type": "edit",
    "selectedText": "Generate image",
    "comment": "Change CTA to feel more playful for teens"
  },
  {
    "id": "a13",
    "type": "keep",
    "selectedText": "Nano Banana Pro",
    "comment": "Keep exact brand name unchanged"
  }
]
CLAUDE_ANNOTATION_INDEX_END -->

Why this helps:

Claude can parse exact comments without relying only on inline text

if wrapping is imperfect, index still exists as source of truth

7.3 Claude Code instruction block (template)

Generated block example:

# Claude Code Instructions for Annotated Markdown

You are given a Markdown document with inline annotation markers:
- <<ANN:id=... type=...>> ... <</ANN>>

There is also an annotation index in a comment block.

Please follow this process exactly:

1. Parse all annotations and summarize them as proposed edits/questions.
2. FIRST show your suggested solutions for each annotation (grouped by annotation ID).
3. Do NOT rewrite the original document yet.
4. Wait for my approval or discussion.
5. After approval, rewrite the original Markdown document (without annotation markers unless I ask to keep them).
6. Finally, show a diff against the original document.
7. Respect all `type=keep` annotations as hard constraints.
8. For `type=ask`, propose options and recommend one.

When suggesting changes, preserve Markdown structure and formatting.
8) AI Workflow the App Must Support (Your exact desired flow)

The export should guide Claude Code into a 3-phase loop:

Phase 1 — Suggestions only

Claude reads annotations and proposes solutions.

Phase 2 — Approval/chat

User discusses/approves.

Phase 3 — Rewrite + diff

Claude rewrites original doc and shows diffs.

The app itself does not run Claude; it only generates the handoff payload.

9) Technical Architecture (MVP)
9.1 Stack

Next.js (App Router)

TypeScript

shadcn/ui

Tailwind CSS

Deployed on Vercel

No database (local-only MVP)

Next.js App Router is current and well-supported, and Vercel is the natural deployment target for this stack.

9.2 Suggested component structure

app/page.tsx — main editor page

components/editor/MarkdownEditor.tsx

components/editor/SelectionToolbar.tsx

components/annotations/AnnotationSheet.tsx

components/annotations/AnnotationListSheet.tsx

components/export/ExportDrawer.tsx

components/ui/* — shadcn components

Core utilities

lib/annotations/types.ts

lib/annotations/selection.ts (selection capture / offset mapping)

lib/annotations/export.ts (marker injection + payload generation)

lib/storage/local-session.ts (autosave/load)

lib/diff/ (optional later for local preview diff)

9.3 Data model (TypeScript)
type AnnotationType = "edit" | "ask" | "keep" | "del" | "note";

interface Annotation {
  id: string;
  type: AnnotationType;
  selectionStart: number; // character offset in markdown source
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
9.4 Offset handling strategy (important)

Offsets can break if user edits text after annotating.

MVP rule (simplify)

Allow editing the markdown, but show warning:

“Editing text may shift annotation anchors. Revalidate annotations before export.”

On export, verify each annotation’s current selected substring against selectedTextSnapshot.

If mismatch:

mark annotation as “needs review”

include warning in export header

still export if user chooses

Post-MVP improvement

Use anchor model:

start/end offsets + quote matching + context (prefix/suffix)
(similar to web annotation anchoring)

10) Mobile Interaction Details (critical)
10.1 Text selection on iPhone

Use native text selection in a textarea/contenteditable or code editor.

MVP recommendation

Start with textarea-based source editor (most reliable on mobile)

selection from selectionStart/selectionEnd

easier offset mapping

no heavy rich-text editor complexity

To make annotations visible:

secondary “Preview with highlights” mode (read-only interactive)

or inline list references in source mode (faster MVP)

Pragmatic MVP UX (recommended)

Two tabs:

Edit (plain textarea)

Review (rendered/overlay with clickable annotations)

This dramatically reduces implementation pain while keeping your vision intact.

11) Export Variants (MVP)

Support 3 copy buttons:

Copy Full Claude Payload (default)

Copy Annotated Markdown Only

Copy Claude Instructions Only

Optional toggle:

Instructions at top / bottom

12) Error States / Edge Cases

Empty document

Annotation with empty comment

Zero-length selection

Duplicate/overlapping ranges

Edited document causing anchor mismatch

Very large pasted text

Copy-to-clipboard failure on iOS (fallback: manual select textbox)

UX responses

Inline toast messages

“Review mismatched annotations” warning before export

Disable export if no document text

13) Security / Privacy

No login

No server-side storage (MVP)

All content remains in browser local storage unless user copies/export shares it

This aligns well with “no login needed” and keeps Vercel usage minimal (mostly static frontend). Vercel Hobby and Functions limits exist, but a local-first app avoids unnecessary backend cost/usage.

14) Deployment Requirements (Vercel)
MVP deployment mode

Static/SSR Next.js app on Vercel

No DB

No auth

No server functions required (unless adding server-side diff later)

Notes

Keep first version client-heavy and local-only for free hosting friendliness.

If later adding AI or persistence, add server functions carefully and monitor Vercel limits/pricing.

15) Success Metrics (MVP)

Time to first annotation < 30 seconds (from paste)

Export success rate > 95% (copy works)

User can create and manage at least 10 annotations in one doc without confusion

Zero account/signup friction

16) MVP Scope Checklist (build order for Claude Code)
Phase 1 — Skeleton

 Next.js app scaffold

 shadcn/ui setup (neutral black/white styling)

 main page layout (editor + bottom actions + export drawer)

Phase 2 — Annotation Core

 textarea markdown editor

 text selection capture

 add annotation sheet

 annotation list

 local state + autosave

Phase 3 — Export Engine

 marker injection into markdown

 annotation index generation

 Claude instruction block template

 copy-to-clipboard buttons

Phase 4 — Review / Polish

 review mode with clickable highlighted annotations

 validation for anchor mismatch

 mobile UX polish

 empty/error states

17) Explicit Build Constraints for Claude Code (put this in PRD)

Build mobile-first (iPhone Safari first)

No login/auth

No backend database

Use Next.js + TypeScript + shadcn/ui + Tailwind

Use black/white neutral visual theme

Deployable to Vercel

Prefer simple reliable implementation over rich editor complexity

Code should be modular and easy to extend later with:

direct .md file import/export

local multi-document storage

optional AI integration

robust text anchoring

Copy/Paste Section for Claude Code (implementation brief)

You can paste this directly after the PRD if you want Claude Code to start building immediately:

Build an MVP mobile-first web app for annotating Markdown text ranges and exporting a Claude Code handoff payload.

Tech stack:
- Next.js (App Router)
- TypeScript
- shadcn/ui
- Tailwind CSS

Requirements:
- No login
- No backend/database
- Works well on iPhone Safari
- Vercel deployable
- Black/white (neutral) UI aesthetic

Core features:
1. Paste/edit Markdown in a textarea.
2. Select text range and add annotation (type + comment).
3. Store multiple annotations with character offsets.
4. Show annotation list with edit/delete/jump.
5. Export a single copyable payload containing:
   - Claude instructions block
   - annotated markdown with inline markers
   - annotation index JSON block
6. Local autosave using localStorage.

MVP simplifications:
- No overlapping annotations
- Warn if markdown edits invalidate annotation anchors
- AI is not run inside the app (export only)

Please implement in phases and keep code modular.
