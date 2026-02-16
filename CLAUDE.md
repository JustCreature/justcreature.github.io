# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Film Photography Tracker is a Progressive Web App (PWA) for tracking film photography metadata. Built with React 18, TypeScript, Vite, and Material-UI, it helps photographers record and organize shots with exposure details, location data, and camera information.

## Key Commands

### Development
```bash
npm run dev          # Start development server (http://localhost:5173 or https if certs exist)
npm run build        # Build for production (outputs to dist/)
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Version Management
```bash
npm run version:patch   # Bump patch version
npm run version:minor   # Bump minor version
npm run version:major   # Bump major version
```

### Testing
```bash
npm run test:e2e           # Run Playwright E2E tests
npm run test:e2e:ui        # Run E2E tests with Playwright UI
npm run test:e2e:headed    # Run E2E tests in headed mode
npm run test:e2e:debug     # Debug E2E tests
npm run test:e2e:report    # Show test report
```

### Python Metadata Script
```bash
python apply_filmroll_metadata.py <folder_path>   # Apply film roll metadata to TIF files using exiftool
# Or on Windows:
apply.cmd <folder_path>                           # Windows wrapper for Python script
```

The Python script reads exported JSON metadata and applies it to scanned TIF files using exiftool. It matches exposures to TIF files in order and writes EXIF tags including:
- Aperture, shutter speed, ISO/EI
- GPS location (lat/long)
- Camera make/model
- **Lens info** (uses `lensName` from JSON if available)
- **Focal length** (uses exposure-specific value if set)
- Capture date/time
- User notes

**v2.0.0 Support**: Script now uses EI if set (overrides film ISO), lens name per exposure, and focal length per exposure.

## Project Structure

```
src/
├── components/                    # React components
│   ├── MainScreen.tsx            # Tabbed interface (Film Rolls & Cameras tabs)
│   ├── FilmRollListScreen.tsx    # Film roll list and management
│   ├── CameraManagementScreen.tsx # Camera equipment management
│   ├── SetupScreen.tsx           # Film roll configuration
│   ├── CameraScreen.tsx          # Photo capture interface
│   ├── GalleryScreen.tsx         # Exposure list view with import/export
│   ├── DetailsScreen.tsx         # Individual exposure details/editing
│   ├── SettingsModal.tsx         # App settings (Google Drive, etc.)
│   └── ItemCard.tsx              # Reusable card component
├── utils/                        # Utility functions
│   ├── storage.ts               # Storage facade (async API wrapper)
│   ├── indexedDBStorage.ts      # IndexedDB implementation with migration
│   ├── exportImport.ts          # Export/Import functionality
│   ├── googleDriveService.ts    # Google Drive integration (placeholder)
│   └── camera.ts                # Camera, geolocation, and file utilities
├── types.ts                     # TypeScript type definitions
├── App.tsx                      # Main application component (state management)
└── main.tsx                     # React entry point
```

## Architecture

### Storage System

The app uses a **two-layer storage architecture**:

1. **IndexedDB Layer** (`src/utils/indexedDBStorage.ts`)
   - Primary storage with high capacity (50MB+)
   - Object stores: filmRolls, exposures, cameras, settings, currentFilmRoll
   - Handles automatic migration from localStorage on first run
   - All date fields are serialized/deserialized properly

2. **Storage Facade** (`src/utils/storage.ts`)
   - Simple async API wrapper around IndexedDB
   - No caching or fallbacks - pure IndexedDB operations
   - All methods are async and return Promises
   - Must call `storage.initialize()` before use (done in App.tsx on mount)

**Important**: The app previously used localStorage but migrated to IndexedDB. The migration happens automatically on first load via `indexedDBStorage.migrateFromLocalStorage()`.

### Application State

State is managed in `App.tsx` using React hooks (no Redux or external state management):

- **AppState** contains: currentFilmRoll, filmRolls, cameras, exposures, currentScreen, selectedExposure, settings
- Screen navigation via `currentScreen` enum: 'filmrolls' | 'setup' | 'camera' | 'gallery' | 'details'
- All storage operations go through async `storage` API and update local state on success
- Settings include Google Drive integration (currently disabled during storage migration)

### Data Model (src/types.ts)

Core entities:
- **Camera**: Equipment definition (make, model, lens, auto-generated name)
- **FilmRoll**: Film configuration (name, ISO, totalExposures, cameraId link)
- **Exposure**: Individual shots (filmRollId link, exposure number, aperture, shutter speed, location, imageData as base64, capturedAt timestamp)
- **AppSettings**: Google Drive settings, version

### Screen Flow

1. **MainScreen** - Tabbed interface with Film Rolls and Cameras management tabs
2. **SetupScreen** - Create new film roll with camera selection
3. **CameraScreen** - Photo capture with camera API or file picker, exposure settings chips (aperture, shutter, notes)
4. **GalleryScreen** - Grid view of all exposures for current film roll, import/export functionality
5. **DetailsScreen** - Full-screen photo view with editable metadata

### PWA Configuration

- Uses `vite-plugin-pwa` with **injectManifest** strategy (custom service worker at `public/sw.js`)
- **Manual update prompt** - registerType: 'prompt' prevents automatic updates to preserve user data
- Service worker uses NetworkFirst caching strategy for offline support
- Update notification shown in App.tsx via Snackbar with user confirmation
- HTTPS support via local certificates (localhost+4.pem) for camera API access

### Import/Export System

Located in `src/utils/exportImport.ts`:

**Export Format (v2.0.0):**
- `metadata.json`: Contains film roll info, exposures array, exportedAt timestamp, version
  - FilmRoll includes: `ei` (Exposure Index), `currentLensId`
  - Each exposure includes:
    - Core: aperture, shutterSpeed, additionalInfo, location, capturedAt
    - **New in v2.0.0**: `ei`, `lensId`, `lensName` (denormalized), `focalLength`
- `exposure_X_ID.jpg`: Individual photos with numbered naming (X = exposure number)
- All files organized in a single folder for easy management

**Export Methods:**
- **Local Download**: Downloads all files to device (staggered by 500ms to avoid browser limits)
- **JSON Only**: Exports metadata.json with Web Share API on mobile, regular download on desktop
- **Google Drive**: Placeholder implementation (requires API setup)

**Import Methods:**
- **Local Files**: Select folder contents via file input, reads metadata.json and reconstructs exposures
- **Google Drive**: Placeholder implementation (requires API setup)

**Important Details:**
- Images stored as base64 data URLs in IndexedDB
- Export creates separate files; import reads them back
- FileReader used for file-to-base64 conversion with 10MB size limit
- Dates converted between Date objects and ISO strings during export/import
- **Lens name denormalized** in export for easier external tool usage (Python script)

## Key Features

### Photo Capture & Settings
- Live camera view with MediaDevices API
- Fallback camera constraints (tries rear camera first, then front, then basic)
- Gallery file picker for existing photos
- Exposure settings: aperture (f/1.4 to f/22), shutter speed (1/4000 to BULB), notes
- Automatic location capture with Geolocation API (10min cache, high accuracy)
- Exposure counter with remaining shots display

### Camera Management
- Define equipment: make, model, lens
- Auto-generated camera names (e.g., "Zenit ET, Helios 44-2 58mm f/2")
- Link cameras to film rolls
- CRUD operations for camera library

### Data Persistence & Privacy
- **100% Local Storage**: All data stays on device via IndexedDB
- **No Server Communication**: App works completely offline
- **No Tracking**: No analytics or data collection
- **Permission-Based**: Camera and location require user consent
- **Offline-First PWA**: Installation, offline support, service worker caching

## Development Notes

### HTTPS for Camera Access
Modern browsers require HTTPS for camera API access. The project includes localhost SSL certificates (localhost+4.pem, localhost+4-key.pem). Vite detects these and enables HTTPS automatically.

### Camera Utilities (src/utils/camera.ts)
- **camera.isSupported()**: Checks MediaDevices API and secure context
- **camera.getMediaStream()**: Tries multiple constraint sets for maximum compatibility
- **camera.captureImage()**: Captures from video element, limits to 1280px, JPEG quality 0.7-0.8
- **geolocation.getCurrentPosition()**: High accuracy, 10s timeout, 10min cache
- **fileUtils.fileToBase64()**: Converts File to base64 with 10MB limit and type validation

### Date Handling
All Date fields (createdAt, capturedAt, lastSyncTime) are stored as Date objects in memory but serialized as ISO strings in IndexedDB. The storage layer handles conversion automatically.

### Exposure Settings State
Current aperture, shutter speed, and additionalInfo are maintained separately in App.tsx (`exposureSettings` state) and passed to CameraScreen. This allows settings to persist across multiple shots within the same session.

### Material-UI Theme
Global theme defined in App.tsx with primary color #1976d2 (blue) and secondary #dc004e (pink).

### TypeScript Configuration
- Strict mode enabled
- Separate configs: tsconfig.app.json (app code), tsconfig.node.json (Vite config)
- React 19 type definitions included

## External Dependencies

- **Aperture/Shutter Constants**: Pre-defined values in types.ts (APERTURE, SHUTTER_SPEED enums)
- **Geolocation API**: Browser API for GPS coordinates
- **MediaDevices API**: Browser API for camera access
- **Web Share API**: For mobile sharing (in GalleryScreen)
- **exiftool**: External tool (v13.38) required for Python metadata script

## Common Patterns

### Creating New Entities
1. Generate unique ID (Date.now().toString())
2. Call storage method (e.g., `await storage.saveFilmRoll(filmRoll)`)
3. Update local state immutably
4. Handle errors with try/catch and user alerts

### Updating Exposures
Exposures are identified by ID. When updating, always:
1. Save to storage first: `await storage.saveExposure(exposure)`
2. Update state by mapping over array: `exposures.map(e => e.id === exposure.id ? exposure : e)`

### Screen Navigation
Use `navigateToScreen(screen, exposure?)` helper in App.tsx which updates both currentScreen and selectedExposure.

## Browser Compatibility

- **Camera Access**: Chrome 53+, Firefox 36+, Safari 11+
- **PWA Features**: Chrome 40+, Firefox 44+, Safari 11.1+
- **IndexedDB**: All modern browsers
- **Geolocation**: All modern browsers
- **Web Share API**: Mobile browsers (Chrome Android 61+, Safari iOS 12.2+)

## Google Drive Integration (Optional)

The app has placeholder code for Google Drive integration but it requires setup:

1. **Create Google Cloud Project** at console.cloud.google.com
2. **Enable Google Drive API** in APIs & Services > Library
3. **Create Credentials** (API Key restricted to Google Drive API)
4. **Add Google APIs JavaScript Client** to index.html:
   ```html
   <script src="https://apis.google.com/js/api.js"></script>
   ```
5. **Implement authentication flow** in `src/utils/googleDriveService.ts`
6. **Handle OAuth redirect** in App.tsx (code present but disabled)

**Note**: Without Google Drive setup, all import/export uses local file downloads.

## Deployment

The app is configured for static hosting (Vercel, Netlify, GitHub Pages). Build output goes to `dist/`:

```bash
npm run build                              # Build for production
npx vercel --prod                         # Deploy to Vercel
npx netlify deploy --prod --dir=dist      # Deploy to Netlify
```

PWA manifest and service worker are automatically generated during build.

## Planned Features (Currently Disabled)

- Google Drive sync (SyncManager commented out in App.tsx)
- Automatic cloud backup (awaiting storage migration completion)
- OAuth authentication flow (placeholder exists in App.tsx)
