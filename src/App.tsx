import { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Snackbar, Alert, Button } from '@mui/material';
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

import { MainScreen } from './components/MainScreen';
import { SetupScreen } from './components/SetupScreen';
import { CameraScreen } from './components/CameraScreen';
import { GalleryScreen } from './components/GalleryScreen';
import { DetailsScreen } from './components/DetailsScreen';
import { SettingsModal } from './components/SettingsModal';
import { storage } from './utils/storage';
// import { SyncManager } from './utils/syncManager'; // Temporarily disabled
import type { FilmRoll, Exposure, AppState, Camera, Lens, AppSettings, ExposureSettings } from './types';
import { SHUTTER_SPEED, APERTURE } from './types';
import { filmTheme } from './theme';

function App() {
  const [exposureSettings, setExposureSettings] = useState<ExposureSettings>({
    aperture: APERTURE.F_8,
    shutterSpeed: SHUTTER_SPEED.S_1_125,
    additionalInfo: ''
  });

  const [appState, setAppState] = useState<AppState>({
    currentFilmRoll: null,
    filmRolls: [],
    cameras: [],
    lenses: [],
    exposures: [],
    currentScreen: 'filmrolls',
    selectedExposure: null,
    settings: {
      googleDrive: {
        enabled: false,
        autoSync: false
      },
      version: '1.0.0'
    }
  });

  const [pwaUpdateAvailable, setPwaUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  // const [syncManager, setSyncManager] = useState<SyncManager | null>(null); // Temporarily disabled

  // Load data from storage on mount and initialize IndexedDB
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize storage first
        await storage.initialize();
        console.log('✅ Storage initialized successfully');

        // Load all data from IndexedDB
        const [currentFilmRoll, filmRolls, cameras, lenses, exposures, settings] = await Promise.all([
          storage.getCurrentFilmRoll(),
          storage.getFilmRolls(),
          storage.getCameras(),
          storage.getLenses(),
          storage.getExposures(),
          storage.getSettings()
        ]);

        setAppState(prev => ({
          ...prev,
          currentFilmRoll,
          filmRolls,
          cameras,
          lenses,
          exposures,
          settings,
          currentScreen: 'filmrolls' // Always show main screen with film rolls tab
        }));

        // Initialize sync manager (temporarily disabled while fixing storage)
        // const manager = new SyncManager(settings);
        // setSyncManager(manager);
        console.log('Sync functionality temporarily disabled during storage migration');

      } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        // Set default empty state if initialization fails
        setAppState(prev => ({
          ...prev,
          filmRolls: [],
          cameras: [],
          lenses: [],
          exposures: [],
          currentFilmRoll: null,
          settings: {
            googleDrive: { enabled: false, autoSync: false },
            version: '1.0.0'
          }
        }));
      }
    };

    initializeApp();
  }, []);

  // PWA update handling - Manual updates only to preserve user data
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      console.log('🔧 PWA: Service worker supported');
      navigator.serviceWorker.ready.then(registration => {
        console.log('🔧 PWA: Service worker ready', registration);
        // Check if there's already a waiting worker
        if (registration.waiting) {
          console.log('🔧 PWA: Update available (waiting worker found)');
          setPwaUpdateAvailable(true);
          setWaitingWorker(registration.waiting);
        }

        // Listen for new service worker installations
        registration.addEventListener('updatefound', () => {
          console.log('🔧 PWA: Update found, new worker installing');
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              console.log('🔧 PWA: New worker state:', newWorker.state);
              // When the new service worker is installed and there's an existing one
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔧 PWA: Update ready! Showing notification');
                setPwaUpdateAvailable(true);
                setWaitingWorker(newWorker);
              }
            });
          }
        });

        // Check for updates less frequently to avoid interruptions
        setInterval(() => {
          console.log('🔧 PWA: Checking for updates...');
          registration.update();
        }, 300000); // Check every 5 minutes
      });
    } else {
      console.log('❌ PWA: Service worker not supported');
    }
  }, []);

  // Handle OAuth redirect for PWA standalone mode
  useEffect(() => {
    const handleOAuthRedirect = () => {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const state = params.get('state');
        const storedState = sessionStorage.getItem('oauth_state');

        if (accessToken && state === storedState) {
          // Clear the hash and state
          window.location.hash = '';
          sessionStorage.removeItem('oauth_state');

          // OAuth temporarily disabled during storage migration
          console.log('OAuth redirect detected but sync is temporarily disabled');
        }
      }
    };

    handleOAuthRedirect();
  }, [appState.settings]); // syncManager dependency removed while disabled

  const handleFilmRollCreated = async (filmRoll: FilmRoll) => {
    try {
      await storage.saveFilmRoll(filmRoll);
      await storage.setCurrentFilmRoll(filmRoll);

      setAppState(prev => ({
        ...prev,
        currentFilmRoll: filmRoll,
        filmRolls: [...prev.filmRolls.filter(r => r.id !== filmRoll.id), filmRoll],
        currentScreen: 'camera'
      }));
    } catch (error) {
      console.error('Failed to create film roll:', error);
      alert('Failed to save film roll. Please try again.');
    }
  };

  const handleFilmRollSelected = (filmRoll: FilmRoll) => {
    storage.setCurrentFilmRoll(filmRoll);

    setAppState(prev => ({
      ...prev,
      currentFilmRoll: filmRoll,
      currentScreen: 'camera'
    }));
  };

  const handleFilmRollDeleted = (filmRollId: string) => {
    setAppState(prev => ({
      ...prev,
      filmRolls: prev.filmRolls.filter(r => r.id !== filmRollId),
      currentFilmRoll: prev.currentFilmRoll?.id === filmRollId ? null : prev.currentFilmRoll,
      exposures: prev.exposures.filter(e => e.filmRollId !== filmRollId)
    }));
  };

  const handleFilmRollUpdated = async (filmRoll: FilmRoll) => {
    try {
      await storage.saveFilmRoll(filmRoll);
      if (appState.currentFilmRoll?.id === filmRoll.id) {
        await storage.setCurrentFilmRoll(filmRoll);
      }

      setAppState(prev => ({
        ...prev,
        currentFilmRoll: prev.currentFilmRoll?.id === filmRoll.id ? filmRoll : prev.currentFilmRoll,
        filmRolls: prev.filmRolls.map(r => r.id === filmRoll.id ? filmRoll : r)
      }));
    } catch (error) {
      console.error('Failed to update film roll:', error);
      alert('Failed to update film roll. Please try again.');
    }
  };

  // Camera handlers
  const handleCameraCreated = async (camera: Camera) => {
    try {
      await storage.saveCamera(camera);
      setAppState(prev => ({
        ...prev,
        cameras: [...prev.cameras.filter(c => c.id !== camera.id), camera]
      }));
    } catch (error) {
      console.error('Failed to create camera:', error);
      alert('Failed to save camera. Please try again.');
    }
  };

  const handleCameraUpdated = async (camera: Camera) => {
    try {
      await storage.saveCamera(camera);
      setAppState(prev => ({
        ...prev,
        cameras: prev.cameras.map(c => c.id === camera.id ? camera : c)
      }));
    } catch (error) {
      console.error('Failed to update camera:', error);
      alert('Failed to update camera. Please try again.');
    }
  };

  const handleCameraDeleted = async (cameraId: string) => {
    try {
      await storage.deleteCamera(cameraId);
      setAppState(prev => ({
        ...prev,
        cameras: prev.cameras.filter(c => c.id !== cameraId)
      }));
    } catch (error) {
      console.error('Failed to delete camera:', error);
      alert('Failed to delete camera. Please try again.');
    }
  };

  // Lens handlers
  const handleLensCreated = async (lens: Lens) => {
    try {
      await storage.saveLens(lens);
      setAppState(prev => ({
        ...prev,
        lenses: [...prev.lenses.filter(l => l.id !== lens.id), lens]
      }));
    } catch (error) {
      console.error('Failed to create lens:', error);
      alert('Failed to save lens. Please try again.');
    }
  };

  const handleLensUpdated = async (lens: Lens) => {
    try {
      await storage.saveLens(lens);
      setAppState(prev => ({
        ...prev,
        lenses: prev.lenses.map(l => l.id === lens.id ? lens : l)
      }));
    } catch (error) {
      console.error('Failed to update lens:', error);
      alert('Failed to update lens. Please try again.');
    }
  };

  const handleLensDeleted = async (lensId: string) => {
    try {
      await storage.deleteLens(lensId);
      setAppState(prev => ({
        ...prev,
        lenses: prev.lenses.filter(l => l.id !== lensId)
      }));
    } catch (error) {
      console.error('Failed to delete lens:', error);
      alert('Failed to delete lens. Please try again.');
    }
  };

  const handleExposureTaken = async (exposure: Exposure) => {
    try {
      await storage.saveExposure(exposure);
      setAppState(prev => ({
        ...prev,
        exposures: [...prev.exposures.filter(e => e.id !== exposure.id), exposure]
      }));
    } catch (error) {
      console.error('Failed to save photo:', error);
      alert('Failed to save photo. Please try again.');
    }
  };

  const handleExposureUpdate = async (exposure: Exposure) => {
    try {
      await storage.saveExposure(exposure);
      setAppState(prev => ({
        ...prev,
        exposures: prev.exposures.map(e => e.id === exposure.id ? exposure : e),
        selectedExposure: exposure
      }));
    } catch (error) {
      console.error('Failed to update photo:', error);
      alert('Failed to update photo. Please try again.');
    }
  };

  const handleExposureDelete = async (exposureId: string) => {
    try {
      await storage.deleteExposure(exposureId);
      setAppState(prev => ({
        ...prev,
        exposures: prev.exposures.filter(e => e.id !== exposureId),
        selectedExposure: prev.selectedExposure?.id === exposureId ? null : prev.selectedExposure
      }));
    } catch (error) {
      console.error('Failed to delete photo:', error);
      alert('Failed to delete photo. Please try again.');
    }
  };

  const handlePwaUpdate = () => {
    // Ask for confirmation to ensure user wants to update
    const confirmed = window.confirm(
      'Update the app to the latest version?\n\n' +
      'The app will reload and your current progress will be preserved.\n\n' +
      'Click OK to update or Cancel to continue with the current version.'
    );

    if (!confirmed) {
      return;
    }

    setPwaUpdateAvailable(false);

    if (waitingWorker) {
      // Tell the waiting service worker to skip waiting and become active
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });

      // Listen for when it becomes activated, then reload
      waitingWorker.addEventListener('statechange', () => {
        if (waitingWorker.state === 'activated') {
          window.location.reload();
        }
      });
    } else {
      // Fallback: just reload immediately
      window.location.reload();
    }
  };

  const handleDataImported = (filmRoll: FilmRoll, exposures: Exposure[]) => {
    // Update current film roll and exposures
    setAppState(prev => ({
      ...prev,
      currentFilmRoll: filmRoll,
      filmRolls: [...prev.filmRolls.filter(r => r.id !== filmRoll.id), filmRoll],
      exposures: [...prev.exposures.filter(e => e.filmRollId !== filmRoll.id), ...exposures],
      currentScreen: 'gallery'
    }));

    // Update storage
    storage.setCurrentFilmRoll(filmRoll);
  };

  const navigateToScreen = (screen: AppState['currentScreen'], selectedExposure?: Exposure) => {
    setAppState(prev => ({
      ...prev,
      currentScreen: screen,
      selectedExposure: selectedExposure || null
    }));
  };

  const handleSettingsChange = async (newSettings: AppSettings) => {
    try {
      await storage.saveSettings(newSettings);
      setAppState(prev => ({
        ...prev,
        settings: newSettings
      }));

      // Sync manager temporarily disabled
      console.log('Settings updated (sync manager disabled)');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    }
  };

  const handleManualSync = async () => {
    throw new Error('Sync functionality temporarily disabled during storage migration');
  };

  const renderCurrentScreen = () => {
    switch (appState.currentScreen) {
      case 'filmrolls':
        return (
          <MainScreen
            filmRolls={appState.filmRolls}
            exposures={appState.exposures}
            cameras={appState.cameras}
            lenses={appState.lenses}
            onFilmRollSelected={handleFilmRollSelected}
            onFilmRollCreated={handleFilmRollCreated}
            onFilmRollDeleted={handleFilmRollDeleted}
            onDataImported={handleDataImported}
            onCameraCreated={handleCameraCreated}
            onCameraUpdated={handleCameraUpdated}
            onCameraDeleted={handleCameraDeleted}
            onLensCreated={handleLensCreated}
            onLensUpdated={handleLensUpdated}
            onLensDeleted={handleLensDeleted}
            onSettingsClick={() => setShowSettings(true)}
          />
        );

      case 'setup':
        return (
          <SetupScreen
            cameras={appState.cameras}
            lenses={appState.lenses}
            onFilmRollCreated={handleFilmRollCreated}
          />
        );

      case 'camera':
        if (!appState.currentFilmRoll) return null;
        return (
          <CameraScreen
            filmRoll={appState.currentFilmRoll}
            lenses={appState.lenses}
            exposures={appState.exposures}
            onExposureTaken={handleExposureTaken}
            onFilmRollUpdated={handleFilmRollUpdated}
            onOpenGallery={() => navigateToScreen('gallery')}
            onBack={() => navigateToScreen('filmrolls')}
            currentSettings={exposureSettings}
            setCurrentSettings={setExposureSettings}
          />
        );

      case 'gallery':
        if (!appState.currentFilmRoll) return null;
        return (
          <GalleryScreen
            filmRoll={appState.currentFilmRoll}
            lenses={appState.lenses}
            exposures={appState.exposures}
            onExposureSelect={(exposure) => navigateToScreen('details', exposure)}
            onExposureDelete={handleExposureDelete}
            onExposureUpdate={handleExposureUpdate}
            onBack={() => navigateToScreen('camera')}
            onHome={() => navigateToScreen('filmrolls')}
            onDataImported={handleDataImported}
          />
        );

      case 'details':
        if (!appState.selectedExposure) return null;
        return (
          <DetailsScreen
            exposure={appState.selectedExposure}
            lenses={appState.lenses}
            onExposureUpdate={handleExposureUpdate}
            onExposureDelete={handleExposureDelete}
            onBack={() => navigateToScreen('gallery')}
          />
        );

      default:
        return null;
    }
  };

  return (
    <ThemeProvider theme={filmTheme}>
      <CssBaseline />
      {renderCurrentScreen()}

      {/* Settings Modal */}
      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={appState.settings}
        onSettingsChange={handleSettingsChange}
        onManualSync={handleManualSync}
      />

      {/* PWA Update Notification */}
      <Snackbar
        open={pwaUpdateAvailable}
        onClose={() => setPwaUpdateAvailable(false)}
        autoHideDuration={null}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="info"
          action={
            <>
              <Button color="inherit" size="small" onClick={() => setPwaUpdateAvailable(false)}>
                Later
              </Button>
              <Button color="inherit" size="small" onClick={handlePwaUpdate} sx={{ ml: 1 }}>
                Update
              </Button>
            </>
          }
        >
          New version available! Your data will be preserved.
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;
