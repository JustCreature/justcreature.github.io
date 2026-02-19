import { test, expect } from './fixtures/test-fixtures';
import { TEST_DATA } from './utils/test-data';

/**
 * Image Upload Tests
 * Tests gallery image upload functionality and image scaling
 */
test.describe('Image Upload and Scaling', () => {

    test('should upload image from gallery and create exposure', async ({ filmTrackerPage, cleanApp, page }) => {
        // Create film roll
        await filmTrackerPage.createFilmRoll(TEST_DATA.filmRolls.basic);

        // Verify we're in camera screen
        await expect(filmTrackerPage.cameraButton).toBeVisible();
        await expect(filmTrackerPage.page.getByText(/1\/36/)).toBeVisible();

        // Navigate to gallery screen
        await filmTrackerPage.galleryButton.click();
        await expect(filmTrackerPage.page.getByText(/No exposures yet/)).toBeVisible();

        // Create a test image file (small 10x10 red square)
        const testImageBuffer = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC',
            'base64'
        );

        // Set up file chooser listener before clicking Add From Gallery button
        const fileChooserPromise = page.waitForEvent('filechooser');

        // Click Add From Gallery button to trigger file picker
        await filmTrackerPage.addFromGalleryButton.click();

        const fileChooser = await fileChooserPromise;

        // Upload the test image
        await fileChooser.setFiles({
            name: 'test-image.png',
            mimeType: 'image/png',
            buffer: testImageBuffer
        });

        // Wait for exposure to be created and verify it appears in the gallery
        await expect(filmTrackerPage.page.getByText(/#1/)).toBeVisible({ timeout: 5000 });
    });

    test('should upload multiple images from gallery', async ({ filmTrackerPage, cleanApp, page }) => {
        // Create film roll
        await filmTrackerPage.createFilmRoll(TEST_DATA.filmRolls.basic);

        // Navigate to gallery screen
        await filmTrackerPage.galleryButton.click();

        const testImageBuffer = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC',
            'base64'
        );

        // Upload first image
        const fileChooserPromise1 = page.waitForEvent('filechooser');
        await filmTrackerPage.addFromGalleryButton.click();
        const fileChooser1 = await fileChooserPromise1;
        await fileChooser1.setFiles({
            name: 'test-image-1.png',
            mimeType: 'image/png',
            buffer: testImageBuffer
        });
        await expect(filmTrackerPage.page.getByText(/#1/)).toBeVisible({ timeout: 5000 });

        // Upload second image
        const fileChooserPromise2 = page.waitForEvent('filechooser');
        await filmTrackerPage.addFromGalleryButton.click();
        const fileChooser2 = await fileChooserPromise2;
        await fileChooser2.setFiles({
            name: 'test-image-2.png',
            mimeType: 'image/png',
            buffer: testImageBuffer
        });
        await expect(filmTrackerPage.page.getByText(/#2/)).toBeVisible({ timeout: 5000 });

        // Verify both exposures are visible in gallery
        await expect(filmTrackerPage.page.getByText(/#1/)).toBeVisible();
        await expect(filmTrackerPage.page.getByText(/#2/)).toBeVisible();
    });

    test('should replace image in exposure details', async ({ filmTrackerPage, cleanApp, page }) => {
        // Create film roll
        await filmTrackerPage.createFilmRoll(TEST_DATA.filmRolls.basic);

        // Navigate to gallery screen
        await filmTrackerPage.galleryButton.click();

        const testImageBuffer = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC',
            'base64'
        );

        // Upload first image
        const fileChooserPromise1 = page.waitForEvent('filechooser');
        await filmTrackerPage.addFromGalleryButton.click();
        const fileChooser1 = await fileChooserPromise1;
        await fileChooser1.setFiles({
            name: 'original.png',
            mimeType: 'image/png',
            buffer: testImageBuffer
        });
        await expect(filmTrackerPage.page.getByText(/#1/)).toBeVisible({ timeout: 5000 });

        // Click on exposure to open details
        await filmTrackerPage.page.getByText(/#1/).click();
        await expect(filmTrackerPage.page.getByText(/Exposure #1/)).toBeVisible();

        // Click edit button (first icon button in the header actions area)
        const editButton = filmTrackerPage.page.locator('button:has(svg[data-testid="EditIcon"])');
        await editButton.click();

        // Click gallery button in the image overlay
        const fileChooserPromise2 = page.waitForEvent('filechooser');
        const galleryButton = filmTrackerPage.page.locator('button:has(svg[data-testid="PhotoLibraryIcon"])');
        await galleryButton.click();
        const fileChooser2 = await fileChooserPromise2;

        // Upload replacement image
        await fileChooser2.setFiles({
            name: 'replacement.png',
            mimeType: 'image/png',
            buffer: testImageBuffer
        });

        // Wait a moment for the image to be processed
        await page.waitForTimeout(500);

        // Save changes
        await filmTrackerPage.page.getByRole('button', { name: /save/i }).click();

        // Verify we're still on details screen (image was replaced successfully)
        await expect(filmTrackerPage.page.getByText(/Exposure #1/)).toBeVisible();
    });

    test('should handle large image upload gracefully', async ({ filmTrackerPage, cleanApp, page }) => {
        // Create film roll
        await filmTrackerPage.createFilmRoll(TEST_DATA.filmRolls.basic);

        // Navigate to gallery screen
        await filmTrackerPage.galleryButton.click();

        // Create a larger test image (100x100 PNG)
        // This is still small for testing, but larger than the 10x10 used in other tests
        const largeImageBuffer = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAXklEQVR42u3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHwZMgAAAenKbBIAAAAASUVORK5CYII=',
            'base64'
        );

        const fileChooserPromise = page.waitForEvent('filechooser');
        await filmTrackerPage.addFromGalleryButton.click();
        const fileChooser = await fileChooserPromise;

        await fileChooser.setFiles({
            name: 'large-test-image.png',
            mimeType: 'image/png',
            buffer: largeImageBuffer
        });

        // Should successfully create exposure even with larger image
        await expect(filmTrackerPage.page.getByText(/#1/)).toBeVisible({ timeout: 5000 });
    });
});
