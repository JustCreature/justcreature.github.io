/**
 * Test data generators and constants for E2E tests
 * Provides consistent test data across all test files
 */

export const TEST_DATA = {
  filmRolls: {
    basic: {
      name: 'Kodak Portra 400',
      iso: '400',
      exposures: '36'
    },
    highIso: {
      name: 'Ilford HP5 Plus',
      iso: '1600',
      exposures: '24'
    },
    digital: {
      name: 'Test Digital Roll',
      iso: '100',
      exposures: '100'
    }
  },
  cameras: {
    canon: {
      make: 'Canon',
      model: 'EOS R5'
    },
    nikon: {
      make: 'Nikon',
      model: 'D750'
    },
    vintage: {
      make: 'Zenit',
      model: 'ET'
    }
  },
  lenses: {
    primeFast: {
      name: '50mm f/1.4',
      maxAperture: 'f/1.4',
      focalLength: '50'
    },
    primeSlow: {
      name: '50mm f/1.8',
      maxAperture: 'f/1.8',
      focalLength: '50'
    },
    zoomStandard: {
      name: '24-70mm f/2.8',
      maxAperture: 'f/2.8',
      minFocalLength: '24',
      maxFocalLength: '70'
    },
    telephoto: {
      name: '70-200mm f/4',
      maxAperture: 'f/4',
      minFocalLength: '70',
      maxFocalLength: '200'
    }
  },
  settings: {
    apertures: ['f/1.4', 'f/2.8', 'f/5.6', 'f/8', 'f/11'],
    shutterSpeeds: ['1/1000', '1/500', '1/250', '1/125', '1/60'],
    notes: [
      'Golden hour portrait',
      'Street photography',
      'Landscape shot',
      'Test exposure'
    ]
  }
};

/**
 * Generate random test data
 */
export const generateTestData = {
  filmRoll: () => ({
    name: `Test Film ${Date.now()}`,
    iso: String(Math.floor(Math.random() * 3200) + 100),
    exposures: String(Math.floor(Math.random() * 36) + 12)
  }),

  camera: () => ({
    make: `Make${Date.now()}`,
    model: `Model${Date.now()}`
  }),

  lens: () => {
    const focalLength = Math.floor(Math.random() * 200) + 20;
    // Use valid aperture values from the app
    const validApertures = ['f/1.4', 'f/2', 'f/2.8', 'f/3.5', 'f/4', 'f/4.5', 'f/5.6', 'f/8', 'f/11', 'f/16', 'f/22'];
    const aperture = validApertures[Math.floor(Math.random() * validApertures.length)];
    return {
      name: `${focalLength}mm ${aperture}`,
      maxAperture: aperture,
      focalLength: String(focalLength)
    };
  },

  exposure: () => ({
    aperture: TEST_DATA.settings.apertures[Math.floor(Math.random() * TEST_DATA.settings.apertures.length)],
    shutterSpeed: TEST_DATA.settings.shutterSpeeds[Math.floor(Math.random() * TEST_DATA.settings.shutterSpeeds.length)],
    notes: TEST_DATA.settings.notes[Math.floor(Math.random() * TEST_DATA.settings.notes.length)]
  })
};

/**
 * Validation helpers for test assertions
 */
export const validators = {
  isValidISO: (iso: string): boolean => {
    const isoNum = parseInt(iso);
    return isoNum >= 25 && isoNum <= 6400;
  },

  isValidExposureCount: (count: string): boolean => {
    const countNum = parseInt(count);
    return countNum >= 1 && countNum <= 100;
  },

  isValidCameraName: (make: string, model: string, lens?: string): string => {
    const cameraBody = `${make} ${model}`.trim();
    return lens ? `${cameraBody}, ${lens}` : cameraBody;
  }
};

/**
 * Generate export data for import testing
 */
export const generateExportData = {
  /**
   * Create a valid JSON with images export format
   */
  jsonWithImages: (filmRollData: {
    name: string;
    iso: number;
    totalExposures: number;
    exposureCount?: number;
  }) => {
    const filmRollId = `test-${Date.now()}`;
    const exposureCount = filmRollData.exposureCount || 3;
    const exposures = [];

    for (let i = 1; i <= exposureCount; i++) {
      exposures.push({
        id: `exposure-${filmRollId}-${i}`,
        filmRollId: filmRollId,
        exposureNumber: i,
        aperture: 'f/8',
        shutterSpeed: '1/125',
        additionalInfo: `Test exposure ${i}`,
        // Small 1x1 red pixel PNG as base64
        imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
        capturedAt: new Date().toISOString(),
        ei: filmRollData.iso,
        lensId: undefined,
        lensName: undefined,
        focalLength: 50
      });
    }

    return {
      filmRoll: {
        id: filmRollId,
        name: filmRollData.name,
        iso: filmRollData.iso,
        totalExposures: filmRollData.totalExposures,
        createdAt: new Date().toISOString()
      },
      exposures: exposures,
      exportedAt: new Date().toISOString(),
      version: '2.0.0',
      exportType: 'with-images'
    };
  }
};