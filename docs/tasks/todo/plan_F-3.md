# Plan: Descale Large Uploaded Images (F-3)

## Problem Statement

Currently, images captured via the camera are automatically scaled down to a maximum of 1280px (see `camera.captureImage()` in `src/utils/camera.ts:89-141`). However, when users upload images from their gallery using the file picker, the images are read as-is via `fileUtils.fileToBase64()` without any scaling. This creates inconsistency:

- **Camera captures**: Scaled to max 1280px, quality 0.7-0.8, optimized for storage
- **Gallery uploads**: Full resolution (could be 4000px+), much larger file sizes, inconsistent quality

This causes:
1. Larger storage usage for gallery uploads
2. Slower performance when displaying/exporting gallery images
3. Inconsistent image sizes in the same film roll
4. Potential memory issues on mobile devices

## Proposed Solution

Add an image scaling utility function that processes both camera captures and gallery uploads uniformly. The function should:
1. Load the image into an HTML Image element
2. Calculate scaled dimensions (max 1280px, preserve aspect ratio)
3. Draw to canvas with scaled dimensions
4. Apply appropriate JPEG compression (0.7-0.8 quality)
5. Return base64 data URL

This matches the existing `camera.captureImage()` behavior but works with any image source (File, base64, etc.).

## Implementation Steps

### 1. Create Image Scaling Utility (`src/utils/camera.ts`)

Add a new utility function `fileUtils.scaleImageFile()` that:
- Takes a File object as input
- Returns a Promise<string> with scaled base64 data URL
- Uses the same scaling logic as `camera.captureImage()`:
  - Max dimension: 1280px
  - Preserve aspect ratio
  - JPEG quality: 0.7 for larger images (>640x480), 0.8 for smaller
- Handles errors gracefully

**Implementation approach:**
```typescript
// Add to fileUtils object in src/utils/camera.ts
scaleImageFile: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        // Create image element to load file
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            try {
                URL.revokeObjectURL(url); // Clean up

                // Same scaling logic as camera.captureImage()
                const maxSize = 1280;
                let canvasWidth = img.width;
                let canvasHeight = img.height;

                if (img.width > maxSize || img.height > maxSize) {
                    const aspectRatio = img.width / img.height;
                    if (img.width > img.height) {
                        canvasWidth = maxSize;
                        canvasHeight = maxSize / aspectRatio;
                    } else {
                        canvasHeight = maxSize;
                        canvasWidth = maxSize * aspectRatio;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = canvasWidth;
                canvas.height = canvasHeight;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Unable to create canvas context'));
                    return;
                }

                ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

                // Same quality calculation as camera.captureImage()
                const quality = canvasWidth * canvasHeight > 640 * 480 ? 0.7 : 0.8;
                const dataURL = canvas.toDataURL('image/jpeg', quality);

                if (!dataURL || dataURL.length < 100) {
                    reject(new Error('Failed to generate image data'));
                    return;
                }

                resolve(dataURL);
            } catch (error) {
                reject(error);
            }
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image file'));
        };

        img.src = url;
    });
}
```

### 2. Update CameraScreen Gallery Upload (`src/components/CameraScreen.tsx`)

Replace the direct `fileUtils.fileToBase64(file)` call with the new scaling function:

**Current code (line 276):**
```typescript
const imageData = await fileUtils.fileToBase64(file);
```

**New code:**
```typescript
const imageData = await fileUtils.scaleImageFile(file);
```

This ensures gallery uploads are scaled the same way as camera captures.

### 3. Update DetailsScreen Image Change (`src/components/DetailsScreen.tsx`)

Replace the `fileUtils.fileToBase64(file)` call with the new scaling function:

**Current code (line 90):**
```typescript
const imageData = await fileUtils.fileToBase64(file);
```

**New code:**
```typescript
const imageData = await fileUtils.scaleImageFile(file);
```

This ensures image replacements are also scaled consistently.

### 4. Keep fileToBase64 for Non-Image Uses

The `fileUtils.fileToBase64()` function should remain unchanged as it may be used for other purposes (e.g., reading JSON files during import). The new `scaleImageFile()` is specifically for image processing.

## Critical Files

1. `src/utils/camera.ts` - Add `fileUtils.scaleImageFile()` function
2. `src/components/CameraScreen.tsx` - Update line 276 to use new scaling function
3. `src/components/DetailsScreen.tsx` - Update line 90 to use new scaling function

## Benefits

- **Consistent image sizes**: All images (camera + gallery) are scaled uniformly to max 1280px
- **Reduced storage usage**: Gallery uploads no longer store full 4000px+ images
- **Better performance**: Smaller images load faster, especially on mobile
- **Lower memory usage**: Prevents memory issues when handling large images
- **Predictable exports**: All exported images have consistent sizes

## Trade-offs

- **Quality loss for high-res uploads**: Users uploading 4000px images will see them downscaled
  - Mitigation: This matches the camera capture behavior, so it's consistent
  - Users who need full resolution should use external tools
- **Additional processing time**: Scaling takes ~100-500ms per image
  - Mitigation: Still fast enough for good UX, and the storage savings are worth it

## Testing & Verification

### Manual Testing Flow:

1. **Test Gallery Upload Scaling:**
   - Open camera screen
   - Click gallery icon to upload an image
   - Select a high-resolution image (2000px+ from a DSLR or scanner)
   - Verify the image is scaled down to max 1280px
   - Check the base64 data length is reasonable (~200-400KB range)

2. **Test Camera Capture (Regression):**
   - Capture an image using the live camera
   - Verify it still works correctly
   - Check the image size is still max 1280px
   - Ensure no new errors occur

3. **Test Image Replacement in Details:**
   - Open an exposure in details screen
   - Click to replace the image
   - Select a high-resolution image
   - Verify the image is scaled down
   - Check the aspect ratio is preserved

4. **Test Different Image Sizes:**
   - Upload a small image (500x500px) - should not upscale
   - Upload a wide image (4000x2000px) - should scale to 1280x640px
   - Upload a tall image (2000x4000px) - should scale to 640x1280px

5. **Test Quality Settings:**
   - Upload a large image and verify quality is 0.7
   - Upload a small image and verify quality is 0.8
   - Visually inspect that images look good

6. **Test Error Handling:**
   - Try uploading a corrupted image file
   - Try uploading a non-image file (should be caught by earlier validation)
   - Verify friendly error messages

### Performance Testing:

1. **Measure Scaling Time:**
   - Upload several large images (3000px+)
   - Log processing time in console
   - Verify < 1 second per image

2. **Memory Usage:**
   - Upload 10+ large images in a row
   - Monitor browser memory usage
   - Ensure no memory leaks (URL.revokeObjectURL is called)

### E2E Test Ideas (for future implementation):

```typescript
// Add to photography-workflow.spec.ts
test('Gallery upload scales large images', async ({ page }) => {
    // Create film roll
    // Navigate to camera screen
    // Upload high-resolution image via file input
    // Verify image is displayed
    // Navigate to details screen
    // Check image dimensions are max 1280px
});
```

## Edge Cases to Consider

1. **Very small images** (< 640x480): Should not upscale, maintain quality 0.8
2. **Square images** (1000x1000): Should scale to 1280x1280 if > 1280
3. **Non-JPEG formats** (PNG, WebP): Canvas toDataURL will convert to JPEG
4. **Animated GIFs**: Will convert to static JPEG (first frame)
5. **EXIF orientation**: May need rotation handling (test with phone photos)

## Future Enhancements

1. **EXIF orientation handling**: Respect EXIF rotation tags from phone photos
2. **Configurable max size**: Allow users to set max image dimension in settings
3. **Quality settings**: Let users choose quality vs. size trade-off
4. **WebP support**: Use WebP instead of JPEG for better compression
5. **Background processing**: Use Web Workers for large batch uploads

## Version Notes

- No version bump needed (internal optimization)
- Backward compatible (existing images unchanged)
- Export format unchanged
