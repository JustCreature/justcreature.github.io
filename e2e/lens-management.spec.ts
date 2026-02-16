import { test, expect } from './fixtures/test-fixtures';
import { TEST_DATA, generateTestData } from './utils/test-data';

/**
 * Lens Management Tests
 * Tests creation, validation, and display of lenses
 */
test.describe('Lens Management', () => {
    test('should create a prime lens successfully', async ({ filmTrackerPage, cleanApp }) => {
        await filmTrackerPage.lensesTab.click();

        const lensData = TEST_DATA.lenses.primeFast;
        await filmTrackerPage.createLens(lensData);

        // Verify lens appears in list
        await expect(filmTrackerPage.page.getByText(lensData.name)).toBeVisible();
    });

    test('should create a zoom lens successfully', async ({ filmTrackerPage, cleanApp }) => {
        await filmTrackerPage.lensesTab.click();

        const lensData = TEST_DATA.lenses.zoomStandard;
        await filmTrackerPage.createLens(lensData);

        // Verify lens appears in list
        await expect(filmTrackerPage.page.getByText(lensData.name)).toBeVisible();
    });

    test('should create lens with generated data', async ({ filmTrackerPage, cleanApp }) => {
        await filmTrackerPage.lensesTab.click();

        const randomLens = generateTestData.lens();
        await filmTrackerPage.createLens(randomLens);

        // Verify lens appears in list
        await expect(filmTrackerPage.page.getByText(randomLens.name)).toBeVisible();
    });

    test('should show empty state when no lenses exist', async ({ filmTrackerPage, cleanApp }) => {
        await filmTrackerPage.lensesTab.click();

        await expect(filmTrackerPage.page.getByText(/no lenses added/i)).toBeVisible();
        await expect(filmTrackerPage.addLensButton).toBeVisible();
    });

    test('should navigate to lenses tab and back', async ({ filmTrackerPage, cleanApp }) => {
        // Start on Film Rolls tab
        await expect(filmTrackerPage.filmRollsTab).toHaveAttribute('aria-selected', 'true');

        // Navigate to Lenses tab
        await filmTrackerPage.lensesTab.click();
        await expect(filmTrackerPage.lensesTab).toHaveAttribute('aria-selected', 'true');

        // Navigate to Cameras tab
        await filmTrackerPage.camerasTab.click();
        await expect(filmTrackerPage.camerasTab).toHaveAttribute('aria-selected', 'true');

        // Navigate back to Lenses tab
        await filmTrackerPage.lensesTab.click();
        await expect(filmTrackerPage.lensesTab).toHaveAttribute('aria-selected', 'true');
    });
});
