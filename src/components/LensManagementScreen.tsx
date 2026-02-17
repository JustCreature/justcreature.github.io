import React, { useState } from 'react';
import {
    Box,
    Container,
    Typography,
    Fab,
    AppBar,
    Toolbar,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Stack,
    IconButton,
    Menu,
    MenuItem,
    Alert
} from '@mui/material';
import {
    Add,
    Edit,
    Delete,
    MoreVert,
    CameraEnhance
} from '@mui/icons-material';
import type { Lens } from '../types';
import { APERTURE_VALUES } from '../types';
import { ItemCard } from './ItemCard';

interface LensManagementScreenProps {
    lenses: Lens[];
    onLensCreated: (lens: Lens) => void;
    onLensUpdated: (lens: Lens) => void;
    onLensDeleted: (lensId: string) => void;
}

export const LensManagementScreen: React.FC<LensManagementScreenProps> = ({
    lenses,
    onLensCreated,
    onLensUpdated,
    onLensDeleted
}) => {
    const [showDialog, setShowDialog] = useState(false);
    const [editingLens, setEditingLens] = useState<Lens | null>(null);
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [selectedLens, setSelectedLens] = useState<Lens | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        maxAperture: 'f/1.4',
        focalLength: '',
        focalLengthMin: '',
        focalLengthMax: ''
    });

    const [validationError, setValidationError] = useState<string | null>(null);

    const resetForm = () => {
        setFormData({
            name: '',
            maxAperture: 'f/1.4',
            focalLength: '',
            focalLengthMin: '',
            focalLengthMax: ''
        });
        setEditingLens(null);
        setValidationError(null);
    };

    const handleCreate = () => {
        setValidationError(null);

        if (!formData.name.trim()) {
            setValidationError('Please enter lens name');
            return;
        }

        // Validation: Can't have both prime and zoom
        const hasPrime = !!formData.focalLength;
        const hasZoom = !!(formData.focalLengthMin || formData.focalLengthMax);

        if (hasPrime && hasZoom) {
            setValidationError('A lens cannot be both prime and zoom. Please enter either Focal Length (prime) OR Min/Max Focal Length (zoom)');
            return;
        }

        if (!hasPrime && !hasZoom) {
            setValidationError('Please enter focal length information for either prime or zoom lens');
            return;
        }

        // Validate zoom range
        if (hasZoom) {
            const min = parseInt(formData.focalLengthMin);
            const max = parseInt(formData.focalLengthMax);
            if (!formData.focalLengthMin || !formData.focalLengthMax) {
                setValidationError('For zoom lenses, both Min and Max focal lengths are required');
                return;
            }
            if (min >= max) {
                setValidationError('Min focal length must be less than Max focal length');
                return;
            }
        }

        const lens: Lens = {
            id: Date.now().toString(),
            name: formData.name.trim(),
            maxAperture: formData.maxAperture,
            focalLength: formData.focalLength ? parseInt(formData.focalLength) : undefined,
            focalLengthMin: formData.focalLengthMin ? parseInt(formData.focalLengthMin) : undefined,
            focalLengthMax: formData.focalLengthMax ? parseInt(formData.focalLengthMax) : undefined,
            createdAt: new Date()
        };

        onLensCreated(lens);
        setShowDialog(false);
        resetForm();
    };

    const handleUpdate = () => {
        setValidationError(null);

        if (!editingLens || !formData.name.trim()) {
            setValidationError('Please enter lens name');
            return;
        }

        // Validation: Can't have both prime and zoom
        const hasPrime = !!formData.focalLength;
        const hasZoom = !!(formData.focalLengthMin || formData.focalLengthMax);

        if (hasPrime && hasZoom) {
            setValidationError('A lens cannot be both prime and zoom. Please enter either Focal Length (prime) OR Min/Max Focal Length (zoom)');
            return;
        }

        if (!hasPrime && !hasZoom) {
            setValidationError('Please enter focal length information for either prime or zoom lens');
            return;
        }

        // Validate zoom range
        if (hasZoom) {
            const min = parseInt(formData.focalLengthMin);
            const max = parseInt(formData.focalLengthMax);
            if (!formData.focalLengthMin || !formData.focalLengthMax) {
                setValidationError('For zoom lenses, both Min and Max focal lengths are required');
                return;
            }
            if (min >= max) {
                setValidationError('Min focal length must be less than Max focal length');
                return;
            }
        }

        const updatedLens: Lens = {
            ...editingLens,
            name: formData.name.trim(),
            maxAperture: formData.maxAperture,
            focalLength: formData.focalLength ? parseInt(formData.focalLength) : undefined,
            focalLengthMin: formData.focalLengthMin ? parseInt(formData.focalLengthMin) : undefined,
            focalLengthMax: formData.focalLengthMax ? parseInt(formData.focalLengthMax) : undefined
        };

        onLensUpdated(updatedLens);
        setEditingLens(null);
        resetForm();
    };

    const handleEditClick = (lens: Lens) => {
        setEditingLens(lens);
        setFormData({
            name: lens.name,
            maxAperture: lens.maxAperture,
            focalLength: lens.focalLength?.toString() || '',
            focalLengthMin: lens.focalLengthMin?.toString() || '',
            focalLengthMax: lens.focalLengthMax?.toString() || ''
        });
        setMenuAnchor(null);
    };

    const handleDeleteClick = (lens: Lens) => {
        const confirmed = window.confirm(
            `Delete lens "${lens.name}"?\n\nThis will not affect existing exposures using this lens.`
        );
        if (confirmed) {
            onLensDeleted(lens.id);
        }
        setMenuAnchor(null);
    };

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>, lens: Lens) => {
        event.stopPropagation();
        setSelectedLens(lens);
        setMenuAnchor(event.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
        setSelectedLens(null);
    };

    const sortedLenses = [...lenses].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return (
        <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
            <AppBar position="static" elevation={1}>
                <Toolbar>
                    <CameraEnhance sx={{ mr: 2 }} />
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Lens Management
                    </Typography>
                    <Typography variant="body2" color="inherit" sx={{ opacity: 0.8 }}>
                        {lenses.length} lens{lenses.length !== 1 ? 'es' : ''}
                    </Typography>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ py: 3 }}>
                {lenses.length === 0 ? (
                    <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        minHeight="60vh"
                        textAlign="center"
                    >
                        <CameraEnhance sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h5" gutterBottom color="text.secondary">
                            No Lenses Added Yet
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
                            Add your lenses to track focal lengths and apertures for each shot.
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => setShowDialog(true)}
                            size="large"
                        >
                            Add Lens
                        </Button>
                    </Box>
                ) : (
                    <>
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="h4" gutterBottom>
                                Your Lenses
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Manage your lens collection for accurate exposure tracking.
                            </Typography>
                        </Box>

                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: {
                                    xs: '1fr',
                                    sm: 'repeat(2, 1fr)',
                                    md: 'repeat(3, 1fr)'
                                },
                                gap: 3
                            }}
                        >
                            {sortedLenses.map((lens) => {
                                const focalLengthStr = lens.focalLength
                                    ? `${lens.focalLength}mm`
                                    : lens.focalLengthMin && lens.focalLengthMax
                                        ? `${lens.focalLengthMin}-${lens.focalLengthMax}mm`
                                        : 'N/A';

                                return (
                                    <Box key={lens.id} sx={{ position: 'relative' }}>
                                        <ItemCard
                                            id={lens.id}
                                            title={lens.name}
                                            subtitle={new Date(lens.createdAt).toLocaleDateString()}
                                            metadata={[
                                                { label: 'Max Aperture', value: lens.maxAperture },
                                                { label: 'Focal Length', value: focalLengthStr }
                                            ]}
                                        />
                                        <IconButton
                                            sx={{
                                                position: 'absolute',
                                                top: 8,
                                                right: 8,
                                                bgcolor: 'background.paper',
                                                '&:hover': { bgcolor: 'action.hover' }
                                            }}
                                            onClick={(e) => handleMenuClick(e, lens)}
                                        >
                                            <MoreVert />
                                        </IconButton>
                                    </Box>
                                );
                            })}
                        </Box>
                    </>
                )}
            </Container>

            {/* Add FAB */}
            <Fab
                color="primary"
                aria-label="add lens"
                sx={{
                    position: 'fixed',
                    bottom: 16,
                    right: 16,
                }}
                onClick={() => setShowDialog(true)}
            >
                <Add />
            </Fab>

            {/* Create/Edit Dialog */}
            <Dialog
                open={showDialog || editingLens !== null}
                onClose={() => {
                    setShowDialog(false);
                    setEditingLens(null);
                    resetForm();
                }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {editingLens ? 'Edit Lens' : 'Add New Lens'}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ pt: 1 }}>
                        {validationError && (
                            <Alert severity="error" onClose={() => setValidationError(null)}>
                                {validationError}
                            </Alert>
                        )}

                        <TextField
                            fullWidth
                            label="Lens Name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Helios 44-2, Canon EF 50mm"
                            required
                        />

                        <TextField
                            fullWidth
                            select
                            label="Maximum Aperture (widest)"
                            value={formData.maxAperture}
                            onChange={(e) => setFormData(prev => ({ ...prev, maxAperture: e.target.value }))}
                            required
                        >
                            {APERTURE_VALUES.map((value) => (
                                <MenuItem key={value} value={value}>
                                    {value}
                                </MenuItem>
                            ))}
                        </TextField>

                        <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                            Focal Length (for prime lenses)
                        </Typography>
                        <TextField
                            fullWidth
                            label="Focal Length (mm)"
                            type="number"
                            value={formData.focalLength}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                focalLength: e.target.value,
                                // Clear zoom values when entering prime focal length
                                focalLengthMin: e.target.value ? '' : prev.focalLengthMin,
                                focalLengthMax: e.target.value ? '' : prev.focalLengthMax
                            }))}
                            placeholder="e.g., 50"
                            inputProps={{ min: 1, max: 10000 }}
                            disabled={!!(formData.focalLengthMin || formData.focalLengthMax)}
                            helperText={
                                (formData.focalLengthMin || formData.focalLengthMax)
                                    ? "Clear zoom values to enter prime focal length"
                                    : "For fixed focal length lenses"
                            }
                        />

                        <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                            OR for zoom lenses
                        </Typography>
                        <Box display="flex" gap={2}>
                            <TextField
                                fullWidth
                                label="Min Focal Length (mm)"
                                type="number"
                                value={formData.focalLengthMin}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    focalLengthMin: e.target.value,
                                    // Clear prime value when entering zoom values
                                    focalLength: (e.target.value || prev.focalLengthMax) ? '' : prev.focalLength
                                }))}
                                placeholder="e.g., 24"
                                inputProps={{ min: 1, max: 10000 }}
                                disabled={!!formData.focalLength}
                            />
                            <TextField
                                fullWidth
                                label="Max Focal Length (mm)"
                                type="number"
                                value={formData.focalLengthMax}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    focalLengthMax: e.target.value,
                                    // Clear prime value when entering zoom values
                                    focalLength: (e.target.value || prev.focalLengthMin) ? '' : prev.focalLength
                                }))}
                                placeholder="e.g., 70"
                                inputProps={{ min: 1, max: 10000 }}
                                disabled={!!formData.focalLength}
                            />
                        </Box>
                        {formData.focalLength && (
                            <Typography variant="caption" color="text.secondary">
                                Clear prime focal length to enter zoom range
                            </Typography>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setShowDialog(false);
                        setEditingLens(null);
                        resetForm();
                    }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={editingLens ? handleUpdate : handleCreate}
                        variant="contained"
                        disabled={!formData.name.trim()}
                    >
                        {editingLens ? 'Update' : 'Add'} Lens
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Actions Menu */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => selectedLens && handleEditClick(selectedLens)}>
                    <Edit sx={{ mr: 1 }} />
                    Edit
                </MenuItem>
                <MenuItem onClick={() => selectedLens && handleDeleteClick(selectedLens)}>
                    <Delete sx={{ mr: 1 }} />
                    Delete
                </MenuItem>
            </Menu>
        </Box>
    );
};
