# Done: Image Scaling & Gallery Upload UX (F-3)

## Overview
Unified image scaling for camera captures and gallery uploads (max 1280px), moved gallery upload from camera to gallery screen, added scroll position preservation.

## Key Components
- **Image scaling utility** (`scaleImageFile()`) - scales/compresses uploaded images to match camera captures
- **Gallery upload relocation** - moved from CameraScreen to GalleryScreen
- **Scroll position preservation** - maintains scroll state when returning to gallery
- **E2E test coverage** - comprehensive image upload tests

## Implementation Details

### Files Changed
- `src/utils/camera.ts` (+82 lines) - Added `scaleImageFile()` with validation, scaling, compression
- `src/components/CameraScreen.tsx` (-88 lines) - Removed gallery upload button/logic
- `src/components/GalleryScreen.tsx` (refactored) - Added gallery upload FAB, scroll position preservation
- `src/components/DetailsScreen.tsx` (1 line) - Updated to use `scaleImageFile()`
- `src/App.tsx` (+3 lines) - State updates for gallery upload flow
- `e2e/image-upload.spec.ts` (+167 lines) - New test file for upload scenarios
- `e2e/utils/page-objects.ts` (+8 lines) - Added gallery upload helper
- `CLAUDE.md` (+19 lines) - Added testing requirements section

### Technical Details
- **Scaling logic**: Max 1280px, preserves aspect ratio, JPEG quality 0.7 (large) / 0.8 (small)
- **Validation**: 10MB file size limit, image type check
- **Performance**: URL.createObjectURL with proper cleanup
- **Scroll preservation**: Saves/restores `scrollTop` on gallery navigation

## User Benefits
- **Consistent storage**: Gallery uploads now same size as camera captures (~200-400KB)
- **Better UX**: Gallery button on gallery screen (more intuitive)
- **Scroll preservation**: Returns to same position after viewing exposure details
- **Better performance**: Smaller images load faster, especially on mobile

## Testing Coverage
- Gallery upload (camera screen removed, gallery screen working)
- Image scaling verification (high-res images downscaled to 1280px)
- Details screen image replacement
- Scroll position preservation after navigation
- File validation (size, type, invalid files)

## Commits
```
3ec1d58 feat: remove gallery button from camera screen, add Add from gallery to gallery screen
a769872 fix: scroll position preservation
833ea86 test: fix tests
```

Merged: PR #9 (Feb 19, 2026)
