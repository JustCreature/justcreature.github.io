# Plan: JSON-with-Images Export/Import Feature (F-2)

## Overview
Add a new export/import format that embeds all images directly in a single JSON file, eliminating the need to manage multiple files. Film rolls imported using this format will be prefixed with "[IMPORTED]".

## User Choices
- Keep existing "JSON Only" option and add "JSON with Images" as 4th export method
- Use separate import options: "Import from Local Files" (multi-file) and "Import JSON with Images" (single-file)
- Show file size warning (with estimated size) before exporting if JSON will be >10MB

## Implementation Details

### 1. Type Definitions (`src/types.ts`)

Add new export format interface after the existing `ExposureExportData`:

```typescript
export interface ExportDataWithImages {
    filmRoll: FilmRoll;
    exposures: ExposureWithImageData[];
    exportedAt: string;
    version: string;
    exportType: 'with-images';
}

export interface ExposureWithImageData {
    id: string;
    filmRollId: string;
    exposureNumber: number;
    aperture: string;
    shutterSpeed: string;
    additionalInfo: string;
    imageData?: string; // Base64 data URL embedded directly
    location?: {
        latitude: number;
        longitude: number;
        address?: string;
    };
    capturedAt: string;
    ei?: number;
    lensId?: string;
    lensName?: string;
    focalLength?: number;
}
```

### 2. Export/Import Logic (`src/utils/exportImport.ts`)

**Add helper function to estimate file size:**
```typescript
// Add at top level, before exportUtils object
const estimateExportSize = (filmRoll: FilmRoll, exposures: Exposure[]): number => {
    const filmExposures = exposures.filter(e => e.filmRollId === filmRoll.id);
    let totalSize = 0;

    // Estimate base64 image sizes
    filmExposures.forEach(exp => {
        if (exp.imageData) {
            // Base64 data URL format: data:image/jpeg;base64,<data>
            // Extract just the base64 part to get accurate size
            const base64Data = exp.imageData.split(',')[1] || '';
            totalSize += base64Data.length;
        }
    });

    // Add overhead for JSON structure (~5KB per exposure)
    totalSize += filmExposures.length * 5000;

    return totalSize;
};
```

**Add export method to exportUtils object (after exportJsonOnly):**
```typescript
exportJsonWithImages: async (filmRoll: FilmRoll, exposures: Exposure[], lenses: Lens[]): Promise<void> => {
    try {
        const filmExposures = exposures.filter(e => e.filmRollId === filmRoll.id);

        // Check file size and warn user if >10MB
        const estimatedSize = estimateExportSize(filmRoll, exposures);
        const sizeMB = (estimatedSize / (1024 * 1024)).toFixed(1);

        if (estimatedSize > 10 * 1024 * 1024) {
            const confirmDownload = window.confirm(
                `This export will be approximately ${sizeMB} MB.\n\n` +
                `Large files may take time to download, especially on mobile data.\n\n` +
                `Continue with export?`
            );

            if (!confirmDownload) {
                return;
            }
        }

        // Prepare export data with embedded images
        const exportExposures: ExposureWithImageData[] = filmExposures.map(exposure => {
            const lens = lenses.find(l => l.id === exposure.lensId);

            return {
                id: exposure.id,
                filmRollId: exposure.filmRollId,
                exposureNumber: exposure.exposureNumber,
                aperture: exposure.aperture,
                shutterSpeed: exposure.shutterSpeed,
                additionalInfo: exposure.additionalInfo,
                imageData: exposure.imageData, // Include base64 directly
                location: exposure.location,
                capturedAt: exposure.capturedAt.toISOString(),
                ei: exposure.ei,
                lensId: exposure.lensId,
                lensName: lens?.name,
                focalLength: exposure.focalLength
            };
        });

        const exportData: ExportDataWithImages = {
            filmRoll,
            exposures: exportExposures,
            exportedAt: new Date().toISOString(),
            version: '2.0.0',
            exportType: 'with-images'
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        const fileName = `${filmRoll.name.replace(/\s+/g, '_')}_with_images.json`;

        fileUtils.downloadData(jsonString, fileName, 'application/json');

    } catch (error) {
        console.error('JSON with images export error:', error);
        alert('Error during export. The file may be too large. Try exporting with separate files instead.');
    }
},
```

**Add import method to exportUtils object (after importFromLocal):**
```typescript
importJsonWithImages: async (file: File): Promise<{ filmRoll: FilmRoll; exposures: Exposure[] } | null> => {
    try {
        // Read the JSON file
        const jsonText = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });

        const exportData: ExportDataWithImages = JSON.parse(jsonText);

        // Validate format
        if (exportData.exportType !== 'with-images') {
            throw new Error('Invalid format. Please select a JSON file exported with the "JSON with Images" option.');
        }

        // Convert exposures back to internal format
        const exposures: Exposure[] = exportData.exposures.map(exp => ({
            id: exp.id,
            filmRollId: exp.filmRollId,
            exposureNumber: exp.exposureNumber,
            aperture: exp.aperture,
            shutterSpeed: exp.shutterSpeed,
            additionalInfo: exp.additionalInfo,
            imageData: exp.imageData,
            location: exp.location,
            capturedAt: new Date(exp.capturedAt),
            ei: exp.ei,
            lensId: exp.lensId,
            focalLength: exp.focalLength
        }));

        // Prefix film roll name with [IMPORTED]
        const filmRoll: FilmRoll = {
            ...exportData.filmRoll,
            name: `[IMPORTED] ${exportData.filmRoll.name}`,
            createdAt: new Date(exportData.filmRoll.createdAt)
        };

        return { filmRoll, exposures };

    } catch (error) {
        console.error('Import error:', error);
        if (error instanceof Error && error.message.includes('Invalid format')) {
            alert(error.message);
        } else {
            alert('Error during import. Please check that you selected a valid JSON file exported with images.');
        }
        return null;
    }
}
```

**Update the ExportData type export at the top:**
```typescript
// Add this export after the ExportDataWithImages interface
export type { ExportData, ExposureExportData, ExportDataWithImages, ExposureWithImageData };
```

### 3. UI Updates (`src/components/GalleryScreen.tsx`)

**Update state (line 68-69):**
```typescript
const [exportMethod, setExportMethod] = useState<'local' | 'googledrive' | 'jsononly' | 'jsonwithimages'>('local');
const [importMethod, setImportMethod] = useState<'local' | 'googledrive' | 'jsonwithimages'>('local');
```

**Add new ref for JSON-with-images import (after line 71):**
```typescript
const jsonWithImagesInputRef = useRef<HTMLInputElement>(null);
```

**Update handleExport function (replace lines 97-120):**
```typescript
const handleExport = async () => {
    if (exportMethod !== 'jsononly' && exportMethod !== 'jsonwithimages' && !exportFolderName.trim()) {
        alert('Please enter a folder name');
        return;
    }

    setIsProcessing(true);
    try {
        if (exportMethod === 'googledrive') {
            await googleDriveUtils.exportToGoogleDrive(filmRoll, filmExposures, lenses, exportFolderName);
        } else if (exportMethod === 'jsononly') {
            await exportUtils.exportJsonOnly(filmRoll, filmExposures, lenses);
        } else if (exportMethod === 'jsonwithimages') {
            await exportUtils.exportJsonWithImages(filmRoll, filmExposures, lenses);
        } else {
            await exportUtils.exportToLocal(filmRoll, filmExposures, lenses, exportFolderName);
        }
        setShowExportDialog(false);
        setExportFolderName('');
    } catch (error) {
        console.error('Export failed:', error);
        alert('Export failed. Please try again.');
    } finally {
        setIsProcessing(false);
    }
};
```

**Update handleImport function (replace lines 122-150):**
```typescript
const handleImport = async () => {
    setIsProcessing(true);
    try {
        let result: { filmRoll: FilmRoll; exposures: Exposure[] } | null = null;

        if (importMethod === 'googledrive') {
            if (!importFolderName.trim()) {
                alert('Please enter a folder name');
                setIsProcessing(false);
                return;
            }
            result = await googleDriveUtils.importFromGoogleDrive(importFolderName);
        } else if (importMethod === 'jsonwithimages') {
            // Trigger file input for JSON with images
            jsonWithImagesInputRef.current?.click();
            setIsProcessing(false);
            return;
        } else {
            // Trigger file input for local multi-file import
            fileInputRef.current?.click();
            setIsProcessing(false);
            return;
        }

        if (result && onDataImported) {
            // Save imported data
            await storage.saveFilmRoll(result.filmRoll);
            for (const exposure of result.exposures) {
                await storage.saveExposure(exposure);
            }

            onDataImported(result.filmRoll, result.exposures);
            setShowImportDialog(false);
            setImportFolderName('');
        }
    } catch (error) {
        console.error('Import failed:', error);
        alert('Import failed. Please try again.');
    } finally {
        setIsProcessing(false);
    }
};
```

**Add new handler for JSON-with-images file input (after handleFileSelect, around line 160):**
```typescript
const handleJsonWithImagesFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
        const result = await exportUtils.importJsonWithImages(file);

        if (result && onDataImported) {
            // Save imported data
            await storage.saveFilmRoll(result.filmRoll);
            for (const exposure of result.exposures) {
                await storage.saveExposure(exposure);
            }

            onDataImported(result.filmRoll, result.exposures);
            setShowImportDialog(false);
            alert(`Successfully imported film roll: ${result.filmRoll.name}\nExposures: ${result.exposures.length}`);
        }
    } catch (error) {
        console.error('Import failed:', error);
        alert('Import failed. Please check the file and try again.');
    } finally {
        // Reset file input
        event.target.value = '';
    }
};
```

**Update Export Dialog (find the RadioGroup in export dialog, around line 250-280):**

Add 4th radio button after the "JSON Only" option:
```typescript
<FormControlLabel
    value="jsonwithimages"
    control={<Radio />}
    label="JSON with Images"
/>
```

Update the help text below RadioGroup to mention the new option:
```typescript
<Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
    Local: Creates metadata.json + image files<br />
    JSON Only: Metadata without images<br />
    JSON with Images: Single JSON file with embedded images<br />
    Google Drive: Requires API setup
</Typography>
```

Update folder name TextField to disable for both jsononly and jsonwithimages:
```typescript
<TextField
    fullWidth
    label="Folder/File Name"
    value={exportFolderName}
    onChange={(e) => setExportFolderName(e.target.value)}
    disabled={exportMethod === 'jsononly' || exportMethod === 'jsonwithimages'}
    helperText={
        exportMethod === 'jsononly' || exportMethod === 'jsonwithimages'
            ? 'Not needed for single-file export'
            : 'Name for organizing downloaded files'
    }
    sx={{ mt: 2 }}
/>
```

**Update Import Dialog (find the RadioGroup in import dialog, around line 320-340):**

Add 3rd radio button after the "Local" option:
```typescript
<FormControlLabel
    value="jsonwithimages"
    control={<Radio />}
    label="Import JSON with Images"
/>
```

Update the help text:
```typescript
<Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
    Local Files: Select metadata.json + image files<br />
    JSON with Images: Select single JSON file with embedded images<br />
    Google Drive: Requires API setup
</Typography>
```

Update folder name TextField to hide for jsonwithimages:
```typescript
{importMethod !== 'jsonwithimages' && (
    <TextField
        fullWidth
        label={importMethod === 'googledrive' ? 'Folder Name' : 'Select Files'}
        value={importFolderName}
        onChange={(e) => setImportFolderName(e.target.value)}
        disabled={importMethod === 'local'}
        helperText={
            importMethod === 'local'
                ? 'Click Import to select files from your device'
                : 'Enter the exact folder name from Google Drive'
        }
        sx={{ mt: 2 }}
    />
)}
```

**Add hidden file input for JSON-with-images import (after the existing fileInputRef input, around line 380):**
```typescript
<input
    type="file"
    ref={jsonWithImagesInputRef}
    style={{ display: 'none' }}
    accept="application/json"
    onChange={handleJsonWithImagesFileSelect}
/>
```

## Critical Files

1. `src/types.ts` - Add new interfaces for JSON-with-images format
2. `src/utils/exportImport.ts` - Add new export/import methods
3. `src/components/GalleryScreen.tsx` - Update UI with new options and handlers

## Testing & Verification

### Manual Testing Flow:

1. **Export Testing:**
   - Create a film roll with 3-5 exposures (with images)
   - Open Gallery → Export
   - Select "JSON with Images" option
   - Verify folder name field is disabled
   - Click Export
   - If total size >10MB, verify warning dialog appears with size estimate
   - Verify single JSON file downloads with name `{filmroll}_with_images.json`
   - Open the JSON file and verify `exportType: 'with-images'` is present
   - Verify all `imageData` fields contain base64 data URLs

2. **Import Testing:**
   - Open Gallery → Import
   - Select "Import JSON with Images" option
   - Verify folder name field is hidden
   - Click Import and select the exported JSON file
   - Verify film roll appears with "[IMPORTED]" prefix
   - Verify all exposures are restored with images
   - Check that all metadata (aperture, shutter, location, etc.) is preserved

3. **Size Warning Testing:**
   - Create film roll with 20+ high-resolution exposures
   - Export as "JSON with Images"
   - Verify size warning appears if >10MB
   - Test both "Continue" and "Cancel" options

4. **Backward Compatibility:**
   - Verify existing "Local" export still works (multi-file)
   - Verify existing "JSON Only" export still works (metadata only)
   - Verify existing "Import from Local Files" still works with old exports

5. **Error Handling:**
   - Try importing a regular metadata.json (without images) as "JSON with Images" - should show error
   - Try importing corrupted JSON - should show friendly error
   - Try exporting with no exposures - should handle gracefully

### E2E Test Ideas (for future implementation):

```typescript
// Add to film-roll-management.spec.ts or new file
test('JSON with images export/import', async ({ page }) => {
    // Create film roll with exposures
    // Navigate to gallery
    // Click export, select "JSON with Images"
    // Wait for download
    // Click import, select "Import JSON with Images"
    // Upload the file
    // Verify "[IMPORTED]" prefix in film roll name
    // Verify all exposures present
});
```

## Benefits

- Single file to manage (easier for users than multiple files)
- No risk of losing images when moving files around
- Simpler sharing (one file via email, Telegram, etc.)
- Self-contained backup format
- Works alongside existing export methods

## Trade-offs

- Larger file size (base64 encoding adds ~33% overhead)
- May be slower to export/import with many large images
- Not suitable for external tools like Python metadata script (use "Local" export for that)
- File size warnings needed for mobile data users

## Version Tracking

- Export format version stays at "2.0.0" (same data structure as existing exports)
- New `exportType: 'with-images'` field distinguishes the format
- Fully backward compatible (doesn't break existing code)
