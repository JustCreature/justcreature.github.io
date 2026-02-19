# Feature F-2: JSON-with-Images Export/Import Format

**Status:** ✅ Completed
**Branch:** `F-2`
**Completion Date:** 2026-02-19

## Overview

Single-file export/import format that embeds all images as base64 in JSON. Eliminates multi-file management, simplifies sharing via messaging apps. Imported film rolls prefixed with "[IMPORTED]".

## Key Components

### 1. New Export Format

**Type Definitions** (`src/types.ts`):
- `ExportDataWithImages` - Format container with `exportType: 'with-images'`
- `ExposureWithImageData` - Exposure with embedded base64 `imageData`

**Export Method** (`src/utils/exportImport.ts`):
- `exportJsonWithImages()` - Creates single JSON file with embedded images
- File size estimation with 10MB warning
- Filename: `{filmroll}_with_images.json`

### 2. Import Functionality

**Import Method** (`src/utils/exportImport.ts`):
- `importJsonWithImages()` - Validates format, adds "[IMPORTED]" prefix
- Format validation ensures `exportType === 'with-images'`
- Converts ISO date strings back to Date objects

**State Management**:
- Uses `handleDataImported()` callback
- Updates state immediately (no reload needed)
- Auto-navigates to gallery screen showing imported data

### 3. UI Integration

**Film Rolls Screen** (`src/components/FilmRollListScreen.tsx`):
- Import button in toolbar
- Import dialog with 3 methods: Local Files, JSON with Images, Google Drive
- Hidden file inputs for each method
- Proper async/await with loading states

**Gallery Screen** (`src/components/GalleryScreen.tsx`):
- Import/Export buttons
- 4 export methods: Local, JSON Only, JSON with Images, Google Drive
- Folder name field disabled for single-file exports
- Help text explains each method

### 4. E2E Testing

**New Test Suite** (`e2e/import-export.spec.ts`):
- 8 test cases covering:
  - Import from main screen with navigation verification
  - "[IMPORTED]" prefix display
  - Film roll list visibility after import
  - Multiple imports
  - High exposure count (10+)
  - Metadata preservation
  - UI element visibility

**Test Helpers** (`e2e/utils/`):
- `page-objects.ts` - Import dialog getters, `importJsonWithImages()` helper
- `test-data.ts` - `generateExportData.jsonWithImages()` with 1x1 PNG base64

## Technical Details

### Files Changed (7 files)

**Added:**
- `e2e/import-export.spec.ts` (~185 lines)

**Modified:**
- `src/types.ts` - New interfaces (~28 lines)
- `src/utils/exportImport.ts` - Export/import methods (~138 lines)
- `src/components/FilmRollListScreen.tsx` - Import UI (~120 lines)
- `src/components/GalleryScreen.tsx` - Export UI (~50 lines)
- `src/components/MainScreen.tsx` - Pass callback (~3 lines)
- `src/App.tsx` - Wire callback (~1 line)
- `e2e/utils/page-objects.ts` - Test helpers (~65 lines)
- `e2e/utils/test-data.ts` - Test data generator (~45 lines)
- `CLAUDE.md` - Git workflow note (~3 lines)

**Net Impact:** ~638 lines added

## User Benefits

1. **Single File Sharing:** One JSON file via Telegram, WhatsApp, email
2. **No File Loss:** All images embedded, no loose files to track
3. **Instant Feedback:** Auto-navigation to gallery shows imported data immediately
4. **Size Awareness:** 10MB warning prevents accidental large downloads
5. **Backward Compatible:** Existing export methods still work

## Trade-offs

- ~33% larger files (base64 overhead)
- Slower for many/large images
- Not ideal for external tools (use "Local" export for Python script)

## Testing

**E2E Coverage:**
- Import flow from main screen
- Navigation after import
- State updates without reload
- Multiple imports
- Metadata preservation
- Cross-browser (5 browsers)

**Manual Testing Checklist:**
- [x] Export JSON with images (with/without size warning)
- [x] Import JSON with images from main screen
- [x] Import JSON with images from gallery screen
- [x] Verify "[IMPORTED]" prefix
- [x] Verify all exposures visible
- [x] Verify metadata preserved (aperture, shutter, notes, focal length, EI)
- [x] Multiple imports work
- [x] Film rolls appear in list after import

## Migration Notes

- Fully backward compatible
- New `exportType` field distinguishes format
- Existing exports unaffected
- Version stays at "2.0.0" (same data structure)

## Commits

```
feat: add JSON with Images export/import format

Adds a new export/import format that embeds all images directly in a single
JSON file, eliminating the need to manage multiple files. Film rolls imported
using this format are prefixed with "[IMPORTED]".

- Add ExportDataWithImages and ExposureWithImageData types
- Implement exportJsonWithImages method with file size warnings (>10MB)
- Implement importJsonWithImages method with format validation
- Update GalleryScreen UI with new export/import options
- Add file size estimation to warn users before large exports
- Maintain backward compatibility with existing export formats
```
