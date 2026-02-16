import { test, expect } from './fixtures/test-fixtures';
import { TEST_DATA, generateTestData, validators } from './utils/test-data';

/**
 * Camera Management Tests
 * Tests creation, editing, deletion, and validation of cameras
 */
test.describe('Camera Management', () => {

    test('should create camera without lens', async ({ filmTrackerPage, cleanApp }) => {
        await filmTrackerPage.camerasTab.click();

        const cameraData = {
            make: 'Nikon',
            model: 'D750'
        };

        await filmTrackerPage.createCamera(cameraData);

        const expectedName = validators.isValidCameraName(cameraData.make, cameraData.model);
        await expect(filmTrackerPage.page.getByText(expectedName)).toBeVisible();
    });

    test('should handle special characters in camera data', async ({ filmTrackerPage, cleanApp }) => {
        await filmTrackerPage.camerasTab.click();

        const specialCamera = {
            make: 'Mamiya',
            model: 'RZ67 Pro II'
        };

        await filmTrackerPage.createCamera(specialCamera);

        const expectedName = validators.isValidCameraName(
            specialCamera.make,
            specialCamera.model
        );
        await expect(filmTrackerPage.page.getByText(expectedName)).toBeVisible();
    });

    test('should handle camera creation with generated data', async ({ filmTrackerPage, cleanApp }) => {
        await filmTrackerPage.camerasTab.click();

        // Generate random camera data
        const randomCamera = generateTestData.camera();

        await filmTrackerPage.createCamera(randomCamera);

        const expectedName = validators.isValidCameraName(
            randomCamera.make,
            randomCamera.model
        );
        await expect(filmTrackerPage.page.getByText(expectedName)).toBeVisible();
    });

    test('should verify lenses tab exists', async ({ filmTrackerPage, cleanApp }) => {
        await expect(filmTrackerPage.lensesTab).toBeVisible();

        // Navigate to lenses tab
        await filmTrackerPage.lensesTab.click();
        await expect(filmTrackerPage.lensesTab).toHaveAttribute('aria-selected', 'true');

        // Verify empty state
        await expect(filmTrackerPage.page.getByText(/no lenses added/i)).toBeVisible();
        await expect(filmTrackerPage.addLensButton).toBeVisible();
    });
});