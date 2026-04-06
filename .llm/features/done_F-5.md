# Plan: Camera-Based Light Meter with Vertical Dual Slider (F-5)

## Problem Statement

Film photographers need exposure metering to determine correct camera settings. Currently, users must:
- Guess exposure settings based on experience
- Use external light meter apps or devices
- Manually calculate aperture/shutter speed combinations

The app already has a camera view but doesn't analyze the scene brightness to suggest exposure settings.

## User Requirements

**Light meter features:**
- Analyze scene brightness using the camera feed
- Use the film roll's EI (Exposure Index) setting
- Automatically suggest shutter speed for the selected aperture
- Update continuously (every ~1000ms) as the user reframes

**UI design:**
- Vertical slider on the right side of the video preview
- Split into two parts:
  - **Left side**: Shutter speed values (auto-updating based on light)
  - **Right side**: Aperture values (user-controlled)
- Semi-transparent overlay
- User adjusts aperture, meter adjusts shutter speed automatically

## Proposed Solution

Create a vertical dual slider that:
1. Analyzes video frame brightness using canvas every 1000ms
2. Calculates EV (Exposure Value) from scene brightness
3. Uses the film roll's EI setting (or ISO if EI not set)
4. User sets aperture → meter suggests corresponding shutter speed
5. Visual indicator shows if exposure is correct/over/under

**Technical approach:**
- Canvas-based image analysis (sample pixels for brightness)
- EV calculation using simplified exposure formula
- Aperture-shutter speed pairing based on EV
- Smooth auto-update using setInterval
- Material-UI Slider for aperture control

## Technical Details

### 1. Brightness Analysis (Canvas-Based)

```typescript
// Add to src/utils/camera.ts
export const lightMeter = {
    // Analyze frame brightness from video element
    analyzeFrameBrightness: (video: HTMLVideoElement): number => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) {
            return 128; // Default mid-gray if not ready
        }

        // Use smaller canvas for performance (scale down by 4)
        canvas.width = Math.floor(video.videoWidth / 4);
        canvas.height = Math.floor(video.videoHeight / 4);

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        let totalLuminance = 0;
        let pixelCount = 0;

        // Sample every 4th pixel for better performance
        for (let i = 0; i < data.length; i += 16) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // ITU-R BT.709 luminance formula
            const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            totalLuminance += luminance;
            pixelCount++;
        }

        return totalLuminance / pixelCount; // Returns 0-255
    },

    // Convert brightness to EV (Exposure Value)
    brightnessToEV: (brightness: number): number => {
        // Empirical formula: brightness 0-255 → EV
        // This requires calibration but provides a starting point
        // Assume brightness 128 ≈ EV 10 (daylight)
        const normalizedBrightness = brightness / 255;

        // Logarithmic scale: EV = log2(brightness * scale) + offset
        // Calibrated so: brightness 128 → EV ~10
        const ev = Math.log2(normalizedBrightness * 100 + 0.01) + 3.5;

        return Math.round(ev * 10) / 10; // Round to 1 decimal
    },

    // Calculate shutter speed for given aperture and EV
    calculateShutterSpeed: (aperture: string, ev: number, iso: number): string => {
        // EV formula: EV = log2(N²/t) + log2(ISO/100)
        // Solve for t (shutter speed time)
        // t = N² / (2^EV * ISO/100)

        // Parse aperture (e.g., "f/2.8" → 2.8)
        const fNumber = parseFloat(aperture.replace('f/', ''));

        // Calculate shutter time in seconds
        const shutterTime = (fNumber * fNumber) / (Math.pow(2, ev) * (iso / 100));

        // Convert to standard shutter speed notation
        return lightMeter.formatShutterSpeed(shutterTime);
    },

    // Format shutter time to standard notation (e.g., 1/125, 1/500)
    formatShutterSpeed: (timeInSeconds: number): string => {
        if (timeInSeconds >= 1) {
            // Slow shutter: 1", 2", 4"
            return `${Math.round(timeInSeconds)}"`;
        } else {
            // Fast shutter: 1/125, 1/500, etc.
            const denominator = Math.round(1 / timeInSeconds);

            // Snap to standard values
            const standardSpeeds = [4000, 2000, 1000, 500, 250, 125, 60, 30, 15, 8, 4, 2];
            const closest = standardSpeeds.reduce((prev, curr) =>
                Math.abs(curr - denominator) < Math.abs(prev - denominator) ? curr : prev
            );

            return `1/${closest}`;
        }
    }
};
```

### 2. LightMeterSlider Component (`src/components/LightMeterSlider.tsx`)

New component for the vertical dual slider:

```typescript
interface LightMeterSliderProps {
    aperture: string; // Current aperture (user-controlled)
    suggestedShutterSpeed: string; // Auto-calculated shutter speed
    onApertureChange: (aperture: string) => void;
    availableApertures: string[]; // Based on current lens
    ev: number; // Current EV reading
}

// UI Layout (vertical, right side of screen):
// ┌─────────────────┐
// │  1/4000  │ f/1.4│
// │  1/2000  │ f/2  │
// │→ 1/500   │ f/2.8│ ← Suggested shutter | User aperture
// │  1/125   │ f/4  │
// │  1/30    │●f/5.6│ ← User selected aperture (thumb)
// │  1/8     │ f/8  │
// │  1"      │ f/11 │
// └─────────────────┘

// Features:
// - Semi-transparent background (rgba(0,0,0,0.5))
// - Left: Shutter speeds (auto-updating indicator)
// - Right: Aperture slider (user drags)
// - EV value displayed at top
// - Exposure indicator (over/under/correct)
```

**Component structure:**
```tsx
export const LightMeterSlider: React.FC<LightMeterSliderProps> = ({
    aperture,
    suggestedShutterSpeed,
    onApertureChange,
    availableApertures,
    ev
}) => {
    // Find index of current aperture
    const currentIndex = availableApertures.indexOf(aperture);

    return (
        <Box sx={{
            position: 'absolute',
            right: 10,
            top: 80,
            bottom: 80,
            width: 120,
            zIndex: 15,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            borderRadius: 2,
            padding: 2,
            backdropFilter: 'blur(4px)',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* EV Display */}
            <Typography variant="caption" color="white" align="center" sx={{ mb: 1 }}>
                EV {ev.toFixed(1)}
            </Typography>

            {/* Dual column layout */}
            <Box sx={{ flex: 1, display: 'flex', position: 'relative' }}>
                {/* Left: Shutter speeds (read-only) */}
                <Box sx={{ flex: 1, position: 'relative' }}>
                    {SHUTTER_SPEED_VALUES.map((speed, idx) => (
                        <Typography
                            key={speed}
                            variant="caption"
                            color="white"
                            sx={{
                                position: 'absolute',
                                top: `${(idx / (SHUTTER_SPEED_VALUES.length - 1)) * 100}%`,
                                left: 4,
                                fontSize: '10px',
                                fontWeight: speed === suggestedShutterSpeed ? 'bold' : 'normal',
                                color: speed === suggestedShutterSpeed ? '#4CAF50' : 'white',
                                transform: 'translateY(-50%)'
                            }}
                        >
                            {speed === suggestedShutterSpeed && '→'}{speed}
                        </Typography>
                    ))}
                </Box>

                {/* Vertical separator */}
                <Box sx={{ width: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} />

                {/* Right: Aperture slider */}
                <Box sx={{ flex: 1, position: 'relative', pl: 1 }}>
                    <Slider
                        orientation="vertical"
                        value={currentIndex}
                        onChange={(_, newValue) => {
                            onApertureChange(availableApertures[newValue as number]);
                        }}
                        min={0}
                        max={availableApertures.length - 1}
                        step={1}
                        marks={availableApertures.map((ap, idx) => ({
                            value: idx,
                            label: ap.replace('f/', '')
                        }))}
                        sx={{
                            height: '100%',
                            color: 'white',
                            '& .MuiSlider-thumb': {
                                width: 20,
                                height: 20,
                                border: '2px solid white'
                            },
                            '& .MuiSlider-markLabel': {
                                color: 'white',
                                fontSize: '10px',
                                transform: 'translateX(8px)'
                            }
                        }}
                    />
                </Box>
            </Box>

            {/* Exposure indicator */}
            <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography variant="caption" color="#4CAF50">
                    ● Correct
                </Typography>
            </Box>
        </Box>
    );
};
```

### 3. CameraScreen Integration

**Add state for light metering:**
```typescript
const [currentEV, setCurrentEV] = useState<number>(10); // Default EV
const [suggestedShutterSpeed, setSuggestedShutterSpeed] = useState<string>('1/125');
const [showLightMeter, setShowLightMeter] = useState<boolean>(true); // Toggle
```

**Add continuous brightness monitoring:**
```typescript
useEffect(() => {
    if (!isCameraActive || !videoRef.current) return;

    // Analyze brightness every 1000ms
    const intervalId = setInterval(() => {
        if (videoRef.current && videoRef.current.videoWidth > 0) {
            // Get brightness
            const brightness = lightMeter.analyzeFrameBrightness(videoRef.current);

            // Convert to EV
            const ev = lightMeter.brightnessToEV(brightness);
            setCurrentEV(ev);

            // Calculate suggested shutter speed
            const iso = filmRoll.ei || filmRoll.iso;
            const shutter = lightMeter.calculateShutterSpeed(
                currentSettings.aperture,
                ev,
                iso
            );
            setSuggestedShutterSpeed(shutter);

            console.log('Light meter:', { brightness, ev, shutter });
        }
    }, 1000); // Update every 1 second

    return () => clearInterval(intervalId);
}, [isCameraActive, currentSettings.aperture, filmRoll.iso, filmRoll.ei]);
```

**Add light meter overlay to camera view:**
```tsx
{isCameraActive && showLightMeter && (
    <LightMeterSlider
        aperture={currentSettings.aperture}
        suggestedShutterSpeed={suggestedShutterSpeed}
        onApertureChange={(newAperture) => {
            setCurrentSettings(prev => ({
                ...prev,
                aperture: newAperture
            }));
        }}
        availableApertures={getAvailableApertures()} // Based on current lens
        ev={currentEV}
    />
)}
```

**Helper to get available apertures:**
```typescript
const getAvailableApertures = (): string[] => {
    const currentLens = lenses.find(l => l.id === currentSettings.lensId);

    if (!currentLens) {
        return APERTURE_VALUES; // All apertures if no lens
    }

    // Filter apertures based on lens max aperture
    const maxAperture = parseFloat(currentLens.maxAperture.replace('f/', ''));
    return APERTURE_VALUES.filter(ap => {
        const fNumber = parseFloat(ap.replace('f/', ''));
        return fNumber >= maxAperture;
    });
};
```

**Update capture to use suggested shutter:**
Add a button or auto-apply the suggested shutter speed:
```typescript
const applySuggestedExposure = () => {
    setCurrentSettings(prev => ({
        ...prev,
        shutterSpeed: suggestedShutterSpeed
    }));
};
```

### 4. Optional: Toggle Light Meter

Add button to show/hide light meter:
```tsx
<IconButton
    onClick={() => setShowLightMeter(!showLightMeter)}
    color={showLightMeter ? 'primary' : 'default'}
>
    <LightMode /> {/* or custom meter icon */}
</IconButton>
```

## Critical Files

1. `src/utils/camera.ts` - ADD: `lightMeter` utility functions for brightness analysis
2. `src/components/LightMeterSlider.tsx` - NEW: Vertical dual slider component
3. `src/components/CameraScreen.tsx` - UPDATE: Add brightness monitoring, integrate light meter
4. `src/types.ts` - CHECK: Ensure SHUTTER_SPEED_VALUES exported

## Benefits

- **Accurate exposure**: Camera-based metering suggests correct settings
- **Real-time feedback**: Updates every 1 second as user reframes
- **Film-appropriate**: Uses EI setting for proper exposure calculation
- **Educational**: Helps users understand aperture/shutter relationships
- **Non-intrusive**: Transparent overlay doesn't block the view
- **Efficient**: Sampling and throttling prevent performance issues

## Trade-offs & Limitations

**Limitations (accepted):**

1. **Calibration needed**: EV calculation is empirical, may need user calibration
   - Mitigation: Start with reasonable defaults, allow calibration in settings later

2. **No hardware metering data**: Not using actual camera sensor readings
   - Mitigation: Canvas analysis is "good enough" for relative measurements

3. **Update latency**: 1000ms delay between readings
   - Mitigation: 1 second is acceptable for film photography workflow

4. **Fixed metering pattern**: Uses average of entire frame (matrix metering)
   - Future: Add spot metering (center-weighted)

5. **CPU usage**: Canvas analysis every second
   - Mitigation: Downscaled canvas (1/4 size) and pixel sampling keeps it efficient

**What we're NOT implementing (to keep it simple):**
- ❌ Spot metering (center-only analysis)
- ❌ Histogram display
- ❌ Multiple metering modes (spot/center/matrix)
- ❌ User calibration interface
- ❌ Exposure compensation adjustment

## Testing & Verification

### Manual Testing:

1. **Basic Light Metering:**
   - Start camera indoors with normal lighting
   - Verify EV reading appears (~EV 8-10)
   - Check shutter speed suggestion updates
   - Move to bright area, verify EV increases

2. **Aperture Changes:**
   - Drag aperture slider from f/2.8 to f/8
   - Verify shutter speed slows down (e.g., 1/500 → 1/125)
   - Check exposure stays balanced

3. **Different Light Conditions:**
   - Test in bright sunlight (EV 14-15)
   - Test indoors (EV 8-10)
   - Test in dim light (EV 5-7)
   - Verify suggestions make sense

4. **EI vs ISO:**
   - Set film roll with EI override (e.g., ISO 400, EI 800)
   - Verify meter uses EI for calculations
   - Check shutter speeds adjust accordingly

5. **Lens Aperture Limits:**
   - Select lens with max aperture f/2.8
   - Verify slider only shows f/2.8 to f/22
   - Try with f/1.4 lens, verify wider apertures available

6. **Performance:**
   - Monitor CPU usage (should be low, <5%)
   - Check updates are smooth every 1 second
   - Verify no lag or stuttering

### Edge Cases:

1. **Very dark scene**: EV calculation handles brightness ~0
2. **Very bright scene**: EV calculation handles brightness ~255
3. **Camera not ready**: Default to EV 10, graceful fallback
4. **No lens selected**: Show all apertures
5. **Toggle off/on**: Light meter state persists

### Calibration Testing:

1. **Compare with external meter**:
   - Use phone light meter app or handheld meter
   - Compare EV readings in same scene
   - Note offset for future calibration feature

2. **Sunny 16 rule check**:
   - Bright sun: EV ~15-16 → ISO 400, f/16, 1/400
   - Verify meter suggests similar values

## Future Enhancements (NOT for now)

1. **Spot metering**: Analyze center 10% of frame only
2. **User calibration**: Let users calibrate against known light sources
3. **Metering modes**: Toggle between spot/center/matrix
4. **Histogram overlay**: Show exposure distribution
5. **Exposure compensation**: ±2 EV adjustment
6. **Auto-apply mode**: Automatically set shutter speed (no manual confirmation)
7. **Exposure bracketing**: Suggest under/over alternatives

## Implementation Estimate

- Light meter utilities (camera.ts): 1 hour
- LightMeterSlider component: 2 hours
- CameraScreen integration: 1 hour
- Testing and calibration tweaking: 1 hour
- **Total: ~5 hours**

## Version Notes

- Feature version: 2.1.0 (minor feature addition)
- No breaking changes
- Existing captures unaffected
- Light meter is optional (can be toggled off)

## Why This Approach?

**Pros:**
✅ Uses camera as light sensor (no external hardware)
✅ Real-time feedback while composing
✅ Respects film roll's EI setting
✅ Vertical dual slider is intuitive for photographers
✅ Semi-transparent, doesn't obstruct view
✅ Efficient implementation (~5 hours)

**Cons:**
❌ Not as accurate as dedicated light meter
❌ Requires empirical calibration
❌ Limited to average metering initially

**Decision:** This provides 80% of the value of a dedicated light meter with minimal implementation complexity. Film photographers will appreciate having exposure guidance directly in the camera view.
