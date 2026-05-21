import XCTest

final class RefinementTests: XCTestCase {
    let app = XCUIApplication()

    override func setUpWithError() throws {
        continueAfterFailure = false
        // Reset app data if possible or ensure it's a clean state
        // For UI tests, we usually rely on the app's initial state
        app.launch()
    }

    func testSettingsButtonVisibility() throws {
        // In Rolls tab
        let rollsSettingsButton = app.navigationBars["Rolls"].buttons["gearshape"]
        XCTAssertTrue(rollsSettingsButton.waitForExistence(timeout: 5))
        rollsSettingsButton.tap()
        
        // Verify Settings screen
        XCTAssertTrue(app.staticTexts["SETTINGS"].waitForExistence(timeout: 5))
        app.buttons["chevron.left"].tap()
        
        // Go to Equipment tab
        app.tabBars.buttons["Equipment"].tap()
        
        // In Equipment tab
        let equipSettingsButton = app.navigationBars["Equipment"].buttons["gearshape"]
        XCTAssertTrue(equipSettingsButton.waitForExistence(timeout: 5))
        equipSettingsButton.tap()
        
        // Verify Settings screen
        XCTAssertTrue(app.staticTexts["SETTINGS"].waitForExistence(timeout: 5))
    }

    func testEmptyStateButtons() throws {
        // Go to Equipment tab
        app.tabBars.buttons["Equipment"].tap()
        
        // 1. Add Camera button in empty state (assuming no cameras)
        let addCameraButton = app.buttons["Add Camera"]
        if addCameraButton.waitForExistence(timeout: 2) {
            addCameraButton.tap()
            XCTAssertTrue(app.staticTexts["New camera"].waitForExistence(timeout: 5))
            app.buttons["Cancel"].tap()
        }
        
        // 2. Add Lens button in empty state
        app.buttons["segmentButton_1"].tap() // Switch to Lenses
        let addLensButton = app.buttons["Add Lens"]
        if addLensButton.waitForExistence(timeout: 2) {
            addLensButton.tap()
            XCTAssertTrue(app.staticTexts["New lens"].waitForExistence(timeout: 5))
            app.buttons["Cancel"].tap()
        }
    }
}
