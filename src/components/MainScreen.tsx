import React, { useState } from 'react';
import {
    Box,
    Tabs,
    Tab,
    AppBar,
    Toolbar,
    Typography,
    IconButton
} from '@mui/material';
import {
    PhotoLibrary,
    CameraAlt,
    Settings,
    CameraEnhance
} from '@mui/icons-material';
import type { FilmRoll, Exposure, Camera, Lens } from '../types';
import { FilmRollListScreen } from './FilmRollListScreen';
import { CameraManagementScreen } from './CameraManagementScreen';
import { LensManagementScreen } from './LensManagementScreen';
import { colors } from '../theme';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
            {...other}
        >
            {value === index && children}
        </div>
    );
}

interface MainScreenProps {
    filmRolls: FilmRoll[];
    cameras: Camera[];
    lenses: Lens[];
    exposures: Exposure[];
    onFilmRollSelected: (filmRoll: FilmRoll) => void;
    onFilmRollCreated: (filmRoll: FilmRoll) => void;
    onFilmRollDeleted: (filmRollId: string) => void;
    onCameraCreated: (camera: Camera) => void;
    onCameraUpdated: (camera: Camera) => void;
    onCameraDeleted: (cameraId: string) => void;
    onLensCreated: (lens: Lens) => void;
    onLensUpdated: (lens: Lens) => void;
    onLensDeleted: (lensId: string) => void;
    onSettingsClick?: () => void;
}

export const MainScreen: React.FC<MainScreenProps> = ({
    filmRolls,
    cameras,
    lenses,
    exposures,
    onFilmRollSelected,
    onFilmRollCreated,
    onFilmRollDeleted,
    onCameraCreated,
    onCameraUpdated,
    onCameraDeleted,
    onLensCreated,
    onLensUpdated,
    onLensDeleted,
    onSettingsClick
}) => {
    const [currentTab, setCurrentTab] = useState(0);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
    };

    return (
        <Box
            sx={{
                flexGrow: 1,
                bgcolor: colors.warmWhite,
                minHeight: '100vh',
                backgroundImage: `
                    radial-gradient(circle at 20% 50%, rgba(217, 119, 6, 0.02) 0%, transparent 50%),
                    radial-gradient(circle at 80% 80%, rgba(217, 119, 6, 0.02) 0%, transparent 50%)
                `,
            }}
        >
            <AppBar
                position="static"
                sx={{
                    bgcolor: colors.charcoal,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                }}
            >
                <Toolbar sx={{ py: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                        <PhotoLibrary
                            sx={{
                                mr: 1.5,
                                fontSize: 28,
                                color: colors.deepAmber,
                            }}
                        />
                        <Typography
                            variant="h5"
                            component="div"
                            sx={{
                                fontWeight: 600,
                                letterSpacing: '-0.01em',
                                color: 'white',
                            }}
                        >
                            Film Photography Tracker
                        </Typography>
                    </Box>
                    {onSettingsClick && (
                        <IconButton
                            color="inherit"
                            onClick={onSettingsClick}
                            aria-label="settings"
                            sx={{
                                '&:hover': {
                                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                                }
                            }}
                        >
                            <Settings />
                        </IconButton>
                    )}
                </Toolbar>
                <Tabs
                    value={currentTab}
                    onChange={handleTabChange}
                    sx={{
                        bgcolor: colors.seleniumGray,
                        borderTop: `1px solid rgba(255, 255, 255, 0.1)`,
                        '& .MuiTab-root': {
                            color: 'rgba(255, 255, 255, 0.6)',
                            fontSize: '0.9375rem',
                            fontWeight: 600,
                            minHeight: 56,
                            textTransform: 'none',
                            transition: 'all 200ms ease-out',
                            '&:hover': {
                                color: 'rgba(255, 255, 255, 0.9)',
                                bgcolor: 'rgba(255, 255, 255, 0.05)',
                            },
                            '&.Mui-selected': {
                                color: colors.deepAmber,
                            },
                            '& .MuiSvgIcon-root': {
                                fontSize: '1.3rem',
                            }
                        },
                        '& .MuiTabs-indicator': {
                            height: 3,
                            borderRadius: '3px 3px 0 0',
                            backgroundColor: colors.deepAmber,
                            boxShadow: `0 -2px 8px rgba(217, 119, 6, 0.4)`,
                        }
                    }}
                >
                    <Tab
                        icon={<PhotoLibrary />}
                        label="Film Rolls"
                        iconPosition="start"
                    />
                    <Tab
                        icon={<CameraAlt />}
                        label="Cameras"
                        iconPosition="start"
                    />
                    <Tab
                        icon={<CameraEnhance />}
                        label="Lenses"
                        iconPosition="start"
                    />
                </Tabs>
            </AppBar>

            <TabPanel value={currentTab} index={0}>
                <FilmRollListScreen
                    filmRolls={filmRolls}
                    cameras={cameras}
                    lenses={lenses}
                    exposures={exposures}
                    onFilmRollSelected={onFilmRollSelected}
                    onFilmRollCreated={onFilmRollCreated}
                    onFilmRollDeleted={onFilmRollDeleted}
                />
            </TabPanel>

            <TabPanel value={currentTab} index={1}>
                <CameraManagementScreen
                    cameras={cameras}
                    onCameraCreated={onCameraCreated}
                    onCameraUpdated={onCameraUpdated}
                    onCameraDeleted={onCameraDeleted}
                />
            </TabPanel>

            <TabPanel value={currentTab} index={2}>
                <LensManagementScreen
                    lenses={lenses}
                    onLensCreated={onLensCreated}
                    onLensUpdated={onLensUpdated}
                    onLensDeleted={onLensDeleted}
                />
            </TabPanel>
        </Box>
    );
};
