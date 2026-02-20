import React from 'react';
import { Box, Typography, Slider } from '@mui/material';
import { SHUTTER_SPEED_VALUES } from '../types';

interface LightMeterSliderProps {
    aperture: string;
    suggestedShutterSpeed: string;
    onApertureChange: (aperture: string) => void;
    availableApertures: string[];
    ev: number;
    mode?: 'hardware' | 'fallback';
}

export const LightMeterSlider: React.FC<LightMeterSliderProps> = ({
    aperture,
    suggestedShutterSpeed,
    onApertureChange,
    availableApertures,
    ev,
    mode = 'fallback'
}) => {
    // Find index of current aperture
    const currentIndex = availableApertures.indexOf(aperture);

    // Filter shutter speeds to show (exclude BULB and slow speeds for cleaner display)
    const displayShutterSpeeds = SHUTTER_SPEED_VALUES.filter(speed =>
        speed !== 'BULB' && !speed.includes('"')
    ).slice(0, 10); // Show top 10 speeds

    return (
        <Box sx={{
            position: 'absolute',
            right: 10,
            top: 80,
            bottom: 80,
            width: 120,
            zIndex: 15,
            backgroundColor: mode === 'hardware' ? 'rgba(0, 150, 0, 0.5)' : 'rgba(0, 0, 0, 0.5)',
            borderRadius: 2,
            padding: 2,
            backdropFilter: 'blur(4px)',
            display: 'flex',
            flexDirection: 'column',
            transition: 'background-color 0.3s ease'
        }}>
            {/* EV Display */}
            <Typography variant="caption" color="white" align="center" sx={{ mb: 0.5, fontWeight: 600 }}>
                EV {ev.toFixed(1)}
            </Typography>
            {/* Mode indicator */}
            <Typography variant="caption" color="white" align="center" sx={{ mb: 1, fontSize: '8px', opacity: 0.8 }}>
                {mode === 'hardware' ? '● Hardware' : '○ Estimated'}
            </Typography>

            {/* Dual column layout */}
            <Box sx={{ flex: 1, display: 'flex', position: 'relative' }}>
                {/* Left: Shutter speeds (read-only) */}
                <Box sx={{ flex: 1, position: 'relative' }}>
                    {displayShutterSpeeds.map((speed, idx) => (
                        <Typography
                            key={speed}
                            variant="caption"
                            color="white"
                            sx={{
                                position: 'absolute',
                                top: `${(idx / (displayShutterSpeeds.length - 1)) * 100}%`,
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
                <Box sx={{ width: 1, backgroundColor: 'rgba(255,255,255,0.3)', mx: 0.5 }} />

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
                            },
                            '& .MuiSlider-mark': {
                                backgroundColor: 'rgba(255,255,255,0.5)',
                                width: 2
                            }
                        }}
                    />
                </Box>
            </Box>

            {/* Exposure indicator */}
            <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography variant="caption" color="#4CAF50" sx={{ fontSize: '10px' }}>
                    ● Correct
                </Typography>
            </Box>
        </Box>
    );
};
