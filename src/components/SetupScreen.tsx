import React, { useState } from 'react';
import {
    Box,
    Container,
    Typography,
    TextField,
    Button,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import { PhotoCamera, Settings } from '@mui/icons-material';
import type { FilmRoll, Camera, Lens } from '../types';
import { EI_VALUES } from '../types';

interface SetupScreenProps {
    cameras?: Camera[];
    lenses?: Lens[];
    editingFilmRoll?: FilmRoll | null;
    onFilmRollCreated?: (filmRoll: FilmRoll) => void;
    onFilmRollUpdated?: (filmRoll: FilmRoll) => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({
    cameras = [],
    lenses = [],
    editingFilmRoll,
    onFilmRollCreated,
    onFilmRollUpdated
}) => {
    const [filmName, setFilmName] = useState(editingFilmRoll?.name || '');
    const [iso, setIso] = useState(editingFilmRoll?.iso?.toString() || '400');
    const [ei, setEi] = useState(editingFilmRoll?.ei?.toString() || '');
    const [useCustomEi, setUseCustomEi] = useState(false);
    const [totalExposures, setTotalExposures] = useState(editingFilmRoll?.totalExposures?.toString() || '36');
    const [selectedCameraId, setSelectedCameraId] = useState(editingFilmRoll?.cameraId || '');
    const [selectedLensId, setSelectedLensId] = useState(editingFilmRoll?.currentLensId || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!filmName.trim()) {
            alert('Please enter a film name');
            return;
        }

        const parsedEi = ei ? parseInt(ei) : undefined;

        if (editingFilmRoll) {
            // Update existing film roll
            const updatedFilmRoll: FilmRoll = {
                ...editingFilmRoll,
                name: filmName.trim(),
                iso: parseInt(iso) || 400,
                ei: parsedEi,
                totalExposures: parseInt(totalExposures) || 36,
                cameraId: selectedCameraId || undefined,
                currentLensId: selectedLensId || undefined
            };
            onFilmRollUpdated?.(updatedFilmRoll);
        } else {
            // Create new film roll
            const filmRoll: FilmRoll = {
                id: Date.now().toString(),
                name: filmName.trim(),
                iso: parseInt(iso) || 400,
                ei: parsedEi,
                totalExposures: parseInt(totalExposures) || 36,
                cameraId: selectedCameraId || undefined,
                currentLensId: selectedLensId || undefined,
                createdAt: new Date()
            };
            onFilmRollCreated?.(filmRoll);
        }
    };

    return (
        <Container maxWidth="sm" sx={{ pb: 4, pt: 4 }}>
            <Stack>
                <Box textAlign="center" mb={4}>
                    <PhotoCamera sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                        {editingFilmRoll ? 'Edit Film Roll' : 'Film Tracker'}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {editingFilmRoll
                            ? 'Update your film roll parameters'
                            : 'Set up your film parameters to start tracking exposures'
                        }
                    </Typography>
                </Box>

                <Box component="form" onSubmit={handleSubmit}>
                    <Stack spacing={3}>
                        <TextField
                            fullWidth
                            label="Film Name"
                            value={filmName}
                            onChange={(e) => setFilmName(e.target.value)}
                            placeholder="e.g., Kodak Portra 400"
                            required
                            autoFocus
                        />

                        <TextField
                            fullWidth
                            label="ISO"
                            type="number"
                            value={iso}
                            onChange={(e) => setIso(e.target.value)}
                            inputProps={{ min: 25, max: 6400 }}
                            required
                        />

                        <Box>
                            <FormControl fullWidth>
                                <InputLabel>EI (Exposure Index) - Optional</InputLabel>
                                <Select
                                    value={useCustomEi ? 'custom' : ei}
                                    label="EI (Exposure Index) - Optional"
                                    onChange={(e) => {
                                        if (e.target.value === 'custom') {
                                            setUseCustomEi(true);
                                            setEi('');
                                        } else {
                                            setUseCustomEi(false);
                                            setEi(e.target.value);
                                        }
                                    }}
                                >
                                    <MenuItem value="">
                                        <em>Same as ISO</em>
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
                            {useCustomEi && (
                                <TextField
                                    fullWidth
                                    label="Custom EI Value"
                                    type="number"
                                    value={ei}
                                    onChange={(e) => setEi(e.target.value)}
                                    inputProps={{ min: 1, max: 10000 }}
                                    sx={{ mt: 2 }}
                                />
                            )}
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                EI can differ from ISO when push/pull processing
                            </Typography>
                        </Box>

                        <TextField
                            fullWidth
                            label="Number of Exposures"
                            type="number"
                            value={totalExposures}
                            onChange={(e) => setTotalExposures(e.target.value)}
                            inputProps={{ min: 1, max: 100 }}
                            required
                        />

                        <FormControl fullWidth>
                            <InputLabel>Camera (Optional)</InputLabel>
                            <Select
                                value={selectedCameraId}
                                label="Camera (Optional)"
                                onChange={(e) => setSelectedCameraId(e.target.value)}
                            >
                                <MenuItem value="">
                                    <em>None selected</em>
                                </MenuItem>
                                {cameras.map((camera) => (
                                    <MenuItem key={camera.id} value={camera.id}>
                                        {camera.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Lens (Optional)</InputLabel>
                            <Select
                                value={selectedLensId}
                                label="Lens (Optional)"
                                onChange={(e) => setSelectedLensId(e.target.value)}
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

                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            fullWidth
                            startIcon={<Settings />}
                            sx={{ mt: 3, py: 1.5 }}
                        >
                            {editingFilmRoll ? 'Update Film Roll' : 'Start Film Roll'}
                        </Button>
                    </Stack>
                </Box>
            </Stack>
        </Container>
    );
};