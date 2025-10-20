import { test, expect } from './fixtures/test-fixtures';
import { TEST_DATA, generateTestData } from './utils/test-data';

/**
 * Photography Workflow Tests
 * Tests the complete photography workflow: film roll → camera settings → capturing photos
 */
test.describe('Photography Workflow', () => {
    test('should navigate through complete photography workflow', async ({ filmTrackerPage, cleanApp }) => {
        // Create film roll
        await filmTrackerPage.createFilmRoll(TEST_DATA.filmRolls.basic);

        // Verify we're in camera screen
        await expect(filmTrackerPage.cameraButton).toBeVisible();
        await expect(filmTrackerPage.galleryButton).toBeVisible();

        // Check initial state
        await expect(filmTrackerPage.page.getByText(/1\/36.*left/)).toBeVisible();

        // Access camera settings
        await filmTrackerPage.apertureChip.click();

        // Verify settings dialog opens
        await expect(filmTrackerPage.page.getByRole('dialog')).toBeVisible();
        await expect(filmTrackerPage.page.getByRole('combobox').first()).toBeVisible(); // Aperture select
        await expect(filmTrackerPage.page.getByRole('combobox').nth(1)).toBeVisible(); // Shutter speed select
        await expect(filmTrackerPage.page.getByLabel(/additional info/i)).toBeVisible();
    });

    test('should configure camera settings', async ({ filmTrackerPage, cleanApp }) => {
        await filmTrackerPage.createFilmRoll(TEST_DATA.filmRolls.basic);

        // Configure settings using helper method
        const settings = generateTestData.exposure();
        await filmTrackerPage.configureCameraSettings({
            aperture: settings.aperture,
            shutterSpeed: settings.shutterSpeed,
            notes: settings.notes
        });

        // Verify settings are applied to chips
        await expect(filmTrackerPage.page.locator('.MuiChip-root').getByText(settings.aperture)).toBeVisible();
        await expect(filmTrackerPage.page.locator('.MuiChip-root').getByText(settings.shutterSpeed)).toBeVisible();
    });

    test('should have predefined aperture and shutter speed options', async ({ filmTrackerPage, cleanApp }) => {
        await filmTrackerPage.createFilmRoll(TEST_DATA.filmRolls.basic);

        // Wait for camera screen to be fully loaded
        await expect(filmTrackerPage.apertureChip).toBeVisible();

        // Open settings by clicking aperture chip
        await filmTrackerPage.apertureChip.click();

        // Wait for settings dialog to open
        await expect(filmTrackerPage.page.getByRole('dialog')).toBeVisible();

        // Wait for dialog content to be ready
        await filmTrackerPage.page.waitForTimeout(1000);

        // Check aperture options using simple positional selector
        const apertureSelect = filmTrackerPage.page.getByRole('dialog').locator('div[role="combobox"]').first();
        await apertureSelect.waitFor({ state: 'visible' });
        await apertureSelect.click();

        await expect(filmTrackerPage.page.getByRole('option', { name: 'f/1.4' })).toBeVisible();
        await expect(filmTrackerPage.page.getByRole('option', { name: 'f/2.8' })).toBeVisible();
        await expect(filmTrackerPage.page.getByRole('option', { name: 'f/8' })).toBeVisible();

        // Select f/2.8
        await filmTrackerPage.page.getByRole('option', { name: 'f/2.8' }).click();

        // Check shutter speed options using simple positional selector
        const shutterSpeedSelect = filmTrackerPage.page.getByRole('dialog').locator('div[role="combobox"]').nth(1);
        await shutterSpeedSelect.waitFor({ state: 'visible' });
        await shutterSpeedSelect.click();

        await expect(filmTrackerPage.page.getByRole('option', { name: '1/125' })).toBeVisible();
        await expect(filmTrackerPage.page.getByRole('option', { name: '1/250' })).toBeVisible();
        await expect(filmTrackerPage.page.getByRole('option', { name: '1/500' })).toBeVisible();

        // Select 1/125
        await filmTrackerPage.page.getByRole('option', { name: '1/125' }).click();

        // Close dialog
        await filmTrackerPage.page.getByRole('button', { name: /done/i }).click();

        // Wait for dialog to close
        await filmTrackerPage.page.getByRole('dialog').waitFor({ state: 'hidden', timeout: 5000 });

        // Verify settings are applied to chips (outside the dialog)
        await expect(filmTrackerPage.page.locator('.MuiChip-root').getByText('f/2.8')).toBeVisible();
        await expect(filmTrackerPage.page.locator('.MuiChip-root').getByText('1/125')).toBeVisible();
    });
});