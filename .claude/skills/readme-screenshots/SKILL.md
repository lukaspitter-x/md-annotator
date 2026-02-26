---
description: Capture screenshots and GIF walkthroughs of the app for the README using browser automation (Chrome extension or Playwright)
disable-model-invocation: true
---

# /readme-screenshots

Automate capturing screenshots and/or a GIF walkthrough of the app, saving them to the project, and optionally updating the README.

## Arguments

Parse the user's arguments after `/readme-screenshots`:

- **Mode**: `gif` (default), `screenshots`, or `both`
- `--url <URL>` — override the dev server URL (default: auto-detect from package.json)
- `--dir <PATH>` — override the output directory (default: `public/screenshots/`)
- `--no-readme` — skip the README update step
- `--chrome` / `--playwright` — force a specific browser tool (default: auto-detect)
- **Free text** — any remaining text describes specific views or flows to capture

Examples:
- `/readme-screenshots` — record a GIF of the core flow, save it, update README
- `/readme-screenshots screenshots` — take individual screenshots instead of a GIF
- `/readme-screenshots both --url http://localhost:5173` — capture GIF + screenshots at a custom URL
- `/readme-screenshots gif capture the dark mode toggle and export drawer`
- `/readme-screenshots screenshots --playwright` — use Playwright even if Chrome extension is available

## Step 1 — Understand the project

Read these files to understand the app:
- `package.json` — find the dev command and default port
- `README.md` — see existing screenshot references and structure
- `CLAUDE.md` — understand the app's features and UI layout
- Glob for `src/app/**/page.tsx` or `src/pages/**/*.tsx` or `app/**/page.tsx` — find routes and key views

From this, determine:
- The dev command (e.g., `npm run dev`, `bun dev`)
- The default port (e.g., 3000, 5173)
- The key UI views and user flows worth capturing

## Step 2 — Detect browser automation tools

Unless `--chrome` or `--playwright` was specified, auto-detect what's available:

### Check for Chrome extension (MCP tools)
Try calling `tabs_context_mcp`. If it succeeds → Chrome extension is available.

### Check for Playwright
```bash
npx playwright --version 2>/dev/null
```
If this fails, Playwright is not installed. It can be installed with:
```bash
npm install -D playwright && npx playwright install chromium
```

### Decision matrix

| Mode | Chrome ext available | Playwright available | Action |
|------|---------------------|---------------------|--------|
| `gif` | Yes | — | Use Chrome extension (only option for GIF) |
| `gif` | No | Yes | Warn: GIF requires Chrome extension. Offer to fall back to screenshots with Playwright |
| `gif` | No | No | Error: no browser tools available |
| `screenshots` | Yes | — | Use Chrome extension |
| `screenshots` | No | Yes | Use Playwright |
| `screenshots` | No | No | Error: no browser tools available |
| `both` | Yes | — | Chrome extension for GIF, Chrome extension for screenshots |
| `both` | No | Yes | Warn: GIF requires Chrome extension. Take screenshots only with Playwright |

Prefer Chrome extension when available — it supports GIF recording, interactive exploration, and real user-like interactions. Playwright is the fallback for screenshot-only workflows.

## Step 3 — Ensure dev server is running

If `--url` was provided, use that URL. Otherwise, detect the port from package.json scripts or framework defaults.

Check if the server is already running:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:<PORT>
```

If not running, start it in the background:
```bash
cd <project-root> && npm run dev &
```

Wait for the server to be ready (poll with `curl` up to 30 seconds).

## Step 4 — Set up the browser

### Chrome extension path
1. Call `tabs_context_mcp` with `createIfEmpty: true`
2. Call `tabs_create_mcp` to create a fresh tab
3. Call `resize_window` to set the viewport to **1280x800** (good for README images)
4. Navigate to the app URL

### Playwright path
No browser setup needed — Playwright launches a headless browser per command. Set viewport via `--viewport-size`:
```bash
npx playwright screenshot --viewport-size="1280,800" <URL> <output-path>
```

## Step 5 — Explore and plan the capture sequence

1. **See the app's current state:**
   - Chrome extension: take a screenshot with `computer action: "screenshot"`
   - Playwright: `npx playwright screenshot --viewport-size="1280,800" <URL> /tmp/initial.png` then read the image
2. **Understand the UI:**
   - Chrome extension: call `read_page` with `filter: "interactive"` to list UI elements
   - Playwright: `npx playwright pdf` or inspect the page source, or read the project's component files to understand the UI structure
3. Plan a **4–8 step sequence** that demonstrates the core user flow. For a typical app this means:
   - Empty/initial state
   - Content entered or loaded
   - Key interaction (selection, form fill, button click)
   - Result or output state
   - Any secondary views (sidebar, modal, settings)
4. If the user provided free text describing specific views, prioritize those instead
5. Tell the user the planned sequence and ask for confirmation before capturing

## Step 6 — Capture

### GIF mode (Chrome extension only)

1. Get the app into a clean starting state (reload if needed)
2. Take a screenshot (this becomes the first visual frame)
3. Call `gif_creator` with `action: "start_recording"`
4. Take another screenshot immediately to capture the initial frame
5. For each step in the sequence:
   - Perform the interaction (click, type, scroll via `computer` tool)
   - Call `computer` with `action: "wait"` for 0.5–1s to let animations settle
   - Take a screenshot to capture the frame
6. Take a final screenshot
7. Call `gif_creator` with `action: "stop_recording"`
8. Call `gif_creator` with `action: "export"`, `download: true`, and a descriptive filename like `<project-name>-demo.gif`

### Screenshot mode — Chrome extension path

For each step in the sequence:
1. Get the app into the target state using `computer` (click, type, scroll)
2. Call `computer` with `action: "wait"` for 0.5s
3. Take a screenshot with `computer action: "screenshot"`
4. Note the screenshot image ID for later saving

### Screenshot mode — Playwright path

For each step in the sequence, write and run a Playwright script that:
1. Launches a Chromium browser with `--viewport-size=1280,800`
2. Navigates to the app URL
3. Performs the interactions needed to reach the target state
4. Takes a screenshot and saves it to the output directory

For simple static screenshots (no interaction needed):
```bash
npx playwright screenshot --viewport-size="1280,800" "<URL>" "<output-dir>/step-1-initial.png"
```

For screenshots that require interaction, write a temporary script:
```bash
cat > /tmp/capture.mjs << 'SCRIPT'
import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(process.argv[2]);

// Example interactions — adapt to the actual capture plan:
// await page.fill('textarea', '# Hello World\n\nSome markdown content');
// await page.waitForTimeout(500);
// await page.screenshot({ path: process.argv[3] });

// Click a button, capture result:
// await page.click('button:has-text("Export")');
// await page.waitForTimeout(500);
// await page.screenshot({ path: process.argv[4] });

await browser.close();
SCRIPT
node /tmp/capture.mjs "<URL>" "<output-dir>/step-1.png" "<output-dir>/step-2.png"
```

Adapt the script interactions to match the planned capture sequence. Keep it simple — one script for the whole sequence.

### Both mode

Run the GIF sequence first (Chrome extension), then take individual screenshots of key states using whichever tool is available.

## Step 7 — Save files to the project

Create the output directory:
```bash
mkdir -p <output-dir>
```

**Chrome extension GIF files** are downloaded to `~/Downloads/`. Move them:
```bash
mv ~/Downloads/<filename>.gif <output-dir>/
```

**Playwright screenshots** are written directly to the output path — no move needed.

After saving, verify the files exist:
```bash
ls -la <output-dir>/
```

Tell the user what was saved and the file sizes.

## Step 8 — Update README (unless `--no-readme`)

1. Read the current `README.md`
2. Look for an existing image reference after the first `# ` heading (hero image position)
3. If an image already exists there, replace it with the new path
4. If no image exists, insert one after the first heading and description paragraph
5. Use the format: `![<Project name> demo](public/screenshots/<filename>.gif)` (or `.png` for screenshots)
6. Show the user the diff before saving — ask for confirmation

## Step 9 — Clean up

1. If Chrome extension was used: call `gif_creator` with `action: "clear"` to free memory
2. If Playwright temp scripts were created: `rm /tmp/capture.mjs` (if it exists)
3. Report a summary:
   - Browser tool used (Chrome extension / Playwright)
   - Files saved (with paths and sizes)
   - README changes made (if any)
   - The dev server status (remind user it may still be running in background)
