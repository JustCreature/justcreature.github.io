import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Button,
    IconButton,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    DialogActions,
    Stack,
    Chip,
    Fab,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Slider
} from '@mui/material';
import {
    PhotoCamera,
    PhotoLibrary,
    CameraAlt,
    Close,
    ArrowBack
} from '@mui/icons-material';
import { camera, geolocation, fileUtils } from '../utils/camera';
import type { FilmRoll, Exposure, ExposureSettings, Lens } from '../types';
import { APERTURE, APERTURE_VALUES, SHUTTER_SPEED, SHUTTER_SPEED_VALUES, EI_VALUES } from '../types';

// Add CSS for shutter effect animation
const shutterEffectStyles = `
@keyframes shutterEffect {
    0% { opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { opacity: 0; }
}
`;

// Inject styles into document head
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = shutterEffectStyles;
    document.head.appendChild(styleSheet);
}

interface CameraScreenProps {
    filmRoll: FilmRoll;
    lenses: Lens[];
    exposures: Exposure[];
    onExposureTaken: (exposure: Exposure) => void;
    onFilmRollUpdated: (filmRoll: FilmRoll) => void;
    onOpenGallery: () => void;
    onBack?: () => void;
    currentSettings: ExposureSettings;
    setCurrentSettings: React.Dispatch<React.SetStateAction<ExposureSettings>>;
}

export const CameraScreen: React.FC<CameraScreenProps> = ({
    filmRoll,
    lenses,
    exposures,
    onExposureTaken,
    onFilmRollUpdated,
    onOpenGallery,
    onBack,
    currentSettings,
    setCurrentSettings
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [isCameraActive, setIsCameraActive] = useState(false);
    const [showSettingsDialog, setShowSettingsDialog] = useState(false);
    const [showShutterEffect, setShowShutterEffect] = useState(false);
    const [showLensChangeDialog, setShowLensChangeDialog] = useState(false);

    const currentExposureNumber = exposures.filter(e => e.filmRollId === filmRoll.id).length + 1;
    const exposuresLeft = filmRoll.totalExposures - (currentExposureNumber - 1);

    useEffect(() => {
        if (isCameraActive) {
            startCamera();
        } else {
            stopCamera();
        }

        return () => {
            stopCamera();
        };
    }, [isCameraActive]);

    const startCamera = async () => {
        try {
            console.log('Starting camera initialization...');

            // Check basic support
            if (!camera.isSupported()) {
                const isHttps = location.protocol === 'https:' || location.hostname === 'localhost';
                const supportMsg = !isHttps
                    ? 'Camera requires HTTPS connection. Try accessing the app via HTTPS or localhost.'
                    : 'Camera not supported on this device or browser.';
                alert(supportMsg);
                setIsCameraActive(false);
                return;
            }

            // Check permissions first
            const permissionState = await camera.checkPermissions();
            console.log('Camera permission state:', permissionState);

            if (permissionState === 'denied') {
                alert('Camera access denied. Please:\n1. Go to browser settings\n2. Allow camera for this site\n3. Refresh the page');
                setIsCameraActive(false);
                return;
            }

            console.log('Requesting camera access...');
            const stream = await camera.getMediaStream();
            console.log('Camera stream obtained:', stream);

            if (videoRef.current && stream) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;

                // Wait for video to be ready on mobile
                videoRef.current.onloadedmetadata = () => {
                    console.log('Camera ready, video dimensions:',
                        videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
                };

                // Handle mobile-specific video events
                videoRef.current.oncanplay = () => {
                    console.log('Video can play');
                };

                videoRef.current.onerror = (err) => {
                    console.error('Video element error:', err);
                };

                // Autoplay might be blocked on some mobile browsers
                try {
                    await videoRef.current.play();
                    console.log('Video playback started');
                } catch (playError) {
                    console.warn('Autoplay blocked, user interaction required:', playError);
                }
            } else {
                throw new Error('Failed to set up video element or stream');
            }
        } catch (error) {
            console.error('Error starting camera:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown camera error';

            // More specific error handling
            let userMessage = `Camera Error: ${errorMessage}\n\n`;

            if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
                userMessage += 'Please allow camera access and try again.';
            } else if (errorMessage.includes('NotFoundError') || errorMessage.includes('DevicesNotFoundError')) {
                userMessage += 'No camera found on this device.';
            } else if (errorMessage.includes('NotReadableError') || errorMessage.includes('TrackStartError')) {
                userMessage += 'Camera is being used by another app. Please close other apps and try again.';
            } else {
                userMessage += 'Please check:\n1. Camera permissions\n2. Camera is not in use by other apps\n3. Browser supports camera access';
            }

            alert(userMessage);
            setIsCameraActive(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            camera.stopStream(streamRef.current);
            streamRef.current = null;
        }
    };

    const capturePhoto = async () => {
        if (!videoRef.current || !streamRef.current) {
            alert('Camera not ready. Please start the camera first.');
            return;
        }

        try {
            // Check if video is actually playing
            if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
                alert('Camera not ready. Please wait for camera to initialize.');
                return;
            }

            // Show shutter effect
            setShowShutterEffect(true);
            // Hide shutter effect after 1 second
            setTimeout(() => {
                setShowShutterEffect(false);
            }, 500);

            // Capture the image immediately
            const imageData = camera.captureImage(videoRef.current);

            // Validate captured image
            if (!imageData || imageData.length < 100) {
                throw new Error('Failed to capture image data');
            }

            const location = geolocation.isSupported()
                ? await geolocation.getCurrentPosition().catch((err) => {
                    console.warn('Location not available:', err);
                    return undefined;
                })
                : undefined;

            const exposure: Exposure = {
                id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // More unique ID
                filmRollId: filmRoll.id,
                exposureNumber: currentExposureNumber,
                aperture: currentSettings.aperture,
                shutterSpeed: currentSettings.shutterSpeed,
                additionalInfo: currentSettings.additionalInfo,
                imageData,
                location,
                capturedAt: new Date(),
                ei: currentSettings.ei,
                lensId: currentSettings.lensId,
                focalLength: currentSettings.focalLength
            };

            onExposureTaken(exposure);

            // Reset additional info for next shot
            setCurrentSettings(prev => ({ ...prev, additionalInfo: '' }));

        } catch (error) {
            console.error('Error capturing photo:', error);
            alert(`Error capturing photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
            // Make sure to hide shutter effect if there's an error
            setShowShutterEffect(false);
        }
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        // Clear the input immediately to allow reselection of the same file
        const target = event.target;
        setTimeout(() => {
            target.value = '';
        }, 100);

        if (!file) {
            console.log('No file selected');
            return;
        }

        console.log('Processing file:', file.name, 'Size:', file.size, 'Type:', file.type);

        try {
            // Validate file before processing
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }

            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                alert('Image too large. Please select a smaller image.');
                return;
            }

            const imageData = await fileUtils.fileToBase64(file);

            if (!imageData || imageData.length < 100) {
                throw new Error('Invalid image data generated');
            }

            console.log('Image processed successfully, size:', imageData.length);

            const location = geolocation.isSupported()
                ? await geolocation.getCurrentPosition().catch((err) => {
                    console.warn('Location not available:', err);
                    return undefined;
                })
                : undefined;

            const exposure: Exposure = {
                id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // More unique ID
                filmRollId: filmRoll.id,
                exposureNumber: currentExposureNumber,
                aperture: currentSettings.aperture,
                shutterSpeed: currentSettings.shutterSpeed,
                additionalInfo: currentSettings.additionalInfo,
                imageData,
                location,
                capturedAt: new Date(),
                ei: currentSettings.ei,
                lensId: currentSettings.lensId,
                focalLength: currentSettings.focalLength
            };

            console.log('Creating exposure:', exposure.id);
            onExposureTaken(exposure);

            // Reset additional info for next shot
            setCurrentSettings(prev => ({ ...prev, additionalInfo: '' }));

        } catch (error) {
            console.error('Error processing file:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Error processing selected image: ${errorMessage}`);
        }
    };

    const openSettingsDialog = () => {
        setShowSettingsDialog(true);
    };

    const handleLensChange = (newLensId: string) => {
        const updatedFilmRoll = {
            ...filmRoll,
            currentLensId: newLensId || undefined
        };
        onFilmRollUpdated(updatedFilmRoll);

        // Also update current settings
        setCurrentSettings(prev => ({
            ...prev,
            lensId: newLensId || undefined
        }));

        setShowLensChangeDialog(false);
    };

    return (
        <Container maxWidth="sm" sx={{ height: '100vh', py: 2, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                    {onBack && (
                        <IconButton onClick={onBack} color="primary">
                            <ArrowBack />
                        </IconButton>
                    )}
                    <Box>
                        <Typography variant="h6" fontWeight="bold">
                            {filmRoll.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {currentExposureNumber}/{filmRoll.totalExposures} - {exposuresLeft} left
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={onOpenGallery} color="primary">
                    <PhotoLibrary />
                </IconButton>
            </Box>

            {/* Camera View */}
            <Paper elevation={3} sx={{ flex: 1, position: 'relative', overflow: 'hidden', mb: 2 }}>
                {isCameraActive ? (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                        />
                        {/* Shutter Effect Overlay */}
                        {showShutterEffect && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: 'black',
                                    zIndex: 10,
                                    animation: 'shutterEffect 500ms ease-in-out'
                                }}
                            />
                        )}
                    </>
                ) : (
                    <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        height="100%"
                        bgcolor="grey.100"
                    >
                        <Stack alignItems="center" spacing={2}>
                            <CameraAlt sx={{ fontSize: 64, color: 'grey.400' }} />
                            <Typography variant="body1" color="text.secondary" textAlign="center">
                                Camera not active
                            </Typography>
                            <Button
                                variant="outlined"
                                onClick={() => setIsCameraActive(true)}
                                startIcon={<CameraAlt />}
                            >
                                Enable Camera
                            </Button>
                            <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ px: 2 }}>
                                You may need to allow camera permissions when prompted
                            </Typography>
                            <Button
                                size="small"
                                onClick={async () => {
                                    const supported = camera.isSupported();
                                    const permission = await camera.checkPermissions();
                                    const info = `
Support: ${supported}
Permission: ${permission}
Protocol: ${location.protocol}
Host: ${location.hostname}
Navigator: ${!!navigator.mediaDevices}
getUserMedia: ${!!navigator.mediaDevices?.getUserMedia}
                                    `.trim();
                                    alert(info);
                                }}
                            >
                                Debug Info
                            </Button>
                        </Stack>
                    </Box>
                )}
            </Paper>

            {/* Current Lens - Shows film roll's current lens */}
            {filmRoll.currentLensId && (() => {
                const currentLens = lenses.find(l => l.id === filmRoll.currentLensId);
                return currentLens ? (
                    <Box mb={2}>
                        <Chip
                            label={`📷 ${currentLens.name}`}
                            onClick={() => setShowLensChangeDialog(true)}
                            variant="filled"
                            color="primary"
                            size="medium"
                            sx={{ fontWeight: 'bold' }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            Click to change lens
                        </Typography>
                    </Box>
                ) : null;
            })()}

            {/* Settings Chips */}
            <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" gap={1}>
                {!filmRoll.currentLensId && (
                    <Chip
                        label="+ Select Lens"
                        onClick={() => setShowLensChangeDialog(true)}
                        variant="outlined"
                        size="small"
                        color="default"
                    />
                )}
                <Chip
                    label={`${currentSettings.aperture}`}
                    onClick={openSettingsDialog}
                    variant="outlined"
                    size="small"
                />
                <Chip
                    label={`${currentSettings.shutterSpeed}`}
                    onClick={openSettingsDialog}
                    variant="outlined"
                    size="small"
                />
                {currentSettings.ei && (
                    <Chip
                        label={`EI ${currentSettings.ei}`}
                        onClick={openSettingsDialog}
                        variant="outlined"
                        size="small"
                        color="secondary"
                    />
                )}
                {currentSettings.focalLength && (
                    <Chip
                        label={`${currentSettings.focalLength}mm`}
                        onClick={openSettingsDialog}
                        variant="outlined"
                        size="small"
                    />
                )}
                <Chip
                    label="Info"
                    onClick={openSettingsDialog}
                    variant="outlined"
                    size="small"
                    color={currentSettings.additionalInfo ? "primary" : "default"}
                />
            </Stack>

            {/* Controls */}
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                <Button
                    variant="outlined"
                    onClick={() => fileInputRef.current?.click()}
                    startIcon={<PhotoLibrary />}
                >
                    Gallery
                </Button>

                <Fab
                    color="primary"
                    size="large"
                    onClick={isCameraActive ? capturePhoto : () => setIsCameraActive(true)}
                    disabled={exposuresLeft <= 0}
                    sx={{
                        fontSize: '1.5rem',
                        '&:disabled': {
                            backgroundColor: 'grey.300'
                        }
                    }}
                >
                    <PhotoCamera />
                </Fab>

                <Button
                    variant="outlined"
                    onClick={() => setIsCameraActive(!isCameraActive)}
                >
                    {isCameraActive ? 'Stop' : 'Camera'}
                </Button>
            </Stack>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
            />

            {/* Settings Dialog */}
            <Dialog open={showSettingsDialog} onClose={() => setShowSettingsDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="h6">Exposure Settings</Typography>
                        <IconButton onClick={() => setShowSettingsDialog(false)}>
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        {/* Lens Selection */}
                        <FormControl fullWidth>
                            <InputLabel>Lens</InputLabel>
                            <Select
                                value={currentSettings.lensId || ''}
                                onChange={(e) => {
                                    const newLensId = e.target.value;
                                    setCurrentSettings(prev => {
                                        const lens = lenses.find(l => l.id === newLensId);
                                        let newFocalLength = prev.focalLength;

                                        if (lens) {
                                            if (lens.focalLength !== undefined) {
                                                // Prime lens: set to fixed focal length
                                                newFocalLength = lens.focalLength;
                                            } else if (lens.focalLengthMin !== undefined && lens.focalLengthMax !== undefined) {
                                                // Zoom lens: set to midpoint
                                                newFocalLength = Math.round((lens.focalLengthMin + lens.focalLengthMax) / 2 / 5) * 5;
                                            }
                                        }
                                        // If no lens selected, keep current focal length

                                        return {
                                            ...prev,
                                            lensId: newLensId || undefined,
                                            focalLength: newFocalLength
                                        };
                                    });
                                }}
                                label="Lens"
                            >
                                <MenuItem value="">
                                    <em>None selected</em>
                                </MenuItem>
                                {lenses.map((lens) => (
                                    <MenuItem key={lens.id} value={lens.id}>
                                        {lens.name} ({lens.maxAperture})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Aperture - limited by lens */}
                        <FormControl fullWidth>
                            <InputLabel>Aperture</InputLabel>
                            <Select
                                value={currentSettings.aperture}
                                onChange={(e) => setCurrentSettings(prev => ({ ...prev, aperture: e.target.value as typeof APERTURE[keyof typeof APERTURE] }))}
                                label="Aperture"
                            >
                                {(() => {
                                    const selectedLens = lenses.find(l => l.id === currentSettings.lensId);
                                    const maxAperture = selectedLens?.maxAperture;

                                    // If lens selected, filter apertures >= maxAperture
                                    const availableApertures = maxAperture
                                        ? APERTURE_VALUES.filter(v => {
                                            const vNum = parseFloat(v.replace('f/', ''));
                                            const maxNum = parseFloat(maxAperture.replace('f/', ''));
                                            return vNum >= maxNum;
                                        })
                                        : APERTURE_VALUES;

                                    return availableApertures.map((value) => (
                                        <MenuItem key={value} value={value}>
                                            {value}
                                        </MenuItem>
                                    ));
                                })()}
                            </Select>
                        </FormControl>

                        {/* Shutter Speed */}
                        <FormControl fullWidth>
                            <InputLabel>Shutter Speed</InputLabel>
                            <Select
                                value={currentSettings.shutterSpeed}
                                onChange={(e) => setCurrentSettings(prev => ({ ...prev, shutterSpeed: e.target.value as typeof SHUTTER_SPEED[keyof typeof SHUTTER_SPEED] }))}
                                label="Shutter Speed"
                            >
                                {SHUTTER_SPEED_VALUES.map((value) => (
                                    <MenuItem key={value} value={value}>
                                        {value}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* EI (Exposure Index) */}
                        <Box>
                            <FormControl fullWidth>
                                <InputLabel>EI (Exposure Index)</InputLabel>
                                <Select
                                    value={currentSettings.ei?.toString() || 'film'}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === 'film') {
                                            setCurrentSettings(prev => ({ ...prev, ei: undefined }));
                                        } else if (value === 'custom') {
                                            setCurrentSettings(prev => ({ ...prev, ei: undefined }));
                                        } else {
                                            setCurrentSettings(prev => ({ ...prev, ei: parseInt(value) }));
                                        }
                                    }}
                                    label="EI (Exposure Index)"
                                >
                                    <MenuItem value="film">
                                        <em>Use film ISO ({filmRoll.iso})</em>
                                    </MenuItem>
                                    {EI_VALUES.map((value) => (
                                        <MenuItem key={value} value={value.toString()}>
                                            {value}
                                        </MenuItem>
                                    ))}
                                    <MenuItem value="custom">
                                        <em>Custom value...</em>
                                    </MenuItem>
                                </Select>
                            </FormControl>
                            {currentSettings.ei !== undefined && !EI_VALUES.includes(currentSettings.ei as any) && (
                                <TextField
                                    fullWidth
                                    label="Custom EI"
                                    type="number"
                                    value={currentSettings.ei || ''}
                                    onChange={(e) => setCurrentSettings(prev => ({ ...prev, ei: parseInt(e.target.value) || undefined }))}
                                    inputProps={{ min: 1, max: 10000 }}
                                    sx={{ mt: 2 }}
                                />
                            )}
                        </Box>

                        {/* Focal Length Slider */}
                        <Box>
                            {(() => {
                                const selectedLens = lenses.find(l => l.id === currentSettings.lensId);
                                const isPrime = selectedLens && selectedLens.focalLength !== undefined;
                                const isZoom = selectedLens && selectedLens.focalLengthMin !== undefined && selectedLens.focalLengthMax !== undefined;

                                // Slider always shows full range 1-200mm
                                const sliderMin = 1;
                                const sliderMax = 200;
                                let sliderStep = 1;
                                let sliderDisabled = false;
                                let currentValue = currentSettings.focalLength || 50;

                                // Constraints for zoom lens
                                let zoomMin: number | undefined;
                                let zoomMax: number | undefined;

                                if (isPrime) {
                                    // Prime lens: set to fixed focal length and disable
                                    currentValue = selectedLens.focalLength!;
                                    sliderDisabled = true;
                                } else if (isZoom) {
                                    // Zoom lens: remember constraints but show full slider
                                    zoomMin = selectedLens.focalLengthMin!;
                                    zoomMax = selectedLens.focalLengthMax!;
                                    sliderStep = 5;

                                    // Ensure current value is within range and snapped to step
                                    if (currentValue < zoomMin) currentValue = zoomMin;
                                    if (currentValue > zoomMax) currentValue = zoomMax;
                                    // Snap to nearest step
                                    currentValue = Math.round(currentValue / sliderStep) * sliderStep;
                                }
                                // No lens selected: use default values (already set above)

                                return (
                                    <>
                                        <Typography gutterBottom>
                                            Focal Length: {currentValue || 'Not set'}mm
                                            {isPrime && ' (Prime lens - fixed)'}
                                            {isZoom && ` (${zoomMin}-${zoomMax}mm zoom)`}
                                        </Typography>
                                        <Slider
                                            value={currentValue}
                                            onChange={(_, value) => {
                                                let newValue = value as number;
                                                // Constrain to zoom range if zoom lens
                                                if (isZoom && zoomMin !== undefined && zoomMax !== undefined) {
                                                    newValue = Math.max(zoomMin, Math.min(zoomMax, newValue));
                                                }
                                                setCurrentSettings(prev => ({ ...prev, focalLength: newValue }));
                                            }}
                                            min={sliderMin}
                                            max={sliderMax}
                                            step={sliderStep}
                                            marks={[
                                                { value: 1, label: '1' },
                                                { value: 28, label: '28' },
                                                { value: 50, label: '50' },
                                                { value: 85, label: '85' },
                                                { value: 135, label: '135' },
                                                { value: 200, label: '200' }
                                            ]}
                                            valueLabelDisplay="auto"
                                            disabled={sliderDisabled}
                                            sx={{
                                                ...(sliderDisabled && {
                                                    '& .MuiSlider-thumb': {
                                                        backgroundColor: 'grey.500'
                                                    },
                                                    '& .MuiSlider-track': {
                                                        backgroundColor: 'grey.500'
                                                    }
                                                })
                                            }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Manual Focal Length (mm)"
                                            type="number"
                                            value={currentValue || ''}
                                            onChange={(e) => {
                                                const value = parseInt(e.target.value);
                                                if (isZoom && value && zoomMin !== undefined && zoomMax !== undefined) {
                                                    // Constrain to zoom range
                                                    const constrained = Math.max(zoomMin, Math.min(zoomMax, value));
                                                    setCurrentSettings(prev => ({ ...prev, focalLength: constrained }));
                                                } else if (!isPrime) {
                                                    // Allow any value if not a prime lens
                                                    setCurrentSettings(prev => ({ ...prev, focalLength: value || undefined }));
                                                }
                                            }}
                                            inputProps={{
                                                min: isZoom && zoomMin ? zoomMin : 1,
                                                max: isZoom && zoomMax ? zoomMax : 10000
                                            }}
                                            size="small"
                                            sx={{ mt: 1 }}
                                            disabled={isPrime}
                                        />
                                    </>
                                );
                            })()}
                        </Box>

                        {/* Additional Info */}
                        <TextField
                            fullWidth
                            label="Additional Info"
                            value={currentSettings.additionalInfo}
                            onChange={(e) => setCurrentSettings(prev => ({ ...prev, additionalInfo: e.target.value }))}
                            placeholder="Notes about this shot..."
                            multiline
                            rows={3}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowSettingsDialog(false)} variant="contained">
                        Done
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Lens Change Dialog */}
            <Dialog open={showLensChangeDialog} onClose={() => setShowLensChangeDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="h6">Change Lens</Typography>
                        <IconButton onClick={() => setShowLensChangeDialog(false)}>
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2}>
                        <Typography variant="body2" color="text.secondary">
                            Select a lens to use for upcoming shots. This will update the film roll and all new exposures will use this lens.
                        </Typography>
                        <FormControl fullWidth>
                            <InputLabel>Lens</InputLabel>
                            <Select
                                value={filmRoll.currentLensId || ''}
                                onChange={(e) => handleLensChange(e.target.value)}
                                label="Lens"
                            >
                                <MenuItem value="">
                                    <em>None selected</em>
                                </MenuItem>
                                {lenses.map((lens) => (
                                    <MenuItem key={lens.id} value={lens.id}>
                                        {lens.name} ({lens.maxAperture})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {lenses.length === 0 && (
                            <Typography variant="body2" color="warning.main">
                                No lenses available. Add lenses in the Cameras tab.
                            </Typography>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowLensChangeDialog(false)}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};