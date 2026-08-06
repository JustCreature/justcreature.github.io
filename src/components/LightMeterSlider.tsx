import React from 'react';
import { Box, Typography, Slider } from '@mui/material';
import { SHUTTER_SPEED_VALUES } from '../types';

interface LightMeterSliderProps {
    aperture: string; // Current aperture (user-controlled)
    suggestedShutterSpeed: string; // Auto-calculated shutter speed
    currentShutterSpeed: string; // The currently set shutter speed
    onApertureChange: (aperture: string) => void;
    onApplySuggestedShutterSpeed: () => void;
    availableApertures: string[]; // Based on current lens
    ev: number; // Current EV reading
}

export const LightMeterSlider: React.FC<LightMeterSliderProps> = ({
    aperture,
    suggestedShutterSpeed,
    currentShutterSpeed,
    onApertureChange,
    onApplySuggestedShutterSpeed,
    availableApertures,
    ev
}) => {
    // Find index of current aperture
    const currentIndex = availableApertures.indexOf(aperture);

    // Calculate exposure diff roughly based on indices
    const currentIdx = SHUTTER_SPEED_VALUES.indexOf(currentShutterSpeed as any);
    const suggestedIdx = SHUTTER_SPEED_VALUES.indexOf(suggestedShutterSpeed as any);
    let exposureStatus = '● Correct';
    let exposureColor = '#4CAF50';
    if (currentIdx > suggestedIdx) {
        // current is slower than suggested -> overexposed
        exposureStatus = '▲ Overexposed';
        exposureColor = '#FF9800';
    } else if (currentIdx < suggestedIdx) {
        // current is faster than suggested -> underexposed
        exposureStatus = '▼ Underexposed';
        exposureColor = '#2196F3';
    }

    return (
        <Box sx={{
            position: 'absolute',
            right: 10,
            top: 60,
            bottom: 120, // Increased to avoid focal length slider overlap
            width: 160, // Increased width
            zIndex: 20, // Increased zIndex to be safely above other overlays
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
            <Box sx={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
                {/* Left: Shutter speeds (read-only) */}
                <Box sx={{ flex: 1, position: 'relative', overflowY: 'hidden' }}>
                    {/* We map all shutter speeds but space them nicely and handle overflow.
                        Since 17 speeds overlapping is an issue, we calculate relative top position dynamically,
                        and omit some labels if they are too cramped. However, since we want to point to the suggested one,
                        we should ensure the suggested one is always visible.
                        Actually, an easier fix is to just let it be a flex column with space-between. */}
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        height: '100%',
                        position: 'absolute',
                        top: 0, bottom: 0, left: 4, right: 0
                    }}>
                        {SHUTTER_SPEED_VALUES.map((speed) => {
                            // Only show every other speed label, EXCEPT always show the suggested one
                            // Or better yet, just show it but very small with a minimum height so it doesn't overlap
                            const isSuggested = speed === suggestedShutterSpeed;
                            return (
                                <Box key={speed} sx={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    minHeight: '12px'
                                }}>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            fontSize: isSuggested ? '12px' : '9px',
                                            fontWeight: isSuggested ? 'bold' : 'normal',
                                            color: isSuggested ? '#4CAF50' : 'rgba(255,255,255,0.6)',
                                            lineHeight: 1
                                        }}
                                    >
                                        {isSuggested ? `→ ${speed}` : speed}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Box>
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
                <Typography variant="caption" sx={{ color: exposureColor, fontWeight: 'bold', fontSize: '10px' }}>
                    {exposureStatus}
                </Typography>
                {currentShutterSpeed !== suggestedShutterSpeed && (
                    <Typography
                        variant="caption"
                        sx={{
                            display: 'block',
                            color: 'white',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            fontSize: '10px',
                            mt: 0.5
                        }}
                        onClick={onApplySuggestedShutterSpeed}
                    >
                        Apply Suggested
                    </Typography>
                )}
            </Box>
        </Box>
    );
};
