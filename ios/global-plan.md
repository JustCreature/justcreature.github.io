# iOS Film Photography Tracker — Global Implementation Plan

## Context
Native iOS Swift port of the existing PWA film photography tracker. The PWA tracks film photography metadata (exposures, aperture, shutter speed, ISO/EI, focal length, geolocation, notes) per film roll, with camera/lens equipment management. The iOS version uses the design mockups in `film-photo-tracker/` as reference — significantly better UX than the PWA: dark theme, amber accent `#f4a261`, film aesthetic (grain, perforations, monospace numerics), novel picker UI (radial dial).

---

## Technology Stack
- **Language**: Swift 5.9+, SwiftUI, iOS 17+ minimum
- **Persistence**: SwiftData (`@Model`, `ModelContainer`)
- **Camera**: AVFoundation (`AVCaptureSession`, `AVCapturePhotoOutput`)
- **Photos**: PhotosUI (`PHPickerViewController`)
- **Location**: CoreLocation
- **Testing**: XCTest + XCUITest
- **Architecture**: MVVM with `@Observable` macro

---

## Data Models (SwiftData `@Model`)
Direct mapping from PWA `src/types.ts`:
- **Camera**: id, make, model, name (auto-generated), lensIDs[], createdAt
- **Lens**: id, name, maxAperture (e.g. "f/1.4"), focalLength? (prime) OR focalLengthMin/Max (zoom), createdAt
- **FilmRoll**: id, name, iso, ei?, totalExposures (24/36/custom), cameraId?, currentLensId?, createdAt
- **Exposure**: id, filmRollId, exposureNumber, aperture, shutterSpeed, additionalInfo?, `@Attribute(.externalStorage) imageData: Data?` (JPEG stored outside SQLite), location?, capturedAt, ei?, lensId?, focalLength?
- **AppSettings**: id (singleton), gridEnabled, locationEnabled, hapticsEnabled, version

### Image handling rule (applies everywhere images enter the app)
All images — camera capture, PHPicker gallery import, Details image replacement, and folder-based file import — are run through a single shared `ImageUtils.downscale(_:)` before saving:
- Max dimension: **1280px** (longer side), maintaining aspect ratio
- Format: **JPEG, quality 0.75**
- This keeps each exposure image ≈ 150–300 KB, so a 36-exposure JSON-with-images export stays well under 10 MB
- `@Attribute(.externalStorage)` keeps image bytes outside the SQLite WAL, preventing large model fetches from stalling the main thread

### Predefined constants (from PWA `types.ts`):
- **Apertures**: f/1.4, f/2, f/2.8, f/3.5, f/4, f/4.5, f/5.6, f/8, f/11, f/16, f/22
- **Shutter speeds**: 1/4000 … 8", BULB
- **EI values**: 25 … 6400 (standard increments)

---

## Design System (from `film-photo-tracker/` mockups)
- **Colors**: bg `#0a0a0b`, surface-0 `#111113`, surface-1 `#17171a`, surface-2 `#1f1f23`, surface-3 `#2a2a30`; accent `#f4a261`; text `#f5f5f7`; muted `#9a9aa3`; dim `#5e5e68`; red `#ff453a`; green `#30d158`
- **Typography**: Inter Tight (UI), SF Mono / JetBrains Mono (numeric readouts, frame counters, EXIF)
- **Radius**: xs 4, sm 6, md 10, lg 16, xl 22 (sheet corners), pill 999
- **Motion**: sheets 0.32s ease-out, pickers 0.28s, buttons scale 0.1s, shutter flash 0.28s

---

## Phase 1: Foundation

### Step 1.1 — Project Setup, Data Models & Navigation Skeleton
**Deliverable**: App launches, tabs visible, SwiftData CRUD confirmed in unit tests.
- Create Xcode project: SwiftUI App, SwiftData, iOS 17+, `FilmTracker` bundle
- Define all `@Model` types: Camera, Lens, FilmRoll, Exposure, AppSettings
- `ModelContainer` setup in `FilmTrackerApp.swift` with schema migrations stub
- Root: `TabView` with Rolls tab (film roll icon) and Equipment tab (camera icon)
- `NavigationStack` inside each tab for push navigation
- PWA aperture/shutter/EI constant arrays as Swift enums/arrays
- `ImageUtils.swift` (static helpers):
  - `downscale(_ image: UIImage) -> Data` — resize to max 1280px, JPEG 0.75
  - `downscale(_ data: Data) -> Data?` — convenience for raw Data input (used by import)
  - Called by: `CameraService` (capture), `GalleryViewModel` (PHPicker), `ExposureViewModel` (replace image), `ImportService` (file-based import)

**Tests**: Unit tests — create/read/delete each model type; `ImageUtils.downscale` produces Data ≤ ~350 KB for a typical photo

### Step 1.2 — Design System & Core UI Components
**Deliverable**: Component library renders in Xcode Previews; colors match spec.
- `Color+DesignSystem.swift`: all named tokens as `static` Color properties
- `Font+DesignSystem.swift`: Inter Tight + SF Mono registrations, named text styles
- `AppButton`: primary (amber fill), secondary (surface-2), ghost (transparent) variants
- `AppChip`: default / accent-glow / ghost variants; large variant; monospace numerics
- `AppCard`: surface-1 bg, 1px hairline border, lg radius, subtle grain texture overlay
- `BottomSheet`: generic container — grabber bar (36×4px), xl radius top corners, 0.32s slide-up
- `EmptyStateView`: dashed border square icon (88×88), title, body, CTA button
- `ConfirmationSheet`: title, message, destructive confirm + cancel (replaces `window.confirm`)
- `EntityRow`: icon circle (amber bg), title, subtitle, trailing more-menu (`Menu`)

**Tests**: SwiftUI Preview snapshots (manual); unit tests for color hex values

---

## Phase 2: Equipment Management

### Step 2.1 — Camera Management
**Deliverable**: Full camera CRUD verified by XCUITests.
- Equipment tab: `Picker` segmented control "Cameras (N)" / "Lenses (N)"
- Camera list: `EntityRow` per camera; context menu — Edit, Delete
- Create/Edit camera sheet (via `BottomSheet`): Make field, Model field; auto-name = "Make Model"
- Delete with `ConfirmationSheet`
- Empty state via `EmptyStateView` ("No cameras", "Add your first camera")
- `CameraViewModel` (`@Observable`): `@Query` cameras, CRUD methods

**Tests** (XCUITest):
- `testCreateCamera` — add Nikon D750, verify in list
- `testEditCamera` — rename camera, verify updated
- `testDeleteCamera` — delete with confirmation, verify removed
- `testCameraEmptyState` — empty state visible initially
- `testTabNavigation` — switch Cameras/Lenses segments

### Step 2.2 — Lens Management
**Deliverable**: Lens CRUD with prime/zoom validation verified by XCUITests.
- Lens list in Equipment tab (Lenses segment): `EntityRow` per lens with focal range in subtitle
- Create/Edit lens sheet: Name, Max Aperture (picker), then either:
  - Prime: single "Focal Length (mm)" field
  - Zoom: "Min Focal Length" + "Max Focal Length" fields (min < max validated)
  - Toggle between prime/zoom with visual mode selector
- Validation inline (highlight field red, disable Save until valid)
- Delete with `ConfirmationSheet`
- Empty state via `EmptyStateView`
- `LensViewModel` (`@Observable`)

**Tests** (XCUITest):
- `testCreatePrimeLens` — 50mm f/1.4
- `testCreateZoomLens` — 24-70mm f/2.8
- `testZoomValidation` — min > max shows error
- `testDeleteLens`

---

## Phase 3: Film Roll Management

### Step 3.1 — Film Roll List & Create
**Deliverable**: Film roll creation and list display verified by XCUITests.
- Rolls tab: vertical `ScrollView` of `RollCard`
- `RollCard` (surface-1, lg radius):
  - Left: 96×96 thumbnail (last exposure image or film icon placeholder)
  - Exposure number (monospace) top-left over thumbnail
  - Right: optional tag pill (accent), roll name (headline), metadata line (mono muted: "ISO 400 · EI 320 · Camera · Lens"), 2px progress bar (amber fill), "23/36 · 64%" counter
  - More menu (⋯) — Edit, Delete
- FAB (60×60 amber circle, amber shadow): tap → FAB menu sheet
  - FAB menu items: "New roll" (camera icon), "Import" (arrow-down icon), "Resume last" (clock icon)
- Create roll sheet (via `BottomSheet`):
  - Film stock presets (horizontal chip scroll: Kodak Portra 400, Fuji Superia, Ilford HP5, etc.)
  - Name field (required)
  - ISO + Exposures (side by side; exposures: 12/24/36/custom)
  - EI chips (None + common values)
  - Camera picker (None + available cameras as chips)
  - Lens picker (None + available lenses as chips)
  - "Start shooting" primary button → navigate to CaptureView
- `FilmRollViewModel` (`@Observable`)

**Tests** (XCUITest):
- `testCreateFilmRoll` — create "Kodak Portra 400", ISO 400, 36 exp; verify in list
- `testFilmRollProgressShows` — 0/36 visible
- `testNavigateToCaptureScreen` — tap roll → capture screen
- `testSpecialCharactersInRollName`

### Step 3.2 — Film Roll Edit/Delete & Filters
**Deliverable**: Film roll CRUD and filtering verified by XCUITests.
- Filter pills row below header: "All (N)", "Active (N)", "Complete (N)"
  - Active = exposures < totalExposures; Complete = exposures ≥ totalExposures
- Edit roll sheet (same form as create, pre-filled)
- Delete with `ConfirmationSheet`
- Import button in Rolls tab header (stub, activates in Phase 6)
- Settings button in header (stub, activates in Phase 6)
- Tap roll card body → navigate to CaptureView (active) or GalleryView (complete)

**Tests** (XCUITest):
- `testFilterPillsAllActiveComplete`
- `testEditFilmRoll`
- `testDeleteFilmRollWithConfirmation`

---

## Phase 4: Camera Capture

### Step 4.1 — Viewfinder & Capture Core
**Deliverable**: Capture screen with live viewfinder, shutter capture, geolocation; XCUITests for UI elements.
- `CameraService` (`@Observable`): `AVCaptureSession`, rear camera default, fallback to front, `AVCapturePhotoOutput`
- `CaptureView`: full-screen immersive layout
  - Live preview via `AVCaptureVideoPreviewLayer` wrapped in `UIViewRepresentable`
  - Grain texture overlay (tiled noise pattern, 8% opacity)
  - Vignette (radial gradient, black 0→0.6 opacity)
  - Optional rule-of-thirds grid (3×3 lines, 20% white)
  - Optional frame lines (dashed rect + crosshair, amber)
- Frame counter pill (below notch): roll name (truncated), "23 / 36" (amber mono), "END" (red) when full
- Top bar (glass blur): back button (left), gallery button (right)
- Grid / frame-lines toggle buttons (top-right floating column)
- Lens label pill (top-left, floating): lens name or "No lens" → tap opens `LensPickerSheet`
- Shutter button (78px): white border circle → inner circle → press → 0.28s white flash overlay
- Last shot peek button (50px, bottom-right): shows thumbnail of last exposure
- Note editor button (50px, bottom-left): amber if note pending
- Capture flow: `CameraService.capturePhoto()` → `ImageUtils.downscale()` (max 1280px, JPEG 0.75) → get location (non-blocking) → save `Exposure` to SwiftData → increment counter
- `CaptureViewModel` (`@Observable`): manages current settings, exposure count, session
- `LocationService` (`@Observable`): CoreLocation, 10-min cache, high accuracy

**Tests** (XCUITest): `testCaptureScreenLoads`, `testFrameCounterVisible`, `testShutterButtonVisible`, `testGalleryButtonVisible` (mock camera permission)

### Step 4.2 — Settings Chips & Picker Drawers
**Deliverable**: All settings configurable via novel picker UI; values persist to exposure capture.
- `SettingsChipsRow`: 4 chips horizontal — Aperture, Shutter Speed, EI, Focal Length
  - Each chip: tiny label above, large value (amber mono when active)
  - Tap chip → activates picker drawer (deactivates others)
  - Active chip: amber glow background, amber text
- **Radial Dial Picker** (default, primary design from mockups):
  - Semi-circular arc of values distributed over 130°
  - Centered pointer triangle at top
  - Drag gesture: ~28px per step rotates arc
  - Active value: amber bold; adjacent values fade
  - Tick marks radiate outward (longer for active)
  - Hint: "Swipe to rotate" with arrow icons; dismiss: checkmark button
- **Wheel Picker** (alternate, togglable):
  - Horizontal strip; center line (amber); drag 56px/step; off-center values scale 0.85, fade to 0.25 opacity
- **Grid Sheet Picker** (alternate, for EI values / long lists):
  - Grid layout; 52px min cell height; active: amber glow + border + text
- Picker preference stored in `AppSettings` (radial/wheel/grid)
- **Note sheet** (`BottomSheet`): textarea (4 rows), "Saved with next exposure" hint, Save button
- **Lens picker sheet** (`BottomSheet`): lens list + "No lens" row, checkmark on selected
- Aperture options filtered to ≥ lens.maxAperture (can't use wider than lens allows)
- Focal length: prime lens → chip disabled, shows fixed value; zoom → constrained to [min, max], 5mm snapping

**Tests** (XCUITest): `testOpenAperturePicker`, `testSelectApertureValue`, `testChipUpdates`, `testFullSettingsConfigure`, `testLensFiltersFocalLength`

### Step 4.3 — Focal Length Overlay & Capture Polish
**Deliverable**: Focal length ruler overlay functional; haptics; camera screen feature-complete.
- `FocalLengthOverlay`: ruler at viewfinder bottom, tick marks at 15, 24, 35, 50, 85, 135, 200mm; amber glowing thumb; current value in mm
- Letterbox bars (top + bottom, 20% height each, dark semi-transparent) when focalLength < 24mm
- `LightMeterView`: floating transparent card, "LIGHT METER" label, EV readout (+0.5 EV), -3…+3 scale bar with ticks, green if ≤ 0.34 stops from 0, else amber (simulated from aperture/shutter — EV = log2(N²/t))
- Haptic feedback: `UIImpactFeedbackGenerator` on shutter, `UISelectionFeedbackGenerator` on picker steps
- Camera permission denied state: `EmptyStateView` with "Enable Camera Access" → `UIApplication.open(Settings URL)`

**Tests** (XCUITest): `testFocalLengthOverlayVisible`, `testLetterboxAppearsWideAngle`

---

## Phase 5: Gallery & Exposure Details

### Step 5.1 — Gallery Screen
**Deliverable**: Gallery with strip/grid views, photo library import, copy-previous; XCUITests.
- `GalleryView`: full-screen, from CaptureView or roll card
- Header: back (to capture), export stub (amber), home buttons; "CONTACT SHEET" label; "23/36 · ISO 400 · EI 320"
- Quick actions row: "Resume shooting" (→ CaptureView), "Add from gallery" (→ PHPicker)
- Strip/Grid toggle (two-button container, top-right of header)
- **Strip view**: `LazyVStack` of `ExposureCard`
  - 92×92 image (or gradient placeholder); exposure number overlay (mono)
  - Right: date/time (mono muted), "COPY PREV" button (if not first), EXIF chips, note (truncated)
  - Tap → DetailsView; swipe-to-delete or trash button
- **Grid view**: `LazyVGrid` 3 columns, square cells
  - Gradient image fill; exposure# top-left (white mono shadow); location pin icon if GPS; aperture + shutter bottom-left (white mono)
  - Tap → DetailsView
- Animated transition between strip/grid
- Empty state: `EmptyStateView` with "No exposures yet"
- Film leader at strip end: dashed border, "N EXPOSURES REMAINING" (muted)
- **PHPickerViewController integration**: select photos → `ImageUtils.downscale()` (max 1280px, JPEG 0.75) → get location → save as new Exposure, auto-increment number
- **Copy previous**: copies aperture, shutterSpeed, ei, lensId, focalLength from prior exposure
- Delete exposure with `ConfirmationSheet`
- `GalleryViewModel` (`@Observable`): `@Query` exposures filtered by filmRollId, sorted by exposureNumber

**Tests** (XCUITest): `testGalleryShowsExposures`, `testToggleStripGrid`, `testAddFromPhotoLibrary`, `testCopyPrevious`, `testDeleteExposure`, `testTapToDetails`

### Step 5.2 — Exposure Details Screen
**Deliverable**: Full details viewing and editing; XCUITests.
- `DetailsView`: full-screen navigation push from GalleryView
- Header: back, Edit toggle button, Delete button (red)
- **Hero image** (4:3, full width): `Image` fill; if nil → seeded gradient
  - Film perforation bar top (dark semi-transparent 12px): roll name left, "23A → 23" right (mono)
  - Film perforation bar bottom: "ISO 400" left, date "05.14.26" right (mono)
- **2×2 readout tiles** (`ReadoutTile`): Aperture, Shutter, EI, Focal
  - surface-1 bg, hairline border, md radius; label small muted, value large amber mono
  - Muted/dimmed if EI or Focal not set
- **Metadata card** (surface-1, lg radius): rows with icon + label + value, hairline dividers
  - Lens, Camera, Captured (full date/time), Location (lat/long or "—")
- **Notes section**: read mode (surface-1 box, tap to edit), inline edit mode (textarea + Cancel/Save)
- **Edit mode** (header toggle):
  - Lens picker, Aperture selector, Shutter selector, EI selector, Focal slider (all enabled)
  - Image overlay: Camera button + Gallery button
  - Replacing image (camera or PHPicker) → `ImageUtils.downscale()` (max 1280px, JPEG 0.75) before saving, same as initial capture
  - Save / Cancel in header
- `ExposureViewModel` (`@Observable`): manages edit state

**Tests** (XCUITest): `testViewExposureDetails`, `testEditNotes`, `testEditMetadata`, `testReplaceImageFromLibrary`, `testDeleteExposureFromDetails`

---

## Phase 6: Import/Export & Polish

### Step 6.1 — Export
**Deliverable**: Export produces correct JSON format; XCUITests verify sheet and share trigger.
- Export button in GalleryView header → `ExportSheet` (`BottomSheet`)
- Options (radio-style chips):
  1. **JSON metadata only**: `{ filmRoll, exposures[], exportedAt, version: "2.0.0" }` without images → `UIActivityViewController`
  2. **JSON with images**: same + base64 imageData per exposure; warn if >10MB → `UIActivityViewController`
  3. **Multi-file** (folder): metadata.json + `exposure_N_ID.jpg` files → zip → `UIActivityViewController`
- Format matches PWA `exportImport.ts` exactly (Python `apply_filmroll_metadata.py` compatibility)
- `ExportService`: pure Swift, no UI dependencies

**Tests** (XCUITest): `testExportSheetOpens`, `testExportJSONOnlyTriggersShare`, `testExportWithImagesTriggersShare`

### Step 6.2 — Import
**Deliverable**: Import from files produces correct [IMPORTED]-prefixed film roll; XCUITests.
- Import sheet (FAB menu + header button) → options:
  1. **JSON with images**: `UIDocumentPickerViewController` (single JSON file) → parse → extract base64 images → `ImageUtils.downscale()` each → create film roll with `[IMPORTED]` prefix
  2. **Local folder**: `UIDocumentPickerViewController` (multi-file select) → find metadata.json + match image files → `ImageUtils.downscale()` each image file before saving
- Validation: missing fields, bad JSON, source image file > 50MB (reject before decode)
- Error alert for malformed imports
- `ImportService`: pure Swift

**Tests** (XCUITest): `testImportJSONWithImages` (inject test fixture file), `testImportedRollAppearsWithPrefix`, `testImportPreservesAllMetadata`, `testMultipleImports`

### Step 6.3 — Settings, App Icon & Final Polish
**Deliverable**: App fully feature-complete; all XCUITests pass on simulator.
- Settings sheet (header button in Rolls tab):
  - **Sync**: Google Drive row (disabled, shows "Coming soon"), auto-sync toggle (disabled)
  - **Capture**: "Rule-of-thirds grid" toggle, "Location" toggle, "Haptic feedback" toggle
  - **Data**: "Export all rolls" (triggers multi-roll export), "Import archive", "Clear all data" (ConfirmationSheet)
  - **About**: version string (from Bundle), "Open source" link
- App icon: amber-accented film canister / camera icon (all required sizes via Asset Catalog)
- Launch screen: dark bg `#0a0a0b`, amber film tracker wordmark centered
- Light/dark theme: `@Environment(\.colorScheme)` throughout — light theme uses `#f5f5f7` bg, same accent
- Final XCUITest regression sweep:
  - `AppNavigationTests`: tabs, empty states, settings
  - `EquipmentManagementTests`: camera + lens CRUD
  - `FilmRollManagementTests`: roll CRUD, filters
  - `CaptureWorkflowTests`: navigate to capture, configure settings, frame counter
  - `GalleryTests`: strip/grid, import, details
  - `ImportExportTests`: round-trip JSON

**Tests** (XCUITest): `testSettingsToggles`, `testClearAllDataConfirmation`, `testFullNavigationFlow`

---

## File Structure
```
ios/
├── global-plan.md                    ← this file
├── FilmTracker.xcodeproj
└── FilmTracker/
    ├── App/
    │   ├── FilmTrackerApp.swift      # ModelContainer, app entry
    │   └── ContentView.swift         # TabView root
    ├── Models/                        # SwiftData @Model
    │   ├── Camera.swift
    │   ├── Lens.swift
    │   ├── FilmRoll.swift
    │   ├── Exposure.swift
    │   └── AppSettings.swift
    ├── DesignSystem/
    │   ├── Colors.swift
    │   ├── Typography.swift
    │   └── Constants.swift           # Spacing, radius, apertures[], shutterSpeeds[], eiValues[]
    ├── Components/
    │   ├── AppButton.swift
    │   ├── AppChip.swift
    │   ├── AppCard.swift
    │   ├── BottomSheet.swift
    │   ├── EmptyStateView.swift
    │   ├── ConfirmationSheet.swift
    │   └── EntityRow.swift
    ├── Screens/
    │   ├── Rolls/
    │   │   ├── RollsView.swift
    │   │   ├── RollCard.swift
    │   │   ├── CreateRollSheet.swift
    │   │   ├── FilterPillsView.swift
    │   │   └── FABMenu.swift
    │   ├── Equipment/
    │   │   ├── EquipmentView.swift
    │   │   ├── CameraListView.swift
    │   │   ├── LensListView.swift
    │   │   ├── CreateCameraSheet.swift
    │   │   └── CreateLensSheet.swift
    │   ├── Capture/
    │   │   ├── CaptureView.swift
    │   │   ├── FocalLengthOverlay.swift
    │   │   ├── LightMeterView.swift
    │   │   ├── NoteSheet.swift
    │   │   ├── LensPickerSheet.swift
    │   │   └── Pickers/
    │   │       ├── SettingsChipsRow.swift
    │   │       ├── RadialDialPicker.swift
    │   │       ├── WheelPickerView.swift
    │   │       └── GridSheetPicker.swift
    │   ├── Gallery/
    │   │   ├── GalleryView.swift
    │   │   ├── ExposureStripCard.swift
    │   │   ├── ExposureGridCell.swift
    │   │   └── ExportSheet.swift
    │   ├── Details/
    │   │   ├── DetailsView.swift
    │   │   └── ReadoutTile.swift
    │   └── Settings/
    │       └── SettingsView.swift
    ├── ViewModels/
    │   ├── RollsViewModel.swift
    │   ├── CameraViewModel.swift
    │   ├── LensViewModel.swift
    │   ├── CaptureViewModel.swift
    │   ├── GalleryViewModel.swift
    │   └── ExposureViewModel.swift
    ├── Services/
    │   ├── CameraService.swift       # AVFoundation
    │   ├── LocationService.swift     # CoreLocation
    │   ├── ExportService.swift
    │   └── ImportService.swift
    ├── Utils/
    │   └── ImageUtils.swift          # downscale(UIImage/Data) → JPEG Data, max 1280px, quality 0.75
    └── FilmTrackerTests/             # XCUITest target
        ├── AppNavigationTests.swift
        ├── EquipmentManagementTests.swift
        ├── FilmRollManagementTests.swift
        ├── CaptureWorkflowTests.swift
        ├── GalleryTests.swift
        └── ImportExportTests.swift
```

---

## Verification Per Step
Each step: `xcodebuild test -scheme FilmTracker -destination 'platform=iOS Simulator,name=iPhone 16'`  
Final: all XCUITests pass on iPhone 16 simulator; PWA `npm run test:e2e` unchanged (no PWA changes made).

## Key Design Decisions
- **SwiftData over Core Data**: cleaner Swift-native API, `@Model` macro, works with `@Observable`
- **iOS 17 minimum**: enables SwiftData, `@Observable`, newer SwiftUI APIs
- **No UIKit screens**: 100% SwiftUI for maintainability
- **Radial dial as primary picker**: novel UX differentiator from the mockup design, not in PWA
- **Dark-first theme**: matches film darkroom aesthetic; light theme supported via `colorScheme`
- **Export format compatibility**: matches PWA v2.0.0 format so Python `apply_filmroll_metadata.py` script works unchanged
- **Image storage strategy**: `@Attribute(.externalStorage)` on `Exposure.imageData` keeps JPEG bytes out of the SQLite store; all images downscaled to max 1280px / JPEG 0.75 at ingestion (camera, PHPicker, import) via shared `ImageUtils`, keeping a 36-frame JSON-with-images export comfortably under 10 MB
