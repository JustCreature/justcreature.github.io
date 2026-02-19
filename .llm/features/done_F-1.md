# Feature F-1: Advanced Lens Management & Smart Focal Length System

**Status:** ✅ Completed
**Branch:** `new_features`
**Completion Date:** 2026-02-17

## Overview

This feature introduces comprehensive lens management capabilities and intelligent focal length tracking with dynamic UI controls that adapt to lens type (prime vs zoom).

## Key Components

### 1. Lens Management System

#### Lens Model
Added new `Lens` interface to support both prime and zoom lenses:

```typescript
interface Lens {
    id: string;
    name: string;
    maxAperture: string;           // e.g., "f/1.4", "f/2.8"
    focalLength?: number;           // For prime lenses (e.g., 50)
    focalLengthMin?: number;        // For zoom lenses (e.g., 24)
    focalLengthMax?: number;        // For zoom lenses (e.g., 70)
    createdAt: Date;
}
```

#### Lens Management Screen
- **New Component:** `src/components/LensManagementScreen.tsx`
- Full CRUD operations for lens library
- Validation: Prevents creating lenses that are both prime AND zoom
- Auto-disabling fields: Prime/zoom fields disable each other
- Material-UI Alert component for inline validation errors
- Grid layout with lens cards showing:
  - Lens name
  - Max aperture
  - Focal length (single value for prime, range for zoom)

### 2. Exposure Index (EI) Override

Added ability to override film ISO on a per-exposure basis:

- New `ei` field in `Exposure` type (optional number)
- EI selector in camera settings with:
  - "Use film ISO" default option
  - Preset values (50, 100, 200, 400, 800, 1600, 3200, 6400)
  - Custom value input for non-standard EI values
- Exports include EI data for EXIF writing

### 3. Smart Focal Length Slider

#### Reusable Component
- **New Component:** `src/components/FocalLengthSlider.tsx`
- Extracted from duplicated code in CameraScreen and DetailsScreen
- Saved ~220 lines of code through component reuse

#### Dynamic Behavior Based on Lens Type

**No Lens Selected:**
- Full slider range: 1-200mm
- Step: 1mm
- Fully active and editable
- Manual input field accepts any value

**Prime Lens Selected (e.g., 50mm):**
- Slider locked at lens focal length
- Disabled with grey styling
- Label shows "(Prime lens - fixed)"
- Manual input field disabled
- Auto-sets to lens focal length when lens is selected

**Zoom Lens Selected (e.g., 80-200mm):**
- Full slider range visible (1-200mm)
- Movement constrained to zoom range (can't slide below 80mm or above 200mm)
- Step: 5mm for easier zoom adjustment
- Label shows zoom range: "(80-200mm zoom)"
- Manual input field constrained to zoom range
- Auto-sets to midpoint when lens is selected (rounded to nearest 5mm)

#### Slider UI Features
- Common focal length marks: 1, 28, 50, 85, 135, 200
- No "mm" suffix on labels (cleaner look)
- Value indicator tooltip while dragging
- Smooth constraint handling (can't drag outside allowed range)

### 4. Mid-Roll Lens Changes

Users can now change lenses mid-roll:

- **Film Roll Level:** `currentLensId` field tracks active lens
- **Exposure Level:** Each exposure stores its own `lensId`
- Lens selection in camera settings updates film roll's current lens
- Lens change dialog accessible from camera screen
- New exposures automatically use currently selected lens

### 5. Aperture Filtering by Lens

Aperture dropdown now respects lens maximum aperture:

- If lens has max aperture of f/2.8, only shows f/2.8 through f/22
- Prevents selecting physically impossible apertures
- Works in both camera screen and details/editing screen

### 6. Enhanced Export/Import

Updated metadata export format to v2.0.0:

```json
{
  "version": "2.0.0",
  "filmRoll": {
    "ei": 400,
    "currentLensId": "lens-id"
  },
  "exposures": [
    {
      "ei": 400,
      "lensId": "lens-id",
      "lensName": "Helios 44-2",  // Denormalized for external tools
      "focalLength": 58,
      "aperture": "f/2",
      "shutterSpeed": "1/125"
      // ... other fields
    }
  ]
}
```

**Denormalized Lens Name:**
- Each exposure includes `lensName` for easier external tool usage
- Python metadata script reads lens name directly from exposure
- No need to look up lens by ID in external tools

### 7. Python Metadata Script Updates

Updated `apply_filmroll_metadata.py` to support:
- EI override (uses EI if set, falls back to film ISO)
- Lens name from exposure data
- Per-exposure focal length
- All data properly written to TIF file EXIF tags

### 8. Storage Updates

**IndexedDB:**
- Added `lenses` object store
- Migration support for new lens-related fields
- Proper serialization/deserialization of lens data

**Storage API:**
- `saveLens(lens: Lens): Promise<void>`
- `getLenses(): Promise<Lens[]>`
- `deleteLens(id: string): Promise<void>`

### 9. UI/UX Improvements

**Three-Tab Navigation:**
- Film Rolls (existing)
- Cameras (existing)
- **Lenses (new)** - Flat top-level navigation

**Material-UI Alerts:**
- Replaced all `alert()` calls with inline MUI Alert components
- Better UX with dismissible error messages
- Consistent styling with app theme

**Settings Dialog Enhancement:**
- Lens selector dropdown
- EI/Exposure Index selector
- Focal length slider with lens-aware behavior
- All settings in one place

## Testing

### E2E Test Coverage

**New Test Suite:**
- `e2e/lens-management.spec.ts` - 62 new lines
- Lens CRUD operations
- Prime vs zoom lens validation
- Aperture filtering
- Mid-roll lens changes

**Updated Test Suites:**
- `e2e/app-navigation.spec.ts` - Added lens tab navigation
- `e2e/photography-workflow.spec.ts` - Lens integration tests
- `e2e/utils/page-objects.ts` - Lens management page objects
- `e2e/utils/test-data.ts` - Test lens data

**CI Integration:**
- E2E tests run on push to main
- Tests across 5 browsers (Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari)

## Technical Details

### Files Changed (27 files)
- **Added:** 3 new files (~750 lines)
  - `src/components/LensManagementScreen.tsx`
  - `src/components/FocalLengthSlider.tsx`
  - `e2e/lens-management.spec.ts`

- **Modified:** 24 files (~1,300 lines added, ~230 removed)
  - Core: App.tsx, types.ts, storage layers
  - Screens: CameraScreen, DetailsScreen, SetupScreen, GalleryScreen, MainScreen
  - Utils: exportImport, indexedDBStorage
  - Tests: Multiple E2E test files

### Net Impact
- **+2,005 lines added**
- **-232 lines removed**
- **Net: +1,773 lines**

## User Benefits

1. **Professional Lens Library:** Track all lenses in one place
2. **Accurate Metadata:** Focal length and lens info in every exposure
3. **Smart Constraints:** UI prevents invalid settings (e.g., f/1.4 on f/2.8 lens)
4. **Flexible Workflows:** Change lenses mid-roll, override ISO with EI
5. **Export-Ready:** All metadata properly formatted for EXIF tools
6. **Better UX:** Inline errors, adaptive controls, cleaner interface

## Migration Notes

- **Backward Compatible:** Existing exposures without lens data work fine
- **Automatic Migration:** IndexedDB migration handles schema updates
- **Export Version:** New exports use v2.0.0 format, old format still importable

## Future Enhancements (Potential)

- [ ] Lens image/photo upload
- [ ] Lens rental tracking (date ranges)
- [ ] Lens maintenance notes
- [ ] Filter exposures by lens
- [ ] Lens usage statistics
- [ ] Import lens library from external sources

## Related Documentation

- See `CLAUDE.md` for updated project architecture
- See `apply_filmroll_metadata.py` docstrings for EXIF details
- See E2E tests for usage examples

## Commits

```
e5dbab3 refactor: extract focal legth slider to a component
f20a6e1 fix: fix slider
ff17643 fix: fix focal legth locked to available values
015dfb1 ci: add e2e tests to ci
8243421 test: fix e2e tests
4e9287c test: fix e2e tests
2155c02 feat: add lenses, add EI, add focal length
```
