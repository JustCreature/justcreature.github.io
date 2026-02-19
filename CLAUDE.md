# CLAUDE.md

Guidance for Claude Code working on this repository.

## Project Overview

Film Photography Tracker - PWA for tracking film photography metadata. React 18, TypeScript, Vite, Material-UI. Records shots with exposure details, location, camera info.

## Feature Documentation Process

**IMPORTANT:** Keep all .md files concise. Focus on key decisions, changed files, and user impact. Avoid verbose explanations.

### Completed Features
1. Create `.llm/features/done_F-{n}.md` (NOT in tasks/todo/)
2. Include: overview, key components, files changed, tests, commits
3. Delete `.llm/tasks/todo/plan_F-{n}.md`
4. Keep concise (~100-300 lines, not 500+)

**Format:**
- Brief overview (2-3 sentences)
- Key components (bullet points)
- Technical details (files changed, line counts)
- User benefits
- Testing coverage
- Single commit message

### Planned Features
1. Create `.llm/tasks/todo/plan_F-{n}.md`
2. Include: problem, solution, implementation steps, benefits
3. Keep focused (avoid rambling)

**Plan mode:** Write to `.llm/tasks/todo/plan_F-{n}.md` (NOT `~/.claude/plans/`)

### Feature Numbering
- Numbers = plan date, not implement date
- `plan_F-6.md` → `done_F-6.md` (KEEP NUMBER)
- Gaps expected (e.g., `done_F-1.md`, `done_F-6.md`, `plan_F-2.md`, `plan_F-5.md`)

### GitHub Integration
- ISSUE-n: `plan_ISSUE-42.md` → `done_ISSUE-42.md`
- Invoke: `procedure{source_github}` (label: `ready_for_dev`)
- F-n ≠ ISSUE-n (never mix)

### Documentation Style
- **Concise:** Essential info only, no fluff
- **Scannable:** Headers, bullets, code blocks
- **Actionable:** What changed, where, why
- **No duplication:** Don't repeat what's in code/commits

## LLM Procedures
See `.llm/procedure/` for workflows (e.g., `import-tasks-github.md`)

## Git Workflow

**IMPORTANT:** Skip all git commands (`git add`, `git commit`, `git push`). User handles version control manually.

## Coding Best Practices

### Component Composition
**DO:** Use shared from `src/components/common/` (DialogHeader, EmptyStateDisplay, ConfirmationDialog, EntityContextMenu, LensSelector, ApertureSelector, ShutterSpeedSelector). Extract when pattern appears 2+ times.

**DON'T:** Copy-paste dialog headers, empty states, confirmation dialogs. Use window.confirm/alert. Over-engineer for 1-2 instances.

### MUI Select Accessibility
Always use `useId()` to connect InputLabel/Select:
```typescript
const id = useId();
<InputLabel id={`${id}-label`}>Label</InputLabel>
<Select labelId={`${id}-label`} id={id} label="Label" />
```

### TypeScript Imports
Use `type` keyword (verbatimModuleSyntax):
```typescript
import type { Lens, Camera } from '../types';
import { type ReactNode } from 'react';
```

### Patterns
- **Confirmations:** Use `<ConfirmationDialog>` not `window.confirm()`
- **Empty states:** Use `<EmptyStateDisplay>` not custom markup
- **Duplication:** Check `common/` before creating. Update CLAUDE.md when adding new patterns.

## Key Commands

### Development
```bash
npm run dev          # Start dev server (https if certs exist)
npm run build        # Build for production
npm run preview      # Preview build
npm run lint         # ESLint
```

### Version
```bash
npm run version:{patch|minor|major}
```

### Testing
```bash
npm run test:e2e           # 80 tests across 5 browsers
npm run test:e2e:ui        # Interactive mode
npm run test:e2e:headed    # See browser
npm run test:e2e:debug     # Inspector
npm run test:e2e:report    # HTML report
```

**Test files:** app-navigation, camera-management, film-roll-management, photography-workflow
**Browsers:** Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
**Page Objects:** `e2e/utils/page-objects.ts`

### Python Metadata Script
```bash
python apply_filmroll_metadata.py <folder_path>  # Apply metadata to TIFs using exiftool
apply.cmd <folder_path>                          # Windows wrapper
```
Writes EXIF: aperture, shutter, ISO/EI, GPS, camera, lens (v2.0.0: uses EI, lens per exposure, focal length)

## Project Structure

```
src/
├── components/
│   ├── common/           # Shared: Dialog/Empty/Confirmation/Menu/Selectors
│   ├── *Screen.tsx       # Main/FilmRollList/Camera/Lens/Setup/Camera/Gallery/Details/Settings
│   ├── ItemCard.tsx
│   └── FocalLengthSlider.tsx
├── utils/
│   ├── storage.ts        # Async API facade
│   ├── indexedDBStorage.ts  # IndexedDB + migration
│   ├── exportImport.ts
│   ├── googleDriveService.ts
│   └── camera.ts         # Camera/geolocation/file utilities
├── types.ts
├── App.tsx               # State management
└── main.tsx
```

## Architecture

### Shared Components (`src/components/common/`)
- **DialogHeader** - Title, icon, close button
- **EmptyStateDisplay** - Icon, title, description, action
- **ConfirmationDialog** - Customizable severity, replaces window.confirm
- **EntityContextMenu** - Edit/Delete menu
- **LensSelector/ApertureSelector/ShutterSpeedSelector** - MUI selects with useId() accessibility

All use `type` imports, accept standard props, self-contained.

### Storage (Two-Layer)
1. **IndexedDB** (`indexedDBStorage.ts`) - 50MB+, stores: filmRolls, exposures, cameras, settings, currentFilmRoll. Auto-migrates from localStorage. Serializes dates.
2. **Facade** (`storage.ts`) - Async wrapper. Call `storage.initialize()` in App.tsx.

### State (App.tsx)
React hooks (no Redux). `AppState`: currentFilmRoll, filmRolls, cameras, exposures, currentScreen, selectedExposure, settings.
Screens: 'filmrolls' | 'setup' | 'camera' | 'gallery' | 'details'

### Data Model (`types.ts`)
- **Camera** - make, model, lens, auto-name
- **FilmRoll** - name, ISO, totalExposures, cameraId
- **Exposure** - filmRollId, number, aperture, shutter, location, imageData (base64), capturedAt
- **AppSettings** - Google Drive, version

### Screen Flow
MainScreen (tabs) → SetupScreen → CameraScreen → GalleryScreen → DetailsScreen

### PWA
- `vite-plugin-pwa` with injectManifest (custom SW: `public/sw.js`)
- Manual update (registerType: 'prompt')
- NetworkFirst caching
- HTTPS via local certs (localhost+4.pem)

### Import/Export (`exportImport.ts`)
**v2.0.0 Format:**
- `metadata.json` - FilmRoll (ei, currentLensId), Exposures (aperture, shutter, notes, location, capturedAt, ei, lensId, lensName, focalLength)
- `exposure_X_ID.jpg` - Numbered photos

**Methods:** Local download (500ms stagger), JSON only (Web Share on mobile), Google Drive (placeholder)

Images as base64 in IndexedDB. FileReader with 10MB limit. Dates ↔ ISO strings. Lens name denormalized for Python script.

## Key Features

### Photo Capture
- MediaDevices API (fallback constraints: rear → front → basic)
- Gallery picker
- Settings: aperture (f/1.4-f/22), shutter (1/4000-BULB), notes
- Geolocation (10min cache, high accuracy)
- Exposure counter

### Management
- Three tabs: Film Rolls, Cameras, Lenses
- **Cameras** - make, model, auto-names
- **Lenses** - max aperture, focal length (prime/zoom 24-70mm)
- Mid-roll lens changes
- EI (Exposure Index) per exposure
- CRUD for cameras/lenses

### Privacy
100% local (IndexedDB), offline, no tracking, no server, permission-based.

## Development Notes

### Camera Utilities (`camera.ts`)
- `camera.isSupported()` - Check API + secure context
- `camera.getMediaStream()` - Multiple constraint attempts
- `camera.captureImage()` - Max 1280px, JPEG 0.7-0.8
- `geolocation.getCurrentPosition()` - 10s timeout, 10min cache
- `fileUtils.fileToBase64()` - 10MB limit

### Patterns
**Creating entities:** ID = `Date.now().toString()` → `await storage.save*()` → update state immutably
**Updating exposures:** Save first → map state: `exposures.map(e => e.id === id ? newE : e)`
**Navigation:** `navigateToScreen(screen, exposure?)` updates currentScreen + selectedExposure

### Config
- **Dates:** Objects in memory, ISO strings in IndexedDB (auto-converted)
- **Exposure settings:** Separate state in App.tsx, persists across shots
- **MUI theme:** Primary #1976d2 (blue), secondary #dc004e (pink)
- **TypeScript:** Strict mode, tsconfig.app.json + tsconfig.node.json, React 19

## External Dependencies
- Aperture/shutter constants in `types.ts`
- Browser APIs: Geolocation, MediaDevices, Web Share
- exiftool v13.38 for Python script

## Browser Compatibility
- Camera: Chrome 53+, Firefox 36+, Safari 11+
- PWA: Chrome 40+, Firefox 44+, Safari 11.1+
- IndexedDB/Geolocation: All modern
- Web Share: Mobile (Chrome Android 61+, Safari iOS 12.2+)

## Deployment
Static hosting (Vercel/Netlify/GitHub Pages). Build to `dist/`:
```bash
npm run build
npx vercel --prod
npx netlify deploy --prod --dir=dist
```
