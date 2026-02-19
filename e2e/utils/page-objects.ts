import { Page } from '@playwright/test';

/**
 * Page Object Model for Film Photography Tracker
 * Provides reusable methods for interacting with the application
 */
export class FilmTrackerPage {
  constructor(public page: Page) { }

  // Navigation
  async goto() {
    await this.page.goto('/');
  }

  async waitForLoadState() {
    await this.page.waitForLoadState('domcontentloaded');
    // Wait for React app to mount by checking for main content
    await this.page.waitForSelector('[class*="MuiContainer-root"], #root > div', { timeout: 15000 });
  }

  // Main Screen Elements
  get filmRollsTab() {
    return this.page.getByRole('tab', { name: /film rolls/i });
  }

  get camerasTab() {
    return this.page.getByRole('tab', { name: /cameras/i });
  }

  get lensesTab() {
    return this.page.getByRole('tab', { name: /lenses/i });
  }

  get createFilmRollButton() {
    return this.page.getByRole('button', { name: /create film roll/i });
  }

  get addCameraButton() {
    return this.page.getByRole('button', { name: 'Add Camera', exact: true });
  }

  get addLensButton() {
    return this.page.locator('button[aria-label="add lens"]');
  }

  get settingsButton() {
    return this.page.getByRole('button', { name: /settings/i });
  }

  // Film Roll Creation
  get filmNameInput() {
    return this.page.getByLabel(/film name/i);
  }

  get isoInput() {
    return this.page.getByLabel(/iso/i);
  }

  get exposuresInput() {
    return this.page.getByLabel(/number of exposures/i);
  }

  get cameraSelect() {
    return this.page.getByLabel(/camera.*optional/i);
  }

  get startFilmRollButton() {
    return this.page.getByRole('button', { name: /start film roll/i });
  }

  get updateFilmRollButton() {
    return this.page.getByRole('button', { name: /update film roll/i });
  }

  // Camera Management
  get cameraMakeInput() {
    return this.page.getByLabel(/camera make/i);
  }

  get cameraModelInput() {
    return this.page.getByLabel(/camera model/i);
  }

  get lensInput() {
    return this.page.getByLabel(/lens/i);
  }

  // Lens Management
  get lensNameInput() {
    return this.page.getByLabel(/lens name/i);
  }

  get maxApertureSelect() {
    return this.page.getByLabel(/maximum aperture/i);
  }

  get focalLengthInput() {
    return this.page.getByLabel(/^focal length \(mm\)$/i);
  }

  get minFocalLengthInput() {
    return this.page.getByLabel(/^min focal length \(mm\)$/i);
  }

  get maxFocalLengthInput() {
    return this.page.getByLabel(/^max focal length \(mm\)$/i);
  }

  get addLensSubmitButton() {
    return this.page.getByRole('button', { name: /add.*lens/i }).first();
  }

  get addCameraSubmitButton() {
    return this.page.getByRole('button', { name: /add.*camera/i });
  }

  get updateCameraSubmitButton() {
    return this.page.getByRole('button', { name: /update.*camera/i });
  }

  // Camera Screen Elements
  get cameraButton() {
    return this.page.getByRole('button', { name: /camera/i }).first();
  }

  get galleryButton() {
    return this.page.getByRole('button', { name: /gallery/i });
  }

  get apertureChip() {
    return this.page.locator('.MuiChip-root').filter({ hasText: /f\// }).first();
  }

  get shutterSpeedChip() {
    return this.page.locator('.MuiChip-root').filter({ hasText: /1\// }).first();
  }

  get notesChip() {
    return this.page.locator('.MuiChip-root').filter({ hasText: /info/i }).first();
  }

  get backButton() {
    return this.page.getByRole('button', { name: /back/i });
  }

  // Settings Dialog
  get settingsDialog() {
    return this.page.getByRole('dialog');
  }

  get apertureSelect() {
    return this.settingsDialog.locator('div[role="combobox"]').first();
  }

  get shutterSpeedSelect() {
    return this.settingsDialog.locator('div[role="combobox"]').nth(1);
  }

  get additionalInfoInput() {
    return this.settingsDialog.getByLabel(/additional info/i);
  }

  get closeSettingsButton() {
    return this.settingsDialog.getByRole('button', { name: /close|cancel|done/i });
  }

  // Helper Methods
  async createFilmRoll(data: {
    name: string;
    iso?: string;
    exposures?: string;
    camera?: string;
  }) {
    await this.createFilmRollButton.click();
    await this.filmNameInput.fill(data.name);

    if (data.iso) {
      await this.isoInput.fill(data.iso);
    }

    if (data.exposures) {
      await this.exposuresInput.fill(data.exposures);
    }

    if (data.camera) {
      await this.cameraSelect.click();
      await this.page.getByText(data.camera).click();
    }

    await this.startFilmRollButton.click();
  }

  async createCamera(data: {
    make: string;
    model: string;
  }) {
    await this.addCameraButton.click();
    await this.cameraMakeInput.fill(data.make);
    await this.cameraModelInput.fill(data.model);
    await this.addCameraSubmitButton.click();
  }

  async createLens(data: {
    name: string;
    maxAperture: string;
    focalLength?: string;
    minFocalLength?: string;
    maxFocalLength?: string;
  }) {
    await this.addLensButton.click();
    await this.lensNameInput.fill(data.name);

    await this.maxApertureSelect.click();
    await this.page.getByRole('option', { name: data.maxAperture, exact: true }).click();

    if (data.focalLength) {
      await this.focalLengthInput.fill(data.focalLength);
    } else if (data.minFocalLength && data.maxFocalLength) {
      await this.minFocalLengthInput.fill(data.minFocalLength);
      await this.maxFocalLengthInput.fill(data.maxFocalLength);
    }

    await this.addLensSubmitButton.click();
  }

  async configureCameraSettings(data: {
    lens?: string;
    aperture?: string;
    shutterSpeed?: string;
    notes?: string;
  }) {
    // Open settings if not already open
    await this.apertureChip.click();

    // Wait for dialog to be fully loaded
    await this.settingsDialog.waitFor({ state: 'visible' });

    // Wait a bit for dialog content to stabilize and for all selects to render
    await this.page.waitForTimeout(1000);

    // Configure lens first (if provided) as it affects aperture options
    if (data.lens) {
      const lensSelect = this.page.getByLabel(/^lens$/i);
      await lensSelect.waitFor({ state: 'visible' });
      await lensSelect.click();

      await this.page.getByRole('option', { name: new RegExp(data.lens, 'i') }).waitFor({ state: 'visible' });
      await this.page.getByRole('option', { name: new RegExp(data.lens, 'i') }).click();

      // Wait for lens selection to update aperture options
      await this.page.waitForTimeout(300);
    }

    // Configure aperture - use label-based selector
    if (data.aperture) {
      // Try to find aperture select - it might be the 2nd or 3rd select depending on lens presence
      const apertureSelect = this.settingsDialog.getByLabel(/aperture/i);
      await apertureSelect.waitFor({ state: 'visible', timeout: 10000 });
      await apertureSelect.click();

      await this.page.getByRole('option', { name: data.aperture }).waitFor({ state: 'visible' });
      await this.page.getByRole('option', { name: data.aperture }).click();
    }

    // Configure shutter speed - use label-based selector
    if (data.shutterSpeed) {
      const shutterSpeedSelect = this.page.getByLabel(/shutter speed/i);
      await shutterSpeedSelect.waitFor({ state: 'visible' });
      await shutterSpeedSelect.click();

      await this.page.getByRole('option', { name: data.shutterSpeed }).waitFor({ state: 'visible' });
      await this.page.getByRole('option', { name: data.shutterSpeed }).click();
    }

    // Configure notes
    if (data.notes) {
      await this.additionalInfoInput.fill(data.notes);
    }

    // Close settings
    await this.closeSettingsButton.click();
  }

  async getFilmRollCards() {
    return this.page.locator('[data-testid="film-roll-card"], .MuiCard-root').filter({
      has: this.page.locator('text=/film|roll|iso/i')
    });
  }

  async getCameraCards() {
    return this.page.locator('[data-testid="camera-card"], .MuiCard-root').filter({
      has: this.page.locator('text=/camera|make|model/i')
    });
  }

  async clearLocalStorage() {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  async mockGeolocation() {
    await this.page.context().grantPermissions(['geolocation']);
    await this.page.context().setGeolocation({ latitude: 37.7749, longitude: -122.4194 });
  }

  // Import/Export Elements
  get importButton() {
    return this.page.getByRole('button', { name: /import/i });
  }

  get exportButton() {
    return this.page.getByRole('button', { name: /export/i });
  }

  get importDialog() {
    return this.page.getByRole('dialog').filter({ has: this.page.getByText(/import.*data/i) });
  }

  get exportDialog() {
    return this.page.getByRole('dialog').filter({ has: this.page.getByText(/export.*data/i) });
  }

  get importMethodLocal() {
    return this.page.getByRole('radio', { name: /local files/i });
  }

  get importMethodJsonWithImages() {
    return this.page.getByRole('radio', { name: /import json with images/i });
  }

  get importMethodGoogleDrive() {
    return this.page.getByRole('radio', { name: /google drive/i });
  }

  get importSubmitButton() {
    return this.page.getByRole('button', { name: /^import$/i });
  }

  get exportSubmitButton() {
    return this.page.getByRole('button', { name: /^export/i });
  }

  /**
   * Import a JSON file with images
   * @param jsonContent The JSON content to import
   */
  async importJsonWithImages(jsonContent: object) {
    // Click import button
    await this.importButton.click();

    // Wait for dialog to be visible
    await this.importDialog.waitFor({ state: 'visible' });

    // Select JSON with Images method
    await this.importMethodJsonWithImages.click();

    // Click import button to trigger file picker
    const fileChooserPromise = this.page.waitForEvent('filechooser');
    await this.importSubmitButton.click();
    const fileChooser = await fileChooserPromise;

    // Create a mock file with the JSON content
    const buffer = Buffer.from(JSON.stringify(jsonContent, null, 2));
    await fileChooser.setFiles([{
      name: 'test_import.json',
      mimeType: 'application/json',
      buffer
    }]);

    // Wait for import to complete (dialog should close)
    await this.importDialog.waitFor({ state: 'hidden', timeout: 10000 });
  }
}