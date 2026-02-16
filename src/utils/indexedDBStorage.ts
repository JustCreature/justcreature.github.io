/**
 * IndexedDB storage implementation for film photography app
 * Provides much larger storage quota compared to localStorage
 * Maintains same API as localStorage version for seamless migration
 */

import type { FilmRoll, Exposure, Camera, Lens, AppSettings } from '../types';

const DB_NAME = 'FilmPhotographyTracker';
const DB_VERSION = 2; // Incremented for lens support

// Object store names
const STORES = {
    FILM_ROLLS: 'filmRolls',
    EXPOSURES: 'exposures',
    CAMERAS: 'cameras',
    LENSES: 'lenses',
    SETTINGS: 'settings',
    CURRENT_FILM_ROLL: 'currentFilmRoll'
} as const;

class IndexedDBStorage {
    private db: IDBDatabase | null = null;
    private initPromise: Promise<void> | null = null;

    constructor() {
        this.initPromise = this.initDB();
    }

    /**
     * Initialize IndexedDB and create object stores
     */
    private async initDB(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB initialized successfully');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                const oldVersion = event.oldVersion;

                console.log(`Upgrading IndexedDB from version ${oldVersion} to ${DB_VERSION}`);

                // Create object stores (v1)
                if (!db.objectStoreNames.contains(STORES.FILM_ROLLS)) {
                    const filmRollStore = db.createObjectStore(STORES.FILM_ROLLS, { keyPath: 'id' });
                    filmRollStore.createIndex('createdAt', 'createdAt', { unique: false });
                }

                if (!db.objectStoreNames.contains(STORES.EXPOSURES)) {
                    const exposureStore = db.createObjectStore(STORES.EXPOSURES, { keyPath: 'id' });
                    exposureStore.createIndex('filmRollId', 'filmRollId', { unique: false });
                    exposureStore.createIndex('capturedAt', 'capturedAt', { unique: false });
                }

                if (!db.objectStoreNames.contains(STORES.CAMERAS)) {
                    const cameraStore = db.createObjectStore(STORES.CAMERAS, { keyPath: 'id' });
                    cameraStore.createIndex('createdAt', 'createdAt', { unique: false });
                }

                if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
                    db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
                }

                if (!db.objectStoreNames.contains(STORES.CURRENT_FILM_ROLL)) {
                    db.createObjectStore(STORES.CURRENT_FILM_ROLL, { keyPath: 'key' });
                }

                // Add lenses store (v2)
                if (oldVersion < 2 && !db.objectStoreNames.contains(STORES.LENSES)) {
                    const lensStore = db.createObjectStore(STORES.LENSES, { keyPath: 'id' });
                    lensStore.createIndex('createdAt', 'createdAt', { unique: false });
                    console.log('Created lenses object store');
                }

                console.log('IndexedDB object stores created/upgraded');
            };
        });
    }

    /**
     * Public method to initialize IndexedDB and perform migration
     */
    public async initialize(): Promise<void> {
        await this.ensureDB();
        await this.migrateFromLocalStorage();
    }

    /**
     * Ensure DB is initialized before operations
     */
    private async ensureDB(): Promise<IDBDatabase> {
        if (this.initPromise) {
            await this.initPromise;
        }
        if (!this.db) {
            throw new Error('IndexedDB not initialized');
        }
        return this.db;
    }

    /**
     * Generic get operation
     */
    private async get<T>(storeName: string, key: string): Promise<T | null> {
        const db = await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => {
                resolve(request.result || null);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Generic put operation
     */
    private async put(storeName: string, data: any): Promise<void> {
        const db = await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Generic delete operation
     */
    private async delete(storeName: string, key: string): Promise<void> {
        const db = await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Get all items from a store
     */
    private async getAll<T>(storeName: string): Promise<T[]> {
        const db = await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Film Rolls
    async saveFilmRoll(filmRoll: FilmRoll): Promise<void> {
        await this.put(STORES.FILM_ROLLS, filmRoll);
    }

    async getFilmRolls(): Promise<FilmRoll[]> {
        const rolls = await this.getAll<FilmRoll>(STORES.FILM_ROLLS);
        return rolls.map(roll => ({
            ...roll,
            createdAt: new Date(roll.createdAt)
        }));
    }

    async deleteFilmRoll(filmRollId: string): Promise<void> {
        await this.delete(STORES.FILM_ROLLS, filmRollId);

        // Also delete associated exposures
        const exposures = await this.getExposures();
        const exposuresToDelete = exposures.filter(e => e.filmRollId === filmRollId);

        for (const exposure of exposuresToDelete) {
            await this.deleteExposure(exposure.id);
        }
    }

    // Current Film Roll
    async setCurrentFilmRoll(filmRoll: FilmRoll | null): Promise<void> {
        if (filmRoll) {
            await this.put(STORES.CURRENT_FILM_ROLL, { key: 'current', filmRoll });
        } else {
            await this.delete(STORES.CURRENT_FILM_ROLL, 'current');
        }
    }

    async getCurrentFilmRoll(): Promise<FilmRoll | null> {
        const result = await this.get<{ key: string; filmRoll: FilmRoll }>(STORES.CURRENT_FILM_ROLL, 'current');
        if (!result) return null;

        return {
            ...result.filmRoll,
            createdAt: new Date(result.filmRoll.createdAt)
        };
    }

    // Cameras
    async saveCamera(camera: Camera): Promise<void> {
        await this.put(STORES.CAMERAS, camera);
    }

    async getCameras(): Promise<Camera[]> {
        const cameras = await this.getAll<Camera>(STORES.CAMERAS);
        return cameras.map(camera => ({
            ...camera,
            createdAt: new Date(camera.createdAt)
        }));
    }

    async deleteCamera(cameraId: string): Promise<void> {
        await this.delete(STORES.CAMERAS, cameraId);
    }

    // Lenses
    async saveLens(lens: Lens): Promise<void> {
        await this.put(STORES.LENSES, lens);
    }

    async getLenses(): Promise<Lens[]> {
        const lenses = await this.getAll<Lens>(STORES.LENSES);
        return lenses.map(lens => ({
            ...lens,
            createdAt: new Date(lens.createdAt)
        }));
    }

    async deleteLens(lensId: string): Promise<void> {
        await this.delete(STORES.LENSES, lensId);
    }

    // Exposures
    async saveExposure(exposure: Exposure): Promise<void> {
        await this.put(STORES.EXPOSURES, exposure);
    }

    async getExposures(): Promise<Exposure[]> {
        const exposures = await this.getAll<Exposure>(STORES.EXPOSURES);
        return exposures.map(exposure => ({
            ...exposure,
            capturedAt: new Date(exposure.capturedAt)
        }));
    }

    async getExposuresForFilmRoll(filmRollId: string): Promise<Exposure[]> {
        const allExposures = await this.getExposures();
        return allExposures.filter(exposure => exposure.filmRollId === filmRollId);
    }

    async deleteExposure(exposureId: string): Promise<void> {
        await this.delete(STORES.EXPOSURES, exposureId);
    }

    // Settings
    async saveSettings(settings: AppSettings): Promise<void> {
        await this.put(STORES.SETTINGS, { key: 'appSettings', settings });
    }

    async getSettings(): Promise<AppSettings> {
        const result = await this.get<{ key: string; settings: AppSettings }>(STORES.SETTINGS, 'appSettings');

        const defaultSettings: AppSettings = {
            googleDrive: {
                enabled: false,
                autoSync: false
            },
            version: '1.0.0'
        };

        if (!result) {
            return defaultSettings;
        }

        try {
            return {
                ...defaultSettings,
                ...result.settings,
                googleDrive: {
                    ...defaultSettings.googleDrive,
                    ...result.settings.googleDrive,
                    lastSyncTime: result.settings.googleDrive?.lastSyncTime
                        ? new Date(result.settings.googleDrive.lastSyncTime)
                        : undefined
                }
            };
        } catch {
            return defaultSettings;
        }
    }

    // Clear all data
    async clearAll(): Promise<void> {
        const db = await this.ensureDB();
        const storeNames = Object.values(STORES);

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeNames, 'readwrite');

            let completedStores = 0;
            const totalStores = storeNames.length;

            const checkCompletion = () => {
                completedStores++;
                if (completedStores === totalStores) {
                    resolve();
                }
            };

            storeNames.forEach(storeName => {
                const store = transaction.objectStore(storeName);
                const request = store.clear();

                request.onsuccess = () => checkCompletion();
                request.onerror = () => reject(request.error);
            });
        });
    }

    /**
     * Migrate data from localStorage to IndexedDB
     */
    async migrateFromLocalStorage(): Promise<{ success: boolean; message: string; migratedItems: number }> {
        try {
            let migratedItems = 0;

            // Migration helper
            const migrateLocalStorageKey = async (key: string, migrateFn: (data: any) => Promise<void>) => {
                const stored = localStorage.getItem(key);
                if (stored) {
                    try {
                        const data = JSON.parse(stored);
                        await migrateFn(data);
                        localStorage.removeItem(key); // Remove from localStorage after successful migration
                        return Array.isArray(data) ? data.length : 1;
                    } catch (error) {
                        console.warn(`Failed to migrate ${key}:`, error);
                    }
                }
                return 0;
            };

            // Migrate film rolls
            migratedItems += await migrateLocalStorageKey('filmRolls', async (filmRolls: FilmRoll[]) => {
                for (const roll of filmRolls) {
                    roll.createdAt = new Date(roll.createdAt);
                    await this.saveFilmRoll(roll);
                }
            });

            // Migrate exposures
            migratedItems += await migrateLocalStorageKey('exposures', async (exposures: Exposure[]) => {
                for (const exposure of exposures) {
                    exposure.capturedAt = new Date(exposure.capturedAt);
                    await this.saveExposure(exposure);
                }
            });

            // Migrate cameras
            migratedItems += await migrateLocalStorageKey('cameras', async (cameras: Camera[]) => {
                for (const camera of cameras) {
                    camera.createdAt = new Date(camera.createdAt);
                    await this.saveCamera(camera);
                }
            });

            // Migrate current film roll
            migratedItems += await migrateLocalStorageKey('currentFilmRoll', async (filmRoll: FilmRoll) => {
                filmRoll.createdAt = new Date(filmRoll.createdAt);
                await this.setCurrentFilmRoll(filmRoll);
            });

            // Migrate settings
            migratedItems += await migrateLocalStorageKey('appSettings', async (settings: AppSettings) => {
                if (settings.googleDrive?.lastSyncTime) {
                    settings.googleDrive.lastSyncTime = new Date(settings.googleDrive.lastSyncTime);
                }
                await this.saveSettings(settings);
            });

            return {
                success: true,
                message: `Successfully migrated ${migratedItems} items from localStorage to IndexedDB`,
                migratedItems
            };

        } catch (error) {
            console.error('Migration failed:', error);
            return {
                success: false,
                message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                migratedItems: 0
            };
        }
    }

    /**
     * Check if IndexedDB is supported and available
     */
    static isSupported(): boolean {
        return typeof indexedDB !== 'undefined';
    }

    /**
     * Get storage usage estimate (if supported)
     */
    async getStorageEstimate(): Promise<{ used: number; quota: number } | null> {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                return {
                    used: estimate.usage || 0,
                    quota: estimate.quota || 0
                };
            } catch (error) {
                console.warn('Failed to get storage estimate:', error);
            }
        }
        return null;
    }
}

// Create singleton instance
const indexedDBStorage = new IndexedDBStorage();

export { indexedDBStorage };