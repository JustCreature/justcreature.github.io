import React, { useState, useRef } from 'react';
import {
    Box,
    Container,
    Typography,
    IconButton,
    Button,
    TextField,
    Paper,
    Stack,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Slider
} from '@mui/material';
import {
    ArrowBack,
    Edit,
    PhotoCamera,
    PhotoLibrary,
    LocationOn,
    AccessTime,
    Save,
    Close,
    Delete
} from '@mui/icons-material';
import { camera, fileUtils } from '../utils/camera';
import { APERTURE, APERTURE_VALUES, SHUTTER_SPEED, SHUTTER_SPEED_VALUES, EI_VALUES, type Exposure, type Lens } from '../types';

interface DetailsScreenProps {
    exposure: Exposure;
    lenses: Lens[];
    onExposureUpdate: (exposure: Exposure) => void;
    onExposureDelete?: (exposureId: string) => void;
    onBack: () => void;
}

export const DetailsScreen: React.FC<DetailsScreenProps> = ({
    exposure,
    lenses,
    onExposureUpdate,
    onExposureDelete,
    onBack
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showCameraDialog, setShowCameraDialog] = useState(false);
    const [editedExposure, setEditedExposure] = useState(exposure);

    const formatDateTime = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const handleSave = () => {
        onExposureUpdate(editedExposure);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedExposure(exposure);
        setIsEditing(false);
    };

    const handleDelete = () => {
        const confirmed = window.confirm(
            `Are you sure you want to delete exposure #${exposure.exposureNumber}?\n\n` +
            'This action cannot be undone and you will be taken back to the gallery.'
        );

        if (confirmed && onExposureDelete) {
            onExposureDelete(exposure.id);
            onBack(); // Navigate back to gallery after deletion
        }
    };

    const handleImageChange = async (file: File) => {
        try {
            const imageData = await fileUtils.fileToBase64(file);
            setEditedExposure(prev => ({ ...prev, imageData }));
        } catch (error) {
            console.error('Error processing image:', error);
            alert('Error processing selected image');
        }
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            await handleImageChange(file);
        }
        event.target.value = '';
    };

    const startCamera = async () => {
        try {
            if (!camera.isSupported()) {
                alert('Camera not supported on this device');
                return;
            }

            // For simplicity, we'll just open the file picker
            // In a real app, you'd implement a camera capture dialog
            fileInputRef.current?.click();
            setShowCameraDialog(false);
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Error accessing camera');
        }
    };

    return (
        <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box display="flex" alignItems="center" justifyContent="space-between" py={2}>
                <Box display="flex" alignItems="center">
                    <IconButton onClick={onBack} sx={{ mr: 1 }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h6" fontWeight="bold">
                        Exposure #{exposure.exposureNumber}
                    </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                    <IconButton onClick={() => setIsEditing(!isEditing)} color="primary">
                        <Edit />
                    </IconButton>
                    {onExposureDelete && (
                        <IconButton
                            onClick={handleDelete}
                            sx={{
                                color: 'text.secondary',
                                '&:hover': { color: 'error.main' }
                            }}
                        >
                            <Delete />
                        </IconButton>
                    )}
                </Box>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto' }}>
                {/* Image */}
                {editedExposure.imageData && (
                    <Paper elevation={3} sx={{ mb: 3, position: 'relative' }}>
                        <img
                            src={editedExposure.imageData}
                            alt={`Exposure ${exposure.exposureNumber}`}
                            style={{
                                width: '100%',
                                height: 'auto',
                                maxHeight: '300px',
                                objectFit: 'contain',
                                display: 'block'
                            }}
                        />
                        {isEditing && (
                            <Box
                                position="absolute"
                                top={8}
                                right={8}
                                display="flex"
                                gap={1}
                            >
                                <IconButton
                                    size="small"
                                    onClick={() => setShowCameraDialog(true)}
                                    sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: 'white' }}
                                >
                                    <PhotoCamera />
                                </IconButton>
                                <IconButton
                                    size="small"
                                    onClick={() => fileInputRef.current?.click()}
                                    sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: 'white' }}
                                >
                                    <PhotoLibrary />
                                </IconButton>
                            </Box>
                        )}
                    </Paper>
                )}

                {/* Metadata */}
                <Stack spacing={3}>
                    {/* Camera Settings */}
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Camera Settings
                        </Typography>
                        <Stack spacing={2}>
                            {isEditing ? (
                                <>
                                    {/* Lens Selection */}
                                    <FormControl fullWidth>
                                        <InputLabel>Lens</InputLabel>
                                        <Select
                                            value={editedExposure.lensId || ''}
                                            onChange={(e) => {
                                                const newLensId = e.target.value;
                                                setEditedExposure(prev => {
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

                                    {/* Aperture */}
                                    <FormControl fullWidth>
                                        <InputLabel>Aperture</InputLabel>
                                        <Select
                                            value={editedExposure.aperture}
                                            onChange={(e) => setEditedExposure(prev => ({ ...prev, aperture: e.target.value as typeof APERTURE[keyof typeof APERTURE] }))}
                                            label="Aperture"
                                        >
                                            {APERTURE_VALUES.map((value) => (
                                                <MenuItem key={value} value={value}>
                                                    {value}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    {/* Shutter Speed */}
                                    <FormControl fullWidth>
                                        <InputLabel>Shutter Speed</InputLabel>
                                        <Select
                                            value={editedExposure.shutterSpeed}
                                            onChange={(e) => setEditedExposure(prev => ({ ...prev, shutterSpeed: e.target.value as typeof SHUTTER_SPEED[keyof typeof SHUTTER_SPEED] }))}
                                            label="Shutter Speed"
                                        >
                                            {SHUTTER_SPEED_VALUES.map((value) => (
                                                <MenuItem key={value} value={value}>
                                                    {value}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    {/* EI */}
                                    <FormControl fullWidth>
                                        <InputLabel>EI (Exposure Index)</InputLabel>
                                        <Select
                                            value={editedExposure.ei?.toString() || ''}
                                            onChange={(e) => setEditedExposure(prev => ({ ...prev, ei: e.target.value ? parseInt(e.target.value) : undefined }))}
                                            label="EI (Exposure Index)"
                                        >
                                            <MenuItem value="">
                                                <em>Not set</em>
                                            </MenuItem>
                                            {EI_VALUES.map((value) => (
                                                <MenuItem key={value} value={value.toString()}>
                                                    {value}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    {/* Focal Length */}
                                    <Box>
                                        {(() => {
                                            const selectedLens = lenses.find(l => l.id === editedExposure.lensId);
                                            const isPrime = selectedLens && selectedLens.focalLength !== undefined;
                                            const isZoom = selectedLens && selectedLens.focalLengthMin !== undefined && selectedLens.focalLengthMax !== undefined;

                                            let sliderMin = 1;
                                            let sliderMax = 200;
                                            let sliderStep = 1;
                                            let sliderDisabled = false;
                                            let currentValue = editedExposure.focalLength || 50;

                                            if (isPrime) {
                                                // Prime lens: set to fixed focal length and disable
                                                currentValue = selectedLens.focalLength!;
                                                sliderDisabled = true;
                                            } else if (isZoom) {
                                                // Zoom lens: constrain to lens range with step=5
                                                sliderMin = selectedLens.focalLengthMin!;
                                                sliderMax = selectedLens.focalLengthMax!;
                                                sliderStep = 5;

                                                // Ensure current value is within range and snapped to step
                                                if (currentValue < sliderMin) currentValue = sliderMin;
                                                if (currentValue > sliderMax) currentValue = sliderMax;
                                                // Snap to nearest step
                                                currentValue = Math.round(currentValue / sliderStep) * sliderStep;
                                            }
                                            // No lens selected: use default values (already set above)

                                            return (
                                                <>
                                                    <Typography gutterBottom>
                                                        Focal Length: {currentValue || 'Not set'}mm
                                                        {isPrime && ' (Prime lens - fixed)'}
                                                        {isZoom && ` (${sliderMin}-${sliderMax}mm zoom)`}
                                                    </Typography>
                                                    <Slider
                                                        value={currentValue}
                                                        onChange={(_, value) => setEditedExposure(prev => ({ ...prev, focalLength: value as number }))}
                                                        min={sliderMin}
                                                        max={sliderMax}
                                                        step={sliderStep}
                                                        marks={[
                                                            { value: sliderMin, label: `${sliderMin}mm` },
                                                            ...(sliderMin < 50 && sliderMax > 50 ? [{ value: 50, label: '50mm' }] : []),
                                                            ...(sliderMin < 100 && sliderMax > 100 ? [{ value: 100, label: '100mm' }] : []),
                                                            { value: sliderMax, label: `${sliderMax}mm` }
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
                                                            if (isZoom && value) {
                                                                // Constrain to zoom range
                                                                const constrained = Math.max(sliderMin, Math.min(sliderMax, value));
                                                                setEditedExposure(prev => ({ ...prev, focalLength: constrained }));
                                                            } else if (!isPrime) {
                                                                // Allow any value if not a prime lens
                                                                setEditedExposure(prev => ({ ...prev, focalLength: value || undefined }));
                                                            }
                                                        }}
                                                        inputProps={{
                                                            min: isZoom ? sliderMin : 1,
                                                            max: isZoom ? sliderMax : 10000
                                                        }}
                                                        size="small"
                                                        sx={{ mt: 1 }}
                                                        disabled={isPrime}
                                                    />
                                                </>
                                            );
                                        })()}
                                    </Box>
                                </>
                            ) : (
                                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                                    {(() => {
                                        const lens = lenses.find(l => l.id === exposure.lensId);
                                        return lens && (
                                            <Chip label={lens.name} color="primary" />
                                        );
                                    })()}
                                    <Chip label={exposure.aperture} />
                                    <Chip label={exposure.shutterSpeed} />
                                    {exposure.ei && <Chip label={`EI ${exposure.ei}`} color="secondary" />}
                                    {exposure.focalLength && <Chip label={`${exposure.focalLength}mm`} />}
                                </Stack>
                            )}
                        </Stack>
                    </Paper>

                    {/* Additional Info */}
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Notes
                        </Typography>
                        {isEditing ? (
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                value={editedExposure.additionalInfo}
                                onChange={(e) => setEditedExposure(prev => ({ ...prev, additionalInfo: e.target.value }))}
                                placeholder="Add notes about this exposure..."
                            />
                        ) : (
                            <Typography variant="body1">
                                {exposure.additionalInfo || 'No notes added'}
                            </Typography>
                        )}
                    </Paper>

                    {/* Location & Time */}
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Details
                        </Typography>
                        <Stack spacing={2}>
                            <Box display="flex" alignItems="center">
                                <AccessTime sx={{ mr: 1, color: 'text.secondary' }} />
                                <Typography variant="body1">
                                    {formatDateTime(exposure.capturedAt)}
                                </Typography>
                            </Box>

                            {exposure.location && (
                                <Box display="flex" alignItems="center">
                                    <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                                    <Typography variant="body1">
                                        {exposure.location.latitude.toFixed(6)}, {exposure.location.longitude.toFixed(6)}
                                    </Typography>
                                </Box>
                            )}
                        </Stack>
                    </Paper>
                </Stack>
            </Box>

            {/* Edit Actions */}
            {isEditing && (
                <Box display="flex" gap={2} py={2}>
                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={handleCancel}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleSave}
                        startIcon={<Save />}
                    >
                        Save
                    </Button>
                </Box>
            )}

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
            />

            {/* Camera Dialog */}
            <Dialog open={showCameraDialog} onClose={() => setShowCameraDialog(false)}>
                <DialogTitle>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="h6">Change Photo</Typography>
                        <IconButton onClick={() => setShowCameraDialog(false)}>
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<PhotoCamera />}
                            onClick={startCamera}
                        >
                            Take Photo
                        </Button>
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<PhotoLibrary />}
                            onClick={() => {
                                fileInputRef.current?.click();
                                setShowCameraDialog(false);
                            }}
                        >
                            Choose from Gallery
                        </Button>
                    </Stack>
                </DialogContent>
            </Dialog>
        </Container>
    );
};