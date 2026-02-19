import { test, expect } from './fixtures/test-fixtures';
import { generateExportData } from './utils/test-data';

/**
 * Import/Export Tests
 * Tests data import and export functionality
 */
test.describe('Import/Export', () => {
    test('should import JSON with images from main screen', async ({ filmTrackerPage, cleanApp }) => {
        const testData = generateExportData.jsonWithImages({
            name: 'Imported Test Film',
            iso: 400,
            totalExposures: 36,
            exposureCount: 3
        });

        // Verify we're on the main film rolls screen
        await expect(filmTrackerPage.filmRollsTab).toBeVisible();

        // Import the data
        await filmTrackerPage.importJsonWithImages(testData);

        // Should navigate to gallery screen showing the imported film roll
        await expect(filmTrackerPage.galleryButton).toBeVisible({ timeout: 10000 });

        // Verify film roll name has [IMPORTED] prefix
        await expect(filmTrackerPage.page.getByText(/\[IMPORTED\].*Imported Test Film/i)).toBeVisible();

        // Verify all exposures were imported
        await expect(filmTrackerPage.page.getByText(/#1/)).toBeVisible();
        await expect(filmTrackerPage.page.getByText(/#2/)).toBeVisible();
        await expect(filmTrackerPage.page.getByText(/#3/)).toBeVisible();

        // Verify exposure details are present
        await expect(filmTrackerPage.page.getByText('f/8')).toBeVisible();
        await expect(filmTrackerPage.page.getByText('1/125')).toBeVisible();
        await expect(filmTrackerPage.page.getByText('Test exposure 1')).toBeVisible();
    });

    test('should show imported film roll in film rolls list', async ({ filmTrackerPage, cleanApp }) => {
        const testData = generateExportData.jsonWithImages({
            name: 'Test Film for List',
            iso: 800,
            totalExposures: 24,
            exposureCount: 2
        });

        // Import the data
        await filmTrackerPage.importJsonWithImages(testData);

        // Wait for navigation to gallery
        await expect(filmTrackerPage.galleryButton).toBeVisible({ timeout: 10000 });

        // Navigate back to main screen
        await filmTrackerPage.backButton.click();
        await filmTrackerPage.backButton.click();

        // Verify film roll appears in the list with [IMPORTED] prefix
        await expect(filmTrackerPage.page.getByText(/\[IMPORTED\].*Test Film for List/i)).toBeVisible();

        // Verify the film roll shows progress (2/24 exposures)
        const filmRollCard = filmTrackerPage.page.locator('.MuiCard-root', {
            has: filmTrackerPage.page.getByText(/\[IMPORTED\].*Test Film for List/i)
        });
        await expect(filmRollCard.getByText(/2.*24/)).toBeVisible();
    });

    test('should handle multiple imports', async ({ filmTrackerPage, cleanApp }) => {
        // Import first film roll
        const testData1 = generateExportData.jsonWithImages({
            name: 'First Import',
            iso: 400,
            totalExposures: 36,
            exposureCount: 1
        });
        await filmTrackerPage.importJsonWithImages(testData1);
        await expect(filmTrackerPage.galleryButton).toBeVisible({ timeout: 10000 });

        // Navigate back to main screen
        await filmTrackerPage.backButton.click();
        await filmTrackerPage.backButton.click();

        // Import second film roll
        const testData2 = generateExportData.jsonWithImages({
            name: 'Second Import',
            iso: 800,
            totalExposures: 24,
            exposureCount: 2
        });
        await filmTrackerPage.importJsonWithImages(testData2);
        await expect(filmTrackerPage.galleryButton).toBeVisible({ timeout: 10000 });

        // Navigate back to main screen
        await filmTrackerPage.backButton.click();
        await filmTrackerPage.backButton.click();

        // Verify both film rolls are in the list
        await expect(filmTrackerPage.page.getByText(/\[IMPORTED\].*First Import/i)).toBeVisible();
        await expect(filmTrackerPage.page.getByText(/\[IMPORTED\].*Second Import/i)).toBeVisible();
    });

    test('should import film roll with high exposure count', async ({ filmTrackerPage, cleanApp }) => {
        const testData = generateExportData.jsonWithImages({
            name: 'High Count Film',
            iso: 100,
            totalExposures: 36,
            exposureCount: 10
        });

        await filmTrackerPage.importJsonWithImages(testData);

        // Verify navigation to gallery
        await expect(filmTrackerPage.galleryButton).toBeVisible({ timeout: 10000 });

        // Verify high exposure count is displayed
        await expect(filmTrackerPage.page.getByText(/10.*36/)).toBeVisible();

        // Verify multiple exposures are visible
        await expect(filmTrackerPage.page.getByText(/#1/)).toBeVisible();
        await expect(filmTrackerPage.page.getByText(/#10/)).toBeVisible();
    });

    test('should preserve exposure metadata on import', async ({ filmTrackerPage, cleanApp }) => {
        const testData = generateExportData.jsonWithImages({
            name: 'Metadata Test',
            iso: 1600,
            totalExposures: 36,
            exposureCount: 1
        });

        // Modify the exposure to have more detailed metadata
        testData.exposures[0].additionalInfo = 'Golden hour portrait with vintage lens';
        testData.exposures[0].aperture = 'f/1.4';
        testData.exposures[0].shutterSpeed = '1/500';
        testData.exposures[0].focalLength = 85;

        await filmTrackerPage.importJsonWithImages(testData);

        // Verify in gallery
        await expect(filmTrackerPage.galleryButton).toBeVisible({ timeout: 10000 });

        // Verify detailed metadata is preserved
        await expect(filmTrackerPage.page.getByText('f/1.4')).toBeVisible();
        await expect(filmTrackerPage.page.getByText('1/500')).toBeVisible();
        await expect(filmTrackerPage.page.getByText('85mm')).toBeVisible();
        await expect(filmTrackerPage.page.getByText(/golden hour portrait/i)).toBeVisible();
    });

    test('should show import button in film rolls toolbar', async ({ filmTrackerPage, cleanApp }) => {
        // Verify import button is visible on main screen
        await expect(filmTrackerPage.importButton).toBeVisible();

        // Click import button to open dialog
        await filmTrackerPage.importButton.click();

        // Verify import dialog opens
        await expect(filmTrackerPage.importDialog).toBeVisible();

        // Verify all import methods are available
        await expect(filmTrackerPage.importMethodLocal).toBeVisible();
        await expect(filmTrackerPage.importMethodJsonWithImages).toBeVisible();
        await expect(filmTrackerPage.importMethodGoogleDrive).toBeVisible();
    });

    test('should default to local files import method', async ({ filmTrackerPage, cleanApp }) => {
        // Open import dialog
        await filmTrackerPage.importButton.click();
        await expect(filmTrackerPage.importDialog).toBeVisible();

        // Verify local files is selected by default
        await expect(filmTrackerPage.importMethodLocal).toBeChecked();
    });
});
