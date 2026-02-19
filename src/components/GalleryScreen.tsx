import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Card,
    CardMedia,
    CardContent,
    IconButton,
    Chip,
    Stack,
    Paper,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio
} from '@mui/material';
import {
    ArrowBack,
    PhotoCamera,
    LocationOn,
    AccessTime,
    CloudUpload,
    PhotoLibrary,
    Save,
    Share,
    Close,
    Delete,
    ContentCopy,
    Home
} from '@mui/icons-material';
import type { Exposure, FilmRoll, Lens } from '../types';
import { exportUtils, googleDriveUtils } from '../utils/exportImport';
import { geolocation, fileUtils } from '../utils/camera';
import { colors } from '../theme';

interface GalleryScreenProps {
    filmRoll: FilmRoll;
    lenses: Lens[];
    exposures: Exposure[];
    onExposureSelect: (exposure: Exposure) => void;
    onExposureDelete?: (exposureId: string) => void;
    onExposureUpdate?: (exposure: Exposure) => void;
    onBack: () => void;
    onHome?: () => void;
    onExposureTaken: (exposure: Exposure) => void;
    currentSettings: import('../types').ExposureSettings;
    setCurrentSettings: React.Dispatch<React.SetStateAction<import('../types').ExposureSettings>>;
}

export const GalleryScreen: React.FC<GalleryScreenProps> = ({
    filmRoll,
    lenses,
    exposures,
    onExposureSelect,
    onExposureDelete,
    onExposureUpdate,
    onBack,
    onHome,
    onExposureTaken,
    currentSettings,
    setCurrentSettings
}) => {
    const [showExportDialog, setShowExportDialog] = useState(false);
    const [exportFolderName, setExportFolderName] = useState('');
    const [exportMethod, setExportMethod] = useState<'local' | 'googledrive' | 'jsononly' | 'jsonwithimages'>('local');
    const [isProcessing, setIsProcessing] = useState(false);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const filmExposures = exposures.filter(exposure => exposure.filmRollId === filmRoll.id)
        .sort((a, b) => a.exposureNumber - b.exposureNumber);

    // Restore scroll position on mount
    useEffect(() => {
        const scrollKey = `gallery-scroll-${filmRoll.id}`;
        const savedScrollPos = sessionStorage.getItem(scrollKey);

        if (savedScrollPos && scrollContainerRef.current) {
            // Use setTimeout to ensure DOM is fully rendered
            setTimeout(() => {
                if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTop = parseInt(savedScrollPos, 10);
                }
            }, 0);
        }
    }, [filmRoll.id]);

    const handleExposureSelect = (exposure: Exposure) => {
        // Save scroll position before navigating
        if (scrollContainerRef.current) {
            const scrollKey = `gallery-scroll-${filmRoll.id}`;
            sessionStorage.setItem(scrollKey, scrollContainerRef.current.scrollTop.toString());
        }
        onExposureSelect(exposure);
    };

    const currentExposureNumber = filmExposures.length + 1;

    const handleGallerySelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

            const imageData = await fileUtils.scaleImageFile(file);

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
                id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

    const handleCopyFromPrevious = async (currentExposure: Exposure, previousExposure: Exposure) => {
        if (!onExposureUpdate) return;

        const updatedExposure: Exposure = {
            ...currentExposure,
            aperture: previousExposure.aperture,
            shutterSpeed: previousExposure.shutterSpeed,
            additionalInfo: previousExposure.additionalInfo,
            ei: previousExposure.ei,
            lensId: previousExposure.lensId,
            focalLength: previousExposure.focalLength
        };

        try {
            onExposureUpdate(updatedExposure);
        } catch (error) {
            console.error('Failed to copy settings:', error);
            alert('Failed to copy settings. Please try again.');
        }
    };

    const handleExport = async () => {
        if (exportMethod !== 'jsononly' && exportMethod !== 'jsonwithimages' && !exportFolderName.trim()) {
            alert('Please enter a folder name');
            return;
        }

        setIsProcessing(true);
        try {
            if (exportMethod === 'googledrive') {
                await googleDriveUtils.exportToGoogleDrive(filmRoll, filmExposures, lenses, exportFolderName);
            } else if (exportMethod === 'jsononly') {
                await exportUtils.exportJsonOnly(filmRoll, filmExposures, lenses);
            } else if (exportMethod === 'jsonwithimages') {
                await exportUtils.exportJsonWithImages(filmRoll, filmExposures, lenses);
            } else {
                await exportUtils.exportToLocal(filmRoll, filmExposures, lenses, exportFolderName);
            }
            setShowExportDialog(false);
            setExportFolderName('');
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteExposure = (exposureId: string, exposureNumber: number) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete exposure #${exposureNumber}?\n\n` +
            'This action cannot be undone.'
        );

        if (confirmed && onExposureDelete) {
            onExposureDelete(exposureId);
        }
    };

    const formatDateTime = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    if (filmExposures.length === 0) {
        return (
            <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <Box display="flex" alignItems="center" py={2}>
                    <IconButton onClick={onBack} sx={{ mr: 1 }} aria-label="Back">
                        <ArrowBack />
                    </IconButton>
                    <Box>
                        <Typography variant="h6" fontWeight="bold">
                            {filmRoll.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            ISO {filmRoll.iso} • {filmRoll.totalExposures} exposures
                        </Typography>
                    </Box>
                </Box>

                {/* Empty State */}
                <Box
                    flex={1}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                >
                    <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
                        <PhotoCamera sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            No exposures yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Start taking photos to see them here
                        </Typography>
                    </Paper>
                </Box>

                {/* Add From Gallery Button for Empty State */}
                <Box pb={2}>
                    <Button
                        variant="outlined"
                        startIcon={<PhotoLibrary />}
                        onClick={() => galleryInputRef.current?.click()}
                        fullWidth
                    >
                        Add From Gallery
                    </Button>
                </Box>

                {/* Hidden file input for gallery picker */}
                <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleGallerySelect}
                />
            </Container>
        );
    }

    return (
        <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: colors.warmWhite }}>
            {/* Header - Film Contact Sheet Style */}
            <Box display="flex" alignItems="center" justifyContent="space-between" py={2} borderBottom={`2px solid ${colors.coolGray}`}>
                <Box display="flex" alignItems="center">
                    <IconButton
                        onClick={onBack}
                        sx={{
                            mr: 1,
                            '&:hover': { bgcolor: 'rgba(217, 119, 6, 0.08)' },
                        }}
                        aria-label="Back"
                    >
                        <ArrowBack />
                    </IconButton>
                    <Box>
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 600,
                                color: colors.charcoal,
                                mb: 0.25,
                            }}
                        >
                            {filmRoll.name}
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                color: colors.silverGray,
                                fontVariantNumeric: 'tabular-nums',
                                fontSize: '0.8125rem',
                            }}
                        >
                            ISO {filmRoll.iso}
                            <Box component="span" sx={{ mx: 1, color: colors.coolGray }}>•</Box>
                            <Box component="span" sx={{ fontWeight: 500 }}>
                                {filmExposures.length}/{filmRoll.totalExposures}
                            </Box>
                            {' '}exposures
                        </Typography>
                    </Box>
                </Box>
                {onHome && (
                    <IconButton
                        onClick={onHome}
                        sx={{
                            '&:hover': { bgcolor: 'rgba(217, 119, 6, 0.08)' },
                        }}
                        aria-label="Home"
                    >
                        <Home />
                    </IconButton>
                )}
            </Box>

            {/* Add From Gallery/Export Buttons */}
            <Box display="flex" gap={2} pb={2}>
                <Button
                    variant="outlined"
                    startIcon={<PhotoLibrary />}
                    onClick={() => galleryInputRef.current?.click()}
                    fullWidth
                >
                    Add From Gallery
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<CloudUpload />}
                    onClick={() => setShowExportDialog(true)}
                    fullWidth
                    disabled={isProcessing || filmExposures.length === 0}
                >
                    Export
                </Button>
            </Box>

            {/* Exposures Grid */}
            <Box ref={scrollContainerRef} sx={{ flex: 1, overflowY: 'auto' }}>
                <Stack spacing={2}>
                    {filmExposures.map((exposure, index) => {
                        const previousExposure = index > 0 ? filmExposures[index - 1] : null;
                        const lens = lenses.find(l => l.id === exposure.lensId);

                        return (
                        <Box key={exposure.id}>
                            {/* Copy from previous button */}
                            {previousExposure && onExposureUpdate && (
                                <Box display="flex" justifyContent="flex-end" mb={1}>
                                    <Button
                                        size="small"
                                        startIcon={<ContentCopy />}
                                        onClick={() => handleCopyFromPrevious(exposure, previousExposure)}
                                        variant="outlined"
                                    >
                                        Copy from previous
                                    </Button>
                                </Box>
                            )}
                            <Card
                                onClick={() => handleExposureSelect(exposure)}
                                sx={{
                                    cursor: 'pointer',
                                    position: 'relative',
                                    border: `2px solid ${colors.seleniumGray}`,
                                    borderRadius: 1,
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
                                    transition: 'all 0.2s ease-out',
                                    // Film strip perforations on left edge
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        bottom: 0,
                                        width: '6px',
                                        background: `repeating-linear-gradient(
                                            to bottom,
                                            transparent 0px,
                                            transparent 6px,
                                            ${colors.coolGray} 6px,
                                            ${colors.coolGray} 10px
                                        )`,
                                        zIndex: 1,
                                    },
                                    paddingLeft: '8px',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: `0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 2px ${colors.deepAmber}`,
                                        borderColor: colors.deepAmber,
                                    },
                                }}
                            >
                                <Box display="flex">
                                    {exposure.imageData && (
                                        <CardMedia
                                            component="img"
                                            sx={{ width: 120, height: 120, objectFit: 'cover' }}
                                            image={exposure.imageData}
                                            alt={`Exposure ${exposure.exposureNumber}`}
                                        />
                                    )}
                                    <CardContent sx={{ flex: 1, p: 2 }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    fontWeight: 700,
                                                    color: colors.charcoal,
                                                    fontVariantNumeric: 'tabular-nums',
                                                    fontSize: '1.125rem',
                                                }}
                                            >
                                                #{exposure.exposureNumber}
                                            </Typography>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Typography variant="caption" color="text.secondary" display="flex" alignItems="center">
                                                    <AccessTime sx={{ fontSize: 14, mr: 0.5 }} />
                                                    {formatDateTime(exposure.capturedAt)}
                                                </Typography>
                                                {onExposureDelete && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteExposure(exposure.id, exposure.exposureNumber);
                                                        }}
                                                        sx={{
                                                            color: 'text.secondary',
                                                            '&:hover': { color: 'error.main' }
                                                        }}
                                                    >
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                )}
                                            </Box>
                                        </Box>

                                        <Stack direction="row" spacing={1} mb={1} flexWrap="wrap" gap={0.5}>
                                            {lens && (
                                                <Chip
                                                    label={lens.name}
                                                    size="small"
                                                    variant="filled"
                                                    sx={{
                                                        bgcolor: colors.deepAmber,
                                                        color: 'white',
                                                        fontWeight: 600,
                                                        fontSize: '0.75rem',
                                                    }}
                                                />
                                            )}
                                            <Chip
                                                label={exposure.aperture}
                                                size="small"
                                                variant="filled"
                                                sx={{
                                                    bgcolor: colors.coolGray,
                                                    color: colors.charcoal,
                                                    fontVariantNumeric: 'tabular-nums',
                                                    fontWeight: 600,
                                                    fontSize: '0.75rem',
                                                }}
                                            />
                                            <Chip
                                                label={exposure.shutterSpeed}
                                                size="small"
                                                variant="filled"
                                                sx={{
                                                    bgcolor: colors.coolGray,
                                                    color: colors.charcoal,
                                                    fontVariantNumeric: 'tabular-nums',
                                                    fontWeight: 600,
                                                    fontSize: '0.75rem',
                                                }}
                                            />
                                            {exposure.ei && (
                                                <Chip
                                                    label={`EI ${exposure.ei}`}
                                                    size="small"
                                                    variant="filled"
                                                    sx={{
                                                        bgcolor: colors.seleniumGray,
                                                        color: 'white',
                                                        fontVariantNumeric: 'tabular-nums',
                                                        fontWeight: 600,
                                                        fontSize: '0.75rem',
                                                    }}
                                                />
                                            )}
                                            {exposure.focalLength && (
                                                <Chip
                                                    label={`${exposure.focalLength}mm`}
                                                    size="small"
                                                    variant="filled"
                                                    sx={{
                                                        bgcolor: colors.coolGray,
                                                        color: colors.charcoal,
                                                        fontVariantNumeric: 'tabular-nums',
                                                        fontWeight: 600,
                                                        fontSize: '0.75rem',
                                                    }}
                                                />
                                            )}
                                        </Stack>

                                        {exposure.location && (
                                            <Typography variant="caption" color="text.secondary" display="flex" alignItems="center">
                                                <LocationOn sx={{ fontSize: 14, mr: 0.5 }} />
                                                {exposure.location.latitude.toFixed(4)}, {exposure.location.longitude.toFixed(4)}
                                            </Typography>
                                        )}

                                        {exposure.additionalInfo && (
                                            <Typography variant="body2" color="text.secondary" mt={1} noWrap>
                                                {exposure.additionalInfo}
                                            </Typography>
                                        )}
                                    </CardContent>
                                </Box>
                            </Card>
                        </Box>
                        );
                    })}
                </Stack>
            </Box>

            {/* Hidden file input for gallery picker */}
            <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleGallerySelect}
            />

            {/* Export Dialog */}
            <Dialog open={showExportDialog} onClose={() => setShowExportDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="h6">Export Film Data</Typography>
                        <IconButton onClick={() => setShowExportDialog(false)}>
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ pt: 1 }}>
                        <FormControl component="fieldset">
                            <FormLabel component="legend">Export Method</FormLabel>
                            <RadioGroup
                                value={exportMethod}
                                onChange={(e) => setExportMethod(e.target.value as 'local' | 'googledrive' | 'jsononly' | 'jsonwithimages')}
                            >
                                <FormControlLabel
                                    value="local"
                                    control={<Radio />}
                                    label={
                                        <Box>
                                            <Typography variant="body2">Local Download</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Download files to your device
                                            </Typography>
                                        </Box>
                                    }
                                />
                                <FormControlLabel
                                    value="jsononly"
                                    control={<Radio />}
                                    label={
                                        <Box>
                                            <Typography variant="body2">JSON Only</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Share metadata only (Telegram, WhatsApp, etc.)
                                            </Typography>
                                        </Box>
                                    }
                                />
                                <FormControlLabel
                                    value="jsonwithimages"
                                    control={<Radio />}
                                    label={
                                        <Box>
                                            <Typography variant="body2">JSON with Images</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Single JSON file with embedded images
                                            </Typography>
                                        </Box>
                                    }
                                />
                                <FormControlLabel
                                    value="googledrive"
                                    control={<Radio />}
                                    label={
                                        <Box>
                                            <Typography variant="body2">Google Drive</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Save directly to Google Drive (requires setup)
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </RadioGroup>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Local: Creates metadata.json + image files<br />
                                JSON Only: Metadata without images<br />
                                JSON with Images: Single JSON file with embedded images<br />
                                Google Drive: Requires API setup
                            </Typography>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="Folder/File Name"
                            value={exportFolderName}
                            onChange={(e) => setExportFolderName(e.target.value)}
                            placeholder={`${filmRoll.name.replace(/\s+/g, '_')}_export`}
                            disabled={exportMethod === 'jsononly' || exportMethod === 'jsonwithimages'}
                            helperText={
                                exportMethod === 'jsononly' || exportMethod === 'jsonwithimages'
                                    ? 'Not needed for single-file export'
                                    : 'Name for organizing downloaded files'
                            }
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowExportDialog(false)}>Cancel</Button>
                    <Button
                        onClick={handleExport}
                        variant="contained"
                        disabled={isProcessing || (exportMethod !== 'jsononly' && exportMethod !== 'jsonwithimages' && !exportFolderName.trim())}
                        startIcon={
                            exportMethod === 'googledrive' ? <CloudUpload /> :
                                (exportMethod === 'jsononly' || exportMethod === 'jsonwithimages') ? <Share /> : <Save />
                        }
                    >
                        {isProcessing ? 'Exporting...' :
                            (exportMethod === 'jsononly' || exportMethod === 'jsonwithimages') ? 'Export JSON' : 'Export'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};