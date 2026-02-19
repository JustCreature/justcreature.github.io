import React, { useState } from 'react';
import {
    Box,
    Container,
    Typography,
    Fab,
    AppBar,
    Toolbar,
    Dialog,
    DialogContent,
    Card,
    CardMedia,
    CardContent,
    Chip,
    Stack,
    IconButton
} from '@mui/material';
import {
    Add,
    PhotoLibrary,
    MoreVert,
    CameraAlt
} from '@mui/icons-material';
import type { FilmRoll, Exposure, Camera, Lens } from '../types';
import { SetupScreen } from './SetupScreen';
import { storage } from '../utils/storage';
import { EmptyStateDisplay } from './common/EmptyStateDisplay';
import { DialogHeader } from './common/DialogHeader';
import { ConfirmationDialog } from './common/ConfirmationDialog';
import { EntityContextMenu } from './common/EntityContextMenu';

interface FilmRollListScreenProps {
    filmRolls: FilmRoll[];
    cameras: Camera[];
    lenses: Lens[];
    exposures: Exposure[];
    onFilmRollSelected: (filmRoll: FilmRoll) => void;
    onFilmRollCreated: (filmRoll: FilmRoll) => void;
    onFilmRollDeleted: (filmRollId: string) => void;
}

export const FilmRollListScreen: React.FC<FilmRollListScreenProps> = ({
    filmRolls,
    cameras,
    lenses,
    exposures,
    onFilmRollSelected,
    onFilmRollCreated,
    onFilmRollDeleted
}) => {
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [editingFilmRoll, setEditingFilmRoll] = useState<FilmRoll | null>(null);
    const [filmRollToDelete, setFilmRollToDelete] = useState<FilmRoll | null>(null);
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
    const [selectedFilmRollId, setSelectedFilmRollId] = useState<string | null>(null);

    const getFilmRollStats = (filmRoll: FilmRoll) => {
        const filmExposures = exposures.filter(e => e.filmRollId === filmRoll.id);
        const exposureCount = filmExposures.length;
        const hasImages = filmExposures.some(e => e.imageData);

        return {
            exposureCount,
            hasImages,
            progress: (exposureCount / filmRoll.totalExposures) * 100
        };
    };

    const handleFilmRollClick = (filmRollId: string) => {
        const filmRoll = filmRolls.find(r => r.id === filmRollId);
        if (filmRoll) {
            onFilmRollSelected(filmRoll);
        }
    };

    const handleDeleteConfirm = () => {
        if (filmRollToDelete) {
            // Delete all exposures for this film roll
            const filmExposures = exposures.filter(e => e.filmRollId === filmRollToDelete.id);
            filmExposures.forEach(exposure => {
                storage.deleteExposure(exposure.id);
            });

            // Delete the film roll
            storage.deleteFilmRoll(filmRollToDelete.id);
            onFilmRollDeleted(filmRollToDelete.id);

            setFilmRollToDelete(null);
        }
    };

    const handleCreateFilmRoll = (filmRoll: FilmRoll) => {
        onFilmRollCreated(filmRoll);
        setShowCreateDialog(false);
    };

    const handleUpdateFilmRoll = (filmRoll: FilmRoll) => {
        storage.saveFilmRoll(filmRoll);
        onFilmRollCreated(filmRoll); // This will update the state in parent
        setEditingFilmRoll(null);
    };

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>, filmRollId: string) => {
        event.stopPropagation(); // Prevent film roll click
        setMenuAnchor(event.currentTarget);
        setSelectedFilmRollId(filmRollId);
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
        setSelectedFilmRollId(null);
    };

    const handleEditClick = () => {
        if (selectedFilmRollId) {
            const filmRoll = filmRolls.find(r => r.id === selectedFilmRollId);
            if (filmRoll) {
                setEditingFilmRoll(filmRoll);
            }
        }
        handleMenuClose();
    };

    const handleDeleteClick = () => {
        if (selectedFilmRollId) {
            const filmRoll = filmRolls.find(r => r.id === selectedFilmRollId);
            if (filmRoll) {
                setFilmRollToDelete(filmRoll);
            }
        }
        handleMenuClose();
    };

    const sortedFilmRolls = [...filmRolls].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return (
        <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
            <AppBar position="static" elevation={1}>
                <Toolbar>
                    <CameraAlt sx={{ mr: 2 }} />
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Film Rolls
                    </Typography>
                    <Typography variant="body2" color="inherit" sx={{ opacity: 0.8 }}>
                        {filmRolls.length} roll{filmRolls.length !== 1 ? 's' : ''}
                    </Typography>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ py: 3 }}>
                {filmRolls.length === 0 ? (
                    <EmptyStateDisplay
                        icon={<PhotoLibrary sx={{ fontSize: 80 }} />}
                        title="No Film Rolls Yet"
                        description="Create your first film roll to start tracking your analog photography journey."
                        actionLabel="Create Film Roll"
                        onAction={() => setShowCreateDialog(true)}
                    />
                ) : (
                    <>
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="h4" gutterBottom>
                                Your Film Rolls
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Select a film roll to continue shooting or view your photos.
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
                            {sortedFilmRolls.map((filmRoll) => {
                                const stats = getFilmRollStats(filmRoll);
                                const lastExposure = exposures
                                    .filter(e => e.filmRollId === filmRoll.id)
                                    .sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime())[0];

                                return (
                                    <Card
                                        key={filmRoll.id}
                                        sx={{
                                            height: 'auto',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease-in-out',
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: 4,
                                            },
                                        }}
                                        onClick={() => handleFilmRollClick(filmRoll.id)}
                                    >
                                        {lastExposure?.imageData && (
                                            <CardMedia
                                                component="img"
                                                height={140}
                                                image={lastExposure.imageData}
                                                alt={filmRoll.name}
                                                sx={{
                                                    objectFit: 'cover',
                                                    backgroundColor: '#f5f5f5'
                                                }}
                                            />
                                        )}

                                        <CardContent sx={{ flex: 1, p: 2 }}>
                                            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                                <Typography
                                                    variant="h6"
                                                    component="div"
                                                    sx={{
                                                        mb: 1,
                                                        fontSize: '1rem',
                                                        fontWeight: 500,
                                                        lineHeight: 1.2,
                                                        flex: 1,
                                                        pr: 1
                                                    }}
                                                >
                                                    {filmRoll.name}
                                                </Typography>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => handleMenuClick(e, filmRoll.id)}
                                                    sx={{ mt: -0.5 }}
                                                >
                                                    <MoreVert />
                                                </IconButton>
                                            </Box>

                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ mb: 1.5 }}
                                            >
                                                {new Date(filmRoll.createdAt).toLocaleDateString()}
                                            </Typography>

                                            <Stack spacing={1} sx={{ mb: 1.5 }}>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        ISO:
                                                    </Typography>
                                                    <Typography variant="caption">
                                                        {filmRoll.iso.toString()}
                                                    </Typography>
                                                </Box>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Progress:
                                                    </Typography>
                                                    <Typography variant="caption">
                                                        {`${stats.exposureCount}/${filmRoll.totalExposures}`}
                                                    </Typography>
                                                </Box>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Status:
                                                    </Typography>
                                                    <Typography variant="caption">
                                                        {stats.exposureCount === filmRoll.totalExposures ? 'Complete' : 'In Progress'}
                                                    </Typography>
                                                </Box>
                                                {filmRoll.cameraId && (
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Camera:
                                                        </Typography>
                                                        <Typography variant="caption">
                                                            {cameras.find(c => c.id === filmRoll.cameraId)?.name || 'Unknown Camera'}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Stack>

                                            <Box display="flex" flexWrap="wrap" gap={0.5}>
                                                <Chip
                                                    label={`${Math.round(stats.progress)}% complete`}
                                                    size="small"
                                                    color={stats.progress === 100 ? 'success' : 'primary'}
                                                    variant="outlined"
                                                />
                                                {stats.hasImages && (
                                                    <Chip
                                                        label="Has Photos"
                                                        size="small"
                                                        color="info"
                                                        variant="outlined"
                                                    />
                                                )}
                                            </Box>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </Box>
                    </>
                )}
            </Container>

            {/* Create Film Roll FAB */}
            <Fab
                color="primary"
                aria-label="add film roll"
                sx={{
                    position: 'fixed',
                    bottom: 16,
                    right: 16,
                }}
                onClick={() => setShowCreateDialog(true)}
            >
                <Add />
            </Fab>

            {/* Create Film Roll Dialog */}
            <Dialog
                open={showCreateDialog}
                onClose={() => setShowCreateDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogHeader
                    title="Create New Film Roll"
                    icon={<PhotoLibrary />}
                    onClose={() => setShowCreateDialog(false)}
                />
                <DialogContent sx={{ p: 0 }}>
                    <SetupScreen
                        cameras={cameras}
                        lenses={lenses}
                        onFilmRollCreated={handleCreateFilmRoll}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <ConfirmationDialog
                open={!!filmRollToDelete}
                title="Delete Film Roll"
                message={`Are you sure you want to delete "${filmRollToDelete?.name}"? This will also delete all ${getFilmRollStats(filmRollToDelete || {} as FilmRoll).exposureCount} exposures.`}
                warningText="This action cannot be undone!"
                confirmText="Delete"
                severity="error"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setFilmRollToDelete(null)}
            />

            {/* Action Menu */}
            <EntityContextMenu
                anchorEl={menuAnchor}
                onClose={handleMenuClose}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
            />

            {/* Edit Film Roll Dialog */}
            <Dialog
                open={!!editingFilmRoll}
                onClose={() => setEditingFilmRoll(null)}
                maxWidth="sm"
                fullWidth
            >
                <DialogHeader
                    title="Edit Film Roll"
                    icon={<PhotoLibrary />}
                    onClose={() => setEditingFilmRoll(null)}
                />
                <DialogContent sx={{ p: 0 }}>
                    <SetupScreen
                        cameras={cameras}
                        lenses={lenses}
                        editingFilmRoll={editingFilmRoll}
                        onFilmRollUpdated={handleUpdateFilmRoll}
                    />
                </DialogContent>
            </Dialog>
        </Box >
    );
};
