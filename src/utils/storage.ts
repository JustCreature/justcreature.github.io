import type { FilmRoll, Exposure, Camera, Lens, AppSettings } from '../types';
import { indexedDBStorage } from './indexedDBStorage';

// Simple, reliable async storage - no caching, no fallbacks, just IndexedDB
export const storage = {
    // Initialize storage
    initialize: async (): Promise<void> => {
        await indexedDBStorage.initialize();
    },

    // Film Rolls
    saveFilmRoll: async (filmRoll: FilmRoll): Promise<void> => {
        try {
            await indexedDBStorage.saveFilmRoll(filmRoll);
            console.log('Film roll saved successfully:', filmRoll.name);
        } catch (error) {
            console.error('Failed to save film roll:', error);
            throw new Error('Failed to save film roll. Please try again.');
        }
    },

    getFilmRolls: async (): Promise<FilmRoll[]> => {
        try {
            const rolls = await indexedDBStorage.getFilmRolls();
            console.log(`Retrieved ${rolls.length} film rolls from storage`);
            return rolls;
        } catch (error) {
            console.error('Failed to get film rolls:', error);
            return [];
        }
    },

    deleteFilmRoll: async (filmRollId: string): Promise<void> => {
        try {
            await indexedDBStorage.deleteFilmRoll(filmRollId);
            console.log('Film roll deleted successfully:', filmRollId);
        } catch (error) {
            console.error('Failed to delete film roll:', error);
            throw new Error('Failed to delete film roll. Please try again.');
        }
    },

    // Current Film Roll
    setCurrentFilmRoll: async (filmRoll: FilmRoll | null): Promise<void> => {
        try {
            await indexedDBStorage.setCurrentFilmRoll(filmRoll);
            console.log('Current film roll set:', filmRoll?.name || 'null');
        } catch (error) {
            console.error('Failed to set current film roll:', error);
            throw new Error('Failed to set current film roll. Please try again.');
        }
    },

    getCurrentFilmRoll: async (): Promise<FilmRoll | null> => {
        try {
            const roll = await indexedDBStorage.getCurrentFilmRoll();
            console.log('Retrieved current film roll:', roll?.name || 'null');
            return roll;
        } catch (error) {
            console.error('Failed to get current film roll:', error);
            return null;
        }
    },

    // Cameras
    saveCamera: async (camera: Camera): Promise<void> => {
        try {
            await indexedDBStorage.saveCamera(camera);
            console.log('Camera saved successfully:', camera.name);
        } catch (error) {
            console.error('Failed to save camera:', error);
            throw new Error('Failed to save camera. Please try again.');
        }
    },

    getCameras: async (): Promise<Camera[]> => {
        try {
            const cameras = await indexedDBStorage.getCameras();
            console.log(`Retrieved ${cameras.length} cameras from storage`);
            return cameras;
        } catch (error) {
            console.error('Failed to get cameras:', error);
            return [];
        }
    },

    deleteCamera: async (cameraId: string): Promise<void> => {
        try {
            await indexedDBStorage.deleteCamera(cameraId);
            console.log('Camera deleted successfully:', cameraId);
        } catch (error) {
            console.error('Failed to delete camera:', error);
            throw new Error('Failed to delete camera. Please try again.');
        }
    },

    // Lenses
    saveLens: async (lens: Lens): Promise<void> => {
        try {
            await indexedDBStorage.saveLens(lens);
            console.log('Lens saved successfully:', lens.name);
        } catch (error) {
            console.error('Failed to save lens:', error);
            throw new Error('Failed to save lens. Please try again.');
        }
    },

    getLenses: async (): Promise<Lens[]> => {
        try {
            const lenses = await indexedDBStorage.getLenses();
            console.log(`Retrieved ${lenses.length} lenses from storage`);
            return lenses;
        } catch (error) {
            console.error('Failed to get lenses:', error);
            return [];
        }
    },

    deleteLens: async (lensId: string): Promise<void> => {
        try {
            await indexedDBStorage.deleteLens(lensId);
            console.log('Lens deleted successfully:', lensId);
        } catch (error) {
            console.error('Failed to delete lens:', error);
            throw new Error('Failed to delete lens. Please try again.');
        }
    },

    // Exposures
    saveExposure: async (exposure: Exposure): Promise<void> => {
        try {
            await indexedDBStorage.saveExposure(exposure);
            console.log('Exposure saved successfully:', exposure.id);
        } catch (error) {
            console.error('Failed to save exposure:', error);
            throw new Error('Failed to save photo. Please try again.');
        }
    },

    getExposures: async (): Promise<Exposure[]> => {
        try {
            const exposures = await indexedDBStorage.getExposures();
            console.log(`Retrieved ${exposures.length} exposures from storage`);
            return exposures;
        } catch (error) {
            console.error('Failed to get exposures:', error);
            return [];
        }
    },

    getExposuresForFilmRoll: async (filmRollId: string): Promise<Exposure[]> => {
        try {
            const allExposures = await storage.getExposures();
            const filmRollExposures = allExposures.filter(exposure => exposure.filmRollId === filmRollId);
            console.log(`Retrieved ${filmRollExposures.length} exposures for film roll ${filmRollId}`);
            return filmRollExposures;
        } catch (error) {
            console.error('Failed to get exposures for film roll:', error);
            return [];
        }
    },

    deleteExposure: async (exposureId: string): Promise<void> => {
        try {
            await indexedDBStorage.deleteExposure(exposureId);
            console.log('Exposure deleted successfully:', exposureId);
        } catch (error) {
            console.error('Failed to delete exposure:', error);
            throw new Error('Failed to delete photo. Please try again.');
        }
    },

    // Settings
    saveSettings: async (settings: AppSettings): Promise<void> => {
        try {
            await indexedDBStorage.saveSettings(settings);
            console.log('Settings saved successfully');
        } catch (error) {
            console.error('Failed to save settings:', error);
            throw new Error('Failed to save settings. Please try again.');
        }
    },

    getSettings: async (): Promise<AppSettings> => {
        const defaultSettings: AppSettings = {
            googleDrive: {
                enabled: false,
                autoSync: false
            },
            version: '1.0.0'
        };

        try {
            const settings = await indexedDBStorage.getSettings();
            console.log('Retrieved settings from storage');
            return settings;
        } catch (error) {
            console.error('Failed to get settings:', error);
            return defaultSettings;
        }
    },

    // Clear all data
    clearAll: async (): Promise<void> => {
        try {
            await indexedDBStorage.clearAll();
            console.log('All data cleared successfully');
        } catch (error) {
            console.error('Failed to clear data:', error);
            throw new Error('Failed to clear data. Please try again.');
        }
    }
};