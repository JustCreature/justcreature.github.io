export interface Lens {
    id: string;
    name: string;
    maxAperture: string; // e.g., "f/1.4", "f/2.8"
    focalLengthMin?: number; // For zoom lenses
    focalLengthMax?: number; // For zoom lenses
    focalLength?: number; // For prime lenses
    createdAt: Date;
}

export interface Camera {
    id: string;
    make: string;
    model: string;
    lens: string; // Kept for backward compatibility, deprecated
    lenses?: string[]; // Array of lens IDs
    name: string; // Auto-generated: "Make Model"
    createdAt: Date;
}

export interface FilmRoll {
    id: string;
    name: string;
    iso: number;
    ei?: number; // Exposure Index (can differ from ISO)
    totalExposures: number;
    cameraId?: string;
    currentLensId?: string; // Track currently used lens
    createdAt: Date;
}

export interface Exposure {
    id: string;
    filmRollId: string;
    exposureNumber: number;
    aperture: string;
    shutterSpeed: string;
    additionalInfo: string;
    imageData?: string; // Base64 encoded image
    location?: {
        latitude: number;
        longitude: number;
        address?: string;
    };
    capturedAt: Date;
    // New optional fields for backward compatibility
    ei?: number; // Exposure Index used for this shot
    lensId?: string; // Lens used for this shot
    focalLength?: number; // Focal length in mm
}

export interface GoogleDriveSettings {
    enabled: boolean;
    folderId?: string;
    folderUrl?: string;
    clientId?: string;
    apiKey?: string;
    accessToken?: string;
    autoSync: boolean;
    lastSyncTime?: Date;
}

export interface AppSettings {
    googleDrive: GoogleDriveSettings;
    version: string;
}


export const APERTURE = {
    F_1_4: 'f/1.4',
    F_2: 'f/2',
    F_2_8: 'f/2.8',
    F_3_5: 'f/3.5',
    F_4: 'f/4',
    F_4_5: 'f/4.5',
    F_5_6: 'f/5.6',
    F_8: 'f/8',
    F_11: 'f/11',
    F_16: 'f/16',
    F_22: 'f/22'
} as const;

export const APERTURE_VALUES = Object.values(APERTURE);
export type ApertureEnum = typeof APERTURE[keyof typeof APERTURE];

export const SHUTTER_SPEED = {
    S_1_4000: '1/4000',
    S_1_2000: '1/2000',
    S_1_1000: '1/1000',
    S_1_500: '1/500',
    S_1_250: '1/250',
    S_1_125: '1/125',
    S_1_60: '1/60',
    S_1_30: '1/30',
    S_1_15: '1/15',
    S_1_8: '1/8',
    S_1_4: '1/4',
    S_1_2: '1/2',
    S_1: '1',
    S_2: '2',
    S_4: '4',
    S_8: '8',
    BULB: 'BULB'
} as const;

export const SHUTTER_SPEED_VALUES = Object.values(SHUTTER_SPEED);
export type ShutterSpeedEnum = typeof SHUTTER_SPEED[keyof typeof SHUTTER_SPEED];

export interface ExposureSettings {
    aperture: ApertureEnum;
    shutterSpeed: ShutterSpeedEnum;
    additionalInfo: string;
    ei?: number;
    lensId?: string;
    focalLength?: number;
}

// Common EI/ISO values
export const EI_VALUES = [
    25, 32, 40, 50, 64, 80, 100, 125, 160, 200,
    250, 320, 400, 500, 640, 800, 1000, 1250, 1600,
    2000, 2500, 3200, 4000, 5000, 6400
] as const;

export interface ExportDataWithImages {
    filmRoll: FilmRoll;
    exposures: ExposureWithImageData[];
    exportedAt: string;
    version: string;
    exportType: 'with-images';
}

export interface ExposureWithImageData {
    id: string;
    filmRollId: string;
    exposureNumber: number;
    aperture: string;
    shutterSpeed: string;
    additionalInfo: string;
    imageData?: string; // Base64 data URL embedded directly
    location?: {
        latitude: number;
        longitude: number;
        address?: string;
    };
    capturedAt: string;
    ei?: number;
    lensId?: string;
    lensName?: string;
    focalLength?: number;
}

export interface AppState {
    currentFilmRoll: FilmRoll | null;
    filmRolls: FilmRoll[];
    cameras: Camera[];
    lenses: Lens[];
    exposures: Exposure[];
    currentScreen: 'filmrolls' | 'setup' | 'camera' | 'gallery' | 'details';
    selectedExposure: Exposure | null;
    settings: AppSettings;
}
