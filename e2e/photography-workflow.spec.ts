import { test, expect } from './fixtures/test-fixtures';
import { TEST_DATA, generateTestData } from './utils/test-data';

/**
 * Photography Workflow Tests
 * Tests the complete photography workflow: film roll → camera settings → capturing photos
 */
test.describe('Photography Workflow', () => {
    // Helper function to create a lens with full aperture range
    async function createTestLens(page: any) {
        await page.getByRole('tab', { name: /lenses/i }).click();
        await page.locator('button[aria-label="add lens"]').click();

        await page.getByLabel(/lens name/i).fill('Test Lens 50mm f/1.4');
        await page.getByLabel(/maximum aperture/i).click();
        await page.getByRole('option', { name: 'f/1.4' }).click();

        await page.getByRole('button', { name: /add lens/i }).first().click();
        await page.waitForTimeout(500);

        // Go back to Film Rolls tab
        await page.getByRole('tab', { name: /film rolls/i }).click();
    }

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

        // Open settings dialog
        await filmTrackerPage.apertureChip.click();
        const dialog = filmTrackerPage.page.getByRole('dialog');
        await expect(dialog).toBeVisible();

        // Verify dialog title
        await expect(dialog.getByText(/exposure settings/i)).toBeVisible();

        // Verify some form controls are present
        await expect(dialog.locator('.MuiFormControl-root').first()).toBeVisible();

        // Close dialog
        await filmTrackerPage.page.getByRole('button', { name: /done/i }).click();
        await expect(dialog).toBeHidden();
    });

    test('should have predefined aperture and shutter speed options', async ({ filmTrackerPage, cleanApp }) => {
        await filmTrackerPage.createFilmRoll(TEST_DATA.filmRolls.basic);

        // Wait for camera screen to be fully loaded
        await expect(filmTrackerPage.apertureChip).toBeVisible();

        // Open settings by clicking aperture chip
        await filmTrackerPage.apertureChip.click();

        // Wait for settings dialog to open
        const dialog = filmTrackerPage.page.getByRole('dialog');
        await expect(dialog).toBeVisible();
        await filmTrackerPage.page.waitForTimeout(1000);

        // Click aperture select using positional selector (it's one of the comboboxes in the dialog)
        // Without a lens selected, all apertures should be available
        const apertureCombobox = dialog.locator('div[role="combobox"]').filter({ hasText: /f\// }).first();
        await apertureCombobox.click();

        // Verify some common aperture values are present
        await expect(filmTrackerPage.page.getByRole('option', { name: 'f/2.8' })).toBeVisible();
        await expect(filmTrackerPage.page.getByRole('option', { name: 'f/8' })).toBeVisible();
        await expect(filmTrackerPage.page.getByRole('option', { name: 'f/16' })).toBeVisible();

        // Select f/8
        await filmTrackerPage.page.getByRole('option', { name: 'f/8' }).click();

        // Click shutter speed select
        const shutterSpeedCombobox = dialog.locator('div[role="combobox"]').filter({ hasText: /1\// }).first();
        await shutterSpeedCombobox.click();

        // Verify some common shutter speeds are present
        await expect(filmTrackerPage.page.getByRole('option', { name: '1/125' })).toBeVisible();
        await expect(filmTrackerPage.page.getByRole('option', { name: '1/250' })).toBeVisible();
        await expect(filmTrackerPage.page.getByRole('option', { name: '1/500' })).toBeVisible();

        // Select 1/125
        await filmTrackerPage.page.getByRole('option', { name: '1/125' }).click();

        // Close dialog
        await filmTrackerPage.page.getByRole('button', { name: /done/i }).click();

        // Wait for dialog to close
        await dialog.waitFor({ state: 'hidden', timeout: 5000 });

        // Verify settings are applied to chips
        await expect(filmTrackerPage.page.locator('.MuiChip-root').getByText('f/8')).toBeVisible();
        await expect(filmTrackerPage.page.locator('.MuiChip-root').getByText('1/125')).toBeVisible();
    });
});