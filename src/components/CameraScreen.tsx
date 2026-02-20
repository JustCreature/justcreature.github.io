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
    InputLabel
} from '@mui/material';
import {
    PhotoCamera,
    PhotoLibrary,
    CameraAlt,
    Close,
    ArrowBack
} from '@mui/icons-material';
import { camera, geolocation, lightMeter } from '../utils/camera';
import type { FilmRoll, Exposure, ExposureSettings, Lens } from '../types';
import { APERTURE, APERTURE_VALUES, SHUTTER_SPEED, SHUTTER_SPEED_VALUES, EI_VALUES } from '../types';
import { FocalLengthSlider } from './FocalLengthSlider';
import { FocalLengthRulerOverlay } from './FocalLengthRulerOverlay';
import { LightMeterSlider } from './LightMeterSlider';
import { colors } from '../theme';

// Add CSS for enhanced shutter effect animation
const shutterEffectStyles = `
@keyframes shutterEffect {
    0% { opacity: 0; transform: scaleY(0); }
    5% { opacity: 1; transform: scaleY(1); }
    95% { opacity: 1; transform: scaleY(1); }
    100% { opacity: 0; transform: scaleY(0); }
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
    const streamRef = useRef<MediaStream | null>(null);

    const [isCameraActive, setIsCameraActive] = useState(false);
    const [showSettingsDialog, setShowSettingsDialog] = useState(false);
    const [showShutterEffect, setShowShutterEffect] = useState(false);
    const [showLensChangeDialog, setShowLensChangeDialog] = useState(false);
    const [currentEV, setCurrentEV] = useState<number>(10); // Default EV
    const [suggestedShutterSpeed, setSuggestedShutterSpeed] = useState<string>('1/125');
    const [meterMode, setMeterMode] = useState<'hardware' | 'fallback'>('fallback');
    const showLightMeter = true; // Always show light meter (toggle can be added later)

    const currentExposureNumber = exposures.filter(e => e.filmRollId === filmRoll.id).length + 1;
    const exposuresLeft = filmRoll.totalExposures - (currentExposureNumber - 1);

    // Focal length simulator - use currentSettings.focalLength as source of truth
    const baseline = 24; // iPhone 13 standard camera equivalent
    const focalLength = currentSettings.focalLength || baseline;
    const zoomFactor = focalLength / baseline;
    const showLetterbox = focalLength < baseline;

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

    // Continuous brightness monitoring for light meter using camera hardware data
    useEffect(() => {
        if (!isCameraActive || !streamRef.current) return;

        // Analyze brightness every 1000ms
        const intervalId = setInterval(() => {
            if (streamRef.current) {
                // Try to get camera's actual exposure data (more accurate)
                const cameraData = lightMeter.getCameraExposureData(streamRef.current);

                let ev: number;

                if (cameraData) {
                    // Use hardware data to calculate EV
                    ev = lightMeter.calculateEVFromCamera(
                        cameraData.iso,
                        cameraData.exposureTime,
                        currentSettings.aperture
                    );
                    setMeterMode('hardware');
                    console.log('✓ Using camera hardware data:', { cameraData, ev });
                } else {
                    // Fallback to canvas-based brightness analysis
                    if (videoRef.current && videoRef.current.videoWidth > 0) {
                        const brightness = lightMeter.analyzeFrameBrightness(videoRef.current);
                        ev = lightMeter.brightnessToEV(brightness);
                        setMeterMode('fallback');
                        console.log('⚠ Using fallback brightness analysis (less accurate):', { brightness, ev });
                    } else {
                        return; // Video not ready
                    }
                }

                setCurrentEV(ev);

                // Calculate suggested shutter speed
                const iso = filmRoll.ei || filmRoll.iso;
                const shutter = lightMeter.calculateShutterSpeed(
                    currentSettings.aperture,
                    ev,
                    iso
                );
                setSuggestedShutterSpeed(shutter);

                console.log('Light meter result:', { ev, shutter, filmIso: iso, mode: cameraData ? 'hardware' : 'fallback' });
            }
        }, 1000); // Update every 1 second

        return () => clearInterval(intervalId);
    }, [isCameraActive, currentSettings.aperture, filmRoll.iso, filmRoll.ei]);

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

            // Capture the image with zoom factor applied
            const imageData = camera.captureImage(videoRef.current, zoomFactor);

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

    // Get available apertures based on current lens
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

    return (
        <Container maxWidth="sm" sx={{ height: '100vh', py: 2, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                    {onBack && (
                        <IconButton onClick={onBack} color="primary" aria-label="Back">
                            <ArrowBack />
                        </IconButton>
                    )}
                    <Box>
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 600,
                                color: colors.charcoal,
                                mb: 0.5,
                            }}
                        >
                            {filmRoll.name}
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                color: colors.silverGray,
                                fontVariantNumeric: 'tabular-nums',
                                letterSpacing: '0.02em',
                            }}
                        >
                            <Box component="span" sx={{ fontWeight: 600, color: colors.deepAmber }}>
                                {currentExposureNumber}
                            </Box>
                            /{filmRoll.totalExposures}
                            <Box component="span" sx={{ mx: 1, color: colors.coolGray }}>•</Box>
                            <Box component="span" sx={{ fontWeight: 500 }}>
                                {exposuresLeft} remaining
                            </Box>
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={onOpenGallery} color="primary" aria-label="View Gallery">
                    <PhotoLibrary />
                </IconButton>
            </Box>

            {/* Camera View - Viewfinder Frame */}
            <Paper
                elevation={0}
                sx={{
                    flex: 1,
                    position: 'relative',
                    overflow: 'hidden',
                    mb: 2,
                    border: `3px solid ${colors.charcoal}`,
                    borderRadius: 2,
                    boxShadow: `
                        inset 0 0 0 1px rgba(255, 255, 255, 0.3),
                        0 4px 12px rgba(0, 0, 0, 0.2)
                    `,
                    background: colors.charcoal,
                }}
            >
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
                                objectFit: 'cover',
                                transform: `scale(${zoomFactor})`,
                                transformOrigin: 'center center',
                                transition: 'transform 0.15s ease-out'
                            }}
                        />

                        {/* Letterbox bars for ultra-wide angles (<24mm) */}
                        {showLetterbox && (
                            <>
                                {/* Top black bar */}
                                <Box sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: '20%',
                                    backgroundColor: 'black',
                                    zIndex: 5,
                                    pointerEvents: 'none',
                                }} />
                                {/* Bottom black bar */}
                                <Box sx={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: '20%',
                                    backgroundColor: 'black',
                                    zIndex: 5,
                                    pointerEvents: 'none',
                                }} />
                            </>
                        )}

                        {/* Enhanced Shutter Effect Overlay */}
                        {showShutterEffect && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: colors.charcoal,
                                    zIndex: 10,
                                    animation: 'shutterEffect 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                                    transformOrigin: 'center',
                                }}
                            />
                        )}

                        {/* Focal Length Ruler Overlay */}
                        <FocalLengthRulerOverlay
                            value={focalLength}
                            onChange={(newValue) => {
                                // Update exposure settings (single source of truth)
                                setCurrentSettings(prev => ({
                                    ...prev,
                                    focalLength: newValue
                                }));
                            }}
                            baseline={baseline}
                        />

                        {/* Light Meter Overlay */}
                        {showLightMeter && (
                            <LightMeterSlider
                                aperture={currentSettings.aperture}
                                suggestedShutterSpeed={suggestedShutterSpeed}
                                onApertureChange={(newAperture) => {
                                    setCurrentSettings(prev => ({
                                        ...prev,
                                        aperture: newAperture as typeof APERTURE[keyof typeof APERTURE]
                                    }));
                                }}
                                availableApertures={getAvailableApertures()}
                                ev={currentEV}
                                mode={meterMode}
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
                            sx={{
                                fontWeight: 600,
                                fontSize: '0.9375rem',
                                py: 2.5,
                                px: 2,
                                bgcolor: colors.deepAmber,
                                color: 'white',
                                '&:hover': {
                                    bgcolor: '#b45309',
                                    boxShadow: '0 0 0 3px rgba(217, 119, 6, 0.2)',
                                },
                            }}
                        />
                        <Typography
                            variant="caption"
                            sx={{
                                ml: 1.5,
                                color: colors.silverGray,
                                fontSize: '0.75rem',
                                letterSpacing: '0.03em',
                            }}
                        >
                            Click to change lens
                        </Typography>
                    </Box>
                ) : null;
            })()}

            {/* Settings Chips - Technical Display */}
            <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" gap={1}>
                {!filmRoll.currentLensId && (
                    <Chip
                        label="+ Select Lens"
                        onClick={() => setShowLensChangeDialog(true)}
                        variant="outlined"
                        size="medium"
                        sx={{
                            borderColor: colors.deepAmber,
                            color: colors.deepAmber,
                            fontWeight: 600,
                            '&:hover': {
                                bgcolor: 'rgba(217, 119, 6, 0.08)',
                                borderColor: colors.deepAmber,
                            },
                        }}
                    />
                )}
                <Chip
                    label={currentSettings.aperture}
                    onClick={openSettingsDialog}
                    variant="filled"
                    size="medium"
                    sx={{
                        bgcolor: colors.coolGray,
                        color: colors.charcoal,
                        fontVariantNumeric: 'tabular-nums',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        '&:hover': {
                            bgcolor: '#e5e7eb',
                            boxShadow: `0 0 0 2px ${colors.deepAmber}`,
                        },
                    }}
                />
                <Chip
                    label={currentSettings.shutterSpeed}
                    onClick={openSettingsDialog}
                    variant="filled"
                    size="medium"
                    sx={{
                        bgcolor: colors.coolGray,
                        color: colors.charcoal,
                        fontVariantNumeric: 'tabular-nums',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        '&:hover': {
                            bgcolor: '#e5e7eb',
                            boxShadow: `0 0 0 2px ${colors.deepAmber}`,
                        },
                    }}
                />
                {currentSettings.ei && (
                    <Chip
                        label={`EI ${currentSettings.ei}`}
                        onClick={openSettingsDialog}
                        variant="filled"
                        size="medium"
                        sx={{
                            bgcolor: colors.seleniumGray,
                            color: 'white',
                            fontVariantNumeric: 'tabular-nums',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            '&:hover': {
                                bgcolor: '#1f2937',
                                boxShadow: `0 0 0 2px ${colors.deepAmber}`,
                            },
                        }}
                    />
                )}
                {currentSettings.focalLength && (
                    <Chip
                        label={`${currentSettings.focalLength}mm`}
                        onClick={openSettingsDialog}
                        variant="filled"
                        size="medium"
                        sx={{
                            bgcolor: colors.coolGray,
                            color: colors.charcoal,
                            fontVariantNumeric: 'tabular-nums',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            '&:hover': {
                                bgcolor: '#e5e7eb',
                                boxShadow: `0 0 0 2px ${colors.deepAmber}`,
                            },
                        }}
                    />
                )}
                <Chip
                    label="Info"
                    onClick={openSettingsDialog}
                    variant={currentSettings.additionalInfo ? "filled" : "outlined"}
                    size="medium"
                    sx={{
                        ...(currentSettings.additionalInfo ? {
                            bgcolor: colors.deepAmber,
                            color: 'white',
                            fontWeight: 600,
                            '&:hover': {
                                bgcolor: '#b45309',
                            },
                        } : {
                            borderColor: colors.silverGray,
                            color: colors.silverGray,
                            '&:hover': {
                                borderColor: colors.charcoal,
                                bgcolor: 'rgba(0, 0, 0, 0.04)',
                            },
                        }),
                    }}
                />
            </Stack>

            {/* Controls */}
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                <Fab
                    color="primary"
                    size="large"
                    onClick={isCameraActive ? capturePhoto : () => setIsCameraActive(true)}
                    disabled={exposuresLeft <= 0}
                    sx={{
                        width: 72,
                        height: 72,
                        bgcolor: colors.deepAmber,
                        boxShadow: `
                            0 4px 14px rgba(217, 119, 6, 0.4),
                            0 0 0 3px white,
                            0 0 0 5px ${colors.deepAmber}
                        `,
                        '&:hover': {
                            bgcolor: '#b45309',
                            boxShadow: `
                                0 6px 20px rgba(217, 119, 6, 0.5),
                                0 0 0 3px white,
                                0 0 0 5px ${colors.deepAmber}
                            `,
                        },
                        '&:active': {
                            transform: 'scale(0.95)',
                        },
                        '&:disabled': {
                            bgcolor: colors.coolGray,
                            boxShadow: 'none',
                        },
                        '& .MuiSvgIcon-root': {
                            fontSize: '2rem',
                        },
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
                        <FocalLengthSlider
                            value={currentSettings.focalLength}
                            onChange={(value) => setCurrentSettings(prev => ({ ...prev, focalLength: value }))}
                            lenses={lenses}
                            selectedLensId={currentSettings.lensId}
                        />

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