import React, { useId } from 'react';
import { Box, Typography, Slider } from '@mui/material';
import { colors } from '../theme';

interface FocalLengthRulerOverlayProps {
    value: number; // Current focal length in mm
    onChange: (value: number) => void;
    baseline?: number; // Default 24mm for iPhone
}

export const FocalLengthRulerOverlay: React.FC<FocalLengthRulerOverlayProps> = ({
    value,
    onChange,
    baseline = 24
}) => {
    const id = useId();
    const [isDragging, setIsDragging] = React.useState(false);

    // Ruler marks for common focal lengths
    const marks = [
        { value: 15, label: '15' },
        { value: 24, label: '24' },
        { value: 35, label: '35' },
        { value: 50, label: '50' },
        { value: 85, label: '85' },
        { value: 135, label: '135' },
        { value: 200, label: '200' }
    ];

    // Handle slider change with visual feedback
    const handleChange = (_: Event, newValue: number | number[]) => {
        onChange(newValue as number);
    };

    return (
        <Box
            sx={{
                position: 'absolute',
                bottom: 10,
                left: 10,
                right: 10,
                zIndex: 20,
                pointerEvents: 'auto', // Ensure touch/click events work
            }}
        >
            {/* Container with semi-transparent background */}
            <Box
                sx={{
                    backgroundColor: isDragging ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.6)',
                    borderRadius: 2,
                    padding: '12px 16px',
                    backdropFilter: 'blur(8px)',
                    boxShadow: isDragging
                        ? '0 6px 16px rgba(0, 0, 0, 0.5)'
                        : '0 4px 12px rgba(0, 0, 0, 0.3)',
                    transition: 'all 0.2s ease',
                }}
            >
                {/* Current value display */}
                <Typography
                    variant="body2"
                    sx={{
                        color: 'white',
                        fontWeight: 600,
                        mb: 1.5,
                        textAlign: 'center',
                        fontSize: isDragging ? '1rem' : '0.875rem',
                        fontVariantNumeric: 'tabular-nums',
                        transition: 'font-size 0.2s ease',
                    }}
                >
                    Focal Length: {value}mm
                    {value < baseline && ' (Letterbox)'}
                </Typography>

                {/* Material-UI Slider */}
                <Slider
                    id={id}
                    value={value}
                    onChange={handleChange}
                    onChangeCommitted={() => setIsDragging(false)}
                    onMouseDown={() => setIsDragging(true)}
                    onTouchStart={() => setIsDragging(true)}
                    min={15}
                    max={200}
                    step={5}
                    marks={marks}
                    valueLabelDisplay="auto"
                    sx={{
                        color: 'white',
                        height: 8,
                        padding: '16px 0',
                        '& .MuiSlider-thumb': {
                            width: 32,
                            height: 32,
                            border: '3px solid white',
                            backgroundColor: colors.deepAmber,
                            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.4)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                boxShadow: '0 0 0 10px rgba(255, 255, 255, 0.16)',
                            },
                            '&:focus, &:active, &.Mui-active': {
                                boxShadow: '0 0 0 12px rgba(255, 255, 255, 0.2)',
                                width: 36,
                                height: 36,
                            },
                        },
                        '& .MuiSlider-track': {
                            border: 'none',
                            backgroundColor: 'white',
                        },
                        '& .MuiSlider-rail': {
                            opacity: 0.4,
                            backgroundColor: 'white',
                        },
                        '& .MuiSlider-mark': {
                            backgroundColor: 'white',
                            height: 12,
                            width: 2,
                            opacity: 0.7,
                            '&.MuiSlider-markActive': {
                                opacity: 1,
                                backgroundColor: 'white',
                            },
                        },
                        '& .MuiSlider-markLabel': {
                            color: 'white',
                            fontSize: '11px',
                            fontWeight: 600,
                            top: '28px',
                            opacity: 0.8,
                            '&.MuiSlider-markLabelActive': {
                                opacity: 1,
                            },
                        },
                        '& .MuiSlider-valueLabel': {
                            backgroundColor: colors.deepAmber,
                            borderRadius: 1,
                            padding: '4px 8px',
                            fontSize: '12px',
                            fontWeight: 600,
                        },
                    }}
                />
            </Box>
        </Box>
    );
};
