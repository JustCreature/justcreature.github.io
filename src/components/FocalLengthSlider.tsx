import React from 'react';
import {
    Box,
    Typography,
    Slider,
    TextField
} from '@mui/material';
import type { Lens } from '../types';

interface FocalLengthSliderProps {
    value: number | undefined;
    onChange: (value: number | undefined) => void;
    lenses: Lens[];
    selectedLensId?: string;
    disabled?: boolean;
}

export const FocalLengthSlider: React.FC<FocalLengthSliderProps> = ({
    value,
    onChange,
    lenses,
    selectedLensId,
    disabled = false
}) => {
    const selectedLens = lenses.find(l => l.id === selectedLensId);
    const isPrime = selectedLens && selectedLens.focalLength !== undefined;
    const isZoom = selectedLens && selectedLens.focalLengthMin !== undefined && selectedLens.focalLengthMax !== undefined;

    // Slider always shows full range 1-200mm
    const sliderMin = 1;
    const sliderMax = 200;
    let sliderStep = 1;
    let sliderDisabled = disabled || false;
    let currentValue = value || 50;

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
        <Box>
            <Typography gutterBottom>
                Focal Length: {currentValue || 'Not set'}mm
                {isPrime && ' (Prime lens - fixed)'}
                {isZoom && ` (${zoomMin}-${zoomMax}mm zoom)`}
            </Typography>
            <Slider
                value={currentValue}
                onChange={(_, newValue) => {
                    let adjustedValue = newValue as number;
                    // Constrain to zoom range if zoom lens
                    if (isZoom && zoomMin !== undefined && zoomMax !== undefined) {
                        adjustedValue = Math.max(zoomMin, Math.min(zoomMax, adjustedValue));
                    }
                    onChange(adjustedValue);
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
                    const inputValue = parseInt(e.target.value);
                    if (isZoom && inputValue && zoomMin !== undefined && zoomMax !== undefined) {
                        // Constrain to zoom range
                        const constrained = Math.max(zoomMin, Math.min(zoomMax, inputValue));
                        onChange(constrained);
                    } else if (!isPrime) {
                        // Allow any value if not a prime lens
                        onChange(inputValue || undefined);
                    }
                }}
                inputProps={{
                    min: isZoom && zoomMin ? zoomMin : 1,
                    max: isZoom && zoomMax ? zoomMax : 10000
                }}
                size="small"
                sx={{ mt: 1 }}
                disabled={isPrime || disabled}
            />
        </Box>
    );
};
