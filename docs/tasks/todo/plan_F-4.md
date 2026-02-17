# Plan: Visual Focal Length Simulator with Camera Zoom (F-4)

## Problem Statement

When shooting with an iPhone or other phone camera, users want to simulate different focal lengths (e.g., 15mm, 50mm, 85mm) to understand how their scene would look with different lenses. Currently:
- The focal length slider exists but is in a separate settings dialog
- There's no visual feedback showing how the scene changes at different focal lengths
- Users can't easily experiment with framing while looking at the live camera view

**User requirement:**
- Transparent ruler-style slider overlay on the camera preview
- Slide left/right to change focal length (15mm to 200mm+)
- Image zooms digitally to simulate longer focal lengths
- Shows black letterbox for ultra-wide angles (<24mm) that can't be captured
- Designed for iPhone use (primary use case)
- Simple implementation - avoid complex features if they require significant effort

## Proposed Solution (Simplified Approach)

Create a transparent horizontal slider overlay at the bottom of the camera preview that:
1. Controls **digital zoom** on the video element using CSS transform: scale()
2. Uses iPhone 13 standard camera as baseline (24mm equivalent)
3. Shows visual ruler marks for common focal lengths (24, 35, 50, 85, 135mm)
4. Displays black letterbox bars for ultra-wide angles (<24mm) to indicate "not capturable"
5. Updates the focal length value in exposure settings
6. Minimal code changes - mostly UI/CSS work

**Key simplifications:**
- Use CSS transform scale, NOT MediaStream constraints (avoid camera switching complexity)
- Digital zoom only (no optical zoom or camera switching)
- Fixed baseline at 24mm (iPhone standard camera equivalent)
- Simple calculation: zoom = focal_length / 24
- No attempt to switch between iPhone multiple cameras (user can do manually if needed)

## Technical Approach

### Zoom Calculation (Simple)

```
baseline = 24mm (iPhone standard camera)
zoom_factor = current_focal_length / baseline

Examples:
- 24mm → zoom = 1.0 (no zoom, normal view)
- 50mm → zoom = 2.08 (2x digital zoom)
- 85mm → zoom = 3.54 (3.5x digital zoom)
- 15mm → zoom = 0.625 (letterbox, not capturable)
```

For focal lengths < 24mm, show black bars to indicate the field of view is wider than the camera can capture.

### Visual Design

**Ruler-style slider:**
```
┌─────────────────────────────────────────┐
│                 Video Preview            │
│                                          │
│                                          │
│  [━━━━●━━━━━━━━━━━━━━━━━━━]  50mm       │ ← Transparent overlay
└─────────────────────────────────────────┘
     ↑   ↑     ↑     ↑     ↑     ↑
    15  24    35    50    85   135
```

- Small height (~40-60px)
- Semi-transparent background (rgba(0,0,0,0.4))
- White ruler marks for key focal lengths
- Current value displayed on the right
- Touch-friendly slider thumb (larger hit area)

## Implementation Steps

### 1. Create FocalLengthRulerOverlay Component (`src/components/FocalLengthRulerOverlay.tsx`)

New component that renders over the camera view:

```typescript
interface FocalLengthRulerOverlayProps {
    value: number; // Current focal length in mm
    onChange: (value: number) => void;
    baseline?: number; // Default 24mm for iPhone
}

// Features:
// - Horizontal slider with ruler marks
// - Semi-transparent background
// - Marks at: 15, 24, 35, 50, 85, 135, 200mm
// - Current value display
// - Touch-friendly (mobile-first)
```

**Styling:**
- Position: absolute, bottom: 10px, left: 0, right: 0
- Height: 50px
- Background: rgba(0, 0, 0, 0.4)
- Border-radius: 8px
- White marks and text
- Slider thumb: 24px circle with white border

### 2. Update CameraScreen Component

**Add state for focal length and zoom:**
```typescript
const [simulatedFocalLength, setSimulatedFocalLength] = useState<number>(24); // Default to baseline
const zoomFactor = simulatedFocalLength / 24; // Calculate zoom
const showLetterbox = simulatedFocalLength < 24; // Show black bars for ultra-wide
```

**Apply zoom to video element:**
```typescript
<video
    ref={videoRef}
    autoPlay
    playsInline
    muted
    style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: `scale(${zoomFactor})`, // Digital zoom via CSS
        transformOrigin: 'center center',
        transition: 'transform 0.1s ease-out' // Smooth zoom changes
    }}
/>
```

**Add letterbox overlay for ultra-wide:**
```typescript
{showLetterbox && (
    <>
        {/* Top black bar */}
        <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '25%',
            backgroundColor: 'black',
            zIndex: 5
        }} />
        {/* Bottom black bar */}
        <Box sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '25%',
            backgroundColor: 'black',
            zIndex: 5
        }} />
    </>
)}
```

**Add ruler overlay:**
```typescript
{isCameraActive && (
    <FocalLengthRulerOverlay
        value={simulatedFocalLength}
        onChange={(newValue) => {
            setSimulatedFocalLength(newValue);
            // Update exposure settings
            setCurrentSettings(prev => ({
                ...prev,
                focalLength: newValue
            }));
        }}
        baseline={24}
    />
)}
```

**Update capture to use simulated focal length:**
When capturing, the focal length is already set in `currentSettings` so no additional changes needed for capture logic.

### 3. Ruler Overlay Styling Details

**Component structure:**
```tsx
<Box sx={{ position: 'absolute', bottom: 10, left: 10, right: 10, zIndex: 20 }}>
    {/* Container with semi-transparent background */}
    <Box sx={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 2,
        padding: '8px 12px',
        backdropFilter: 'blur(4px)' // iOS-style blur
    }}>
        {/* Ruler marks */}
        <Box sx={{ position: 'relative', height: 20, mb: 1 }}>
            {/* Tick marks at 15, 24, 35, 50, 85, 135, 200 */}
            {marks.map(mark => (
                <Box key={mark} sx={{
                    position: 'absolute',
                    left: `${(mark - 15) / (200 - 15) * 100}%`,
                    width: 1,
                    height: mark % 50 === 0 ? 16 : 12,
                    backgroundColor: 'white',
                    opacity: 0.7
                }} />
            ))}
        </Box>

        {/* Material-UI Slider */}
        <Slider
            value={value}
            onChange={(_, newValue) => onChange(newValue as number)}
            min={15}
            max={200}
            step={1}
            marks={[
                { value: 15, label: '15' },
                { value: 24, label: '24' },
                { value: 50, label: '50' },
                { value: 85, label: '85' },
                { value: 135, label: '135' }
            ]}
            sx={{
                color: 'white',
                '& .MuiSlider-thumb': {
                    width: 24,
                    height: 24,
                    border: '2px solid white'
                },
                '& .MuiSlider-markLabel': {
                    color: 'white',
                    fontSize: '11px'
                }
            }}
        />

        {/* Current value display */}
        <Typography variant="body2" color="white" align="center">
            {value}mm
        </Typography>
    </Box>
</Box>
```

### 4. No Changes to Capture Logic

The capture logic remains unchanged because:
- We're applying zoom via CSS (visual only)
- When capturing, we capture the zoomed-in view that's displayed
- The `camera.captureImage()` function captures what's shown in the video element
- The focal length is already stored in `currentSettings.focalLength`

## Critical Files

1. `src/components/FocalLengthRulerOverlay.tsx` - NEW: Ruler-style slider overlay component
2. `src/components/CameraScreen.tsx` - UPDATE: Add zoom state, apply CSS transform, add overlay

## Benefits

- **Visual feedback**: See focal length simulation in real-time
- **Easy framing**: Experiment with different perspectives before shooting
- **Educational**: Learn how different focal lengths affect composition
- **Touch-friendly**: Designed for iPhone/mobile use
- **Minimal complexity**: Simple CSS zoom, no camera switching logic
- **Fast implementation**: ~2 hours of work vs. days for complex solutions

## Trade-offs & Limitations

**Limitations (accepted for simplicity):**
1. **Digital zoom only** - Not using optical zoom or multiple cameras
   - Why: Camera switching is complex and inconsistent across devices
   - Mitigation: Digital zoom is good enough for framing preview

2. **Image quality degrades at high zoom** - 3x+ zoom will show pixelation
   - Why: Digital zoom crops and scales the sensor data
   - Mitigation: This is a framing tool, not for final capture quality

3. **Fixed 24mm baseline** - Assumes iPhone standard camera
   - Why: Different phones have different baselines (Samsung ~26mm, etc.)
   - Mitigation: 24mm is most common, and difference is minor for framing

4. **Letterbox is just visual** - <24mm doesn't actually capture wider
   - Why: Can't expand camera sensor's field of view
   - Mitigation: Letterbox clearly indicates "this is wider than possible"

5. **No pinch-to-zoom integration** - Only slider control
   - Why: Pinch gestures conflict with slider and add complexity
   - Mitigation: Slider is more precise for photographers anyway

**What we're NOT implementing (to keep it simple):**
- ❌ Camera switching (e.g., iPhone Pro ultra-wide/telephoto)
- ❌ MediaStream constraints for optical zoom
- ❌ Pinch-to-zoom gestures
- ❌ Device-specific baseline calibration
- ❌ EXIF reading to detect actual camera focal length

## Testing & Verification

### Manual Testing (iPhone Focus):

1. **Basic Zoom:**
   - Start camera on iPhone
   - Move slider from 24mm to 50mm
   - Verify video zooms in smoothly (2x)
   - Check focal length updates in exposure settings

2. **Ultra-Wide Letterbox:**
   - Slide to 15mm
   - Verify black bars appear top/bottom
   - Verify video zooms out (0.625x)
   - Check letterbox disappears at 24mm+

3. **Telephoto Zoom:**
   - Slide to 135mm
   - Verify strong zoom (5.6x)
   - Check image quality (expected to be lower)
   - Verify still capturable

4. **Ruler Interaction:**
   - Verify all marks are visible (15, 24, 35, 50, 85, 135, 200)
   - Check touch target is large enough (easy to grab)
   - Test slider responsiveness (smooth, no lag)
   - Verify current value displays correctly

5. **Capture with Zoom:**
   - Set focal length to 50mm
   - Capture a photo
   - Verify focal length saved in exposure metadata
   - Check captured image matches zoomed preview

6. **Different Devices:**
   - Test on iPhone (primary)
   - Test on Android (secondary)
   - Test on iPad (landscape)
   - Verify ruler scales appropriately

### Edge Cases:

1. **Extreme zoom (200mm):** Very pixelated but functional
2. **Minimum focal length (15mm):** Letterbox visible, no crashes
3. **Slider while capturing:** Should still work (capture uses current value)
4. **Camera inactive:** Ruler should not appear (hidden when camera off)

## Future Enhancements (NOT for now)

1. **Device-specific calibration**: Detect actual camera baseline (24mm vs 26mm)
2. **Multi-camera support**: Switch to ultra-wide/telephoto when available
3. **Pinch-to-zoom**: Integrate gesture controls
4. **Zoom presets**: Quick buttons for 24mm, 35mm, 50mm, 85mm
5. **Field of view indicator**: Show angle of view (e.g., 50mm = 47°)
6. **Crop factor settings**: Let users set sensor size (full-frame, APS-C, etc.)

## Why This Approach?

**Pros:**
✅ Very simple to implement (~2 hours)
✅ Works on all devices consistently
✅ No complex camera API interactions
✅ Smooth performance (CSS transforms are GPU-accelerated)
✅ Good enough for framing preview
✅ Easy to test and debug

**Cons:**
❌ Not true optical zoom (quality degrades)
❌ Doesn't use iPhone Pro telephoto camera
❌ Fixed baseline may be slightly off on some devices

**Decision:** The pros heavily outweigh the cons for this use case. Users primarily need a framing tool to understand composition, not perfect optical quality. If they need true optical zoom, they can use the native camera app.

## Implementation Estimate

- FocalLengthRulerOverlay component: 1 hour
- CameraScreen integration: 30 minutes
- Testing and refinement: 30 minutes
- **Total: ~2 hours**

## Version Notes

- Feature version: 2.1.0 (minor feature addition)
- No breaking changes
- Backward compatible (existing captures work as before)
