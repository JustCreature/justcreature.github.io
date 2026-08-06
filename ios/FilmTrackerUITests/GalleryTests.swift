import XCTest

final class GalleryTests: XCTestCase {
    let app = XCUIApplication()
    let testRollName = "Gallery Test Roll \(UUID().uuidString.prefix(4))"

    override func setUpWithError() throws {
        continueAfterFailure = false
        app.launch()
        
        // Ensure we are in a clean state or handle existing rolls
        // Create a roll for testing
        app.buttons["addRollFAB"].tap()
        
        let newRollButton = app.buttons["New roll"]
        XCTAssertTrue(newRollButton.waitForExistence(timeout: 5))
        newRollButton.tap()
        
        let nameField = app.textFields["rollNameInput"]
        XCTAssertTrue(nameField.waitForExistence(timeout: 5))
        nameField.tap()
        nameField.typeText(testRollName)
        
        app.buttons["confirmRollFormButton"].tap()
        
        // Capture one photo to have something in gallery
        let shutter = app.buttons.matching(identifier: "shutterButton").firstMatch
        XCTAssertTrue(shutter.waitForExistence(timeout: 5))
        shutter.tap()
        
        // Wait for capture flash/processing
        sleep(1)
    }

    func testNavigateToGalleryAndToggleViews() throws {
        // From Capture, tap Gallery button
        let galleryButton = app.buttons["galleryButton"]
        XCTAssertTrue(galleryButton.exists)
        galleryButton.tap()
        
        // Verify we are in Gallery
        XCTAssertTrue(app.staticTexts["CONTACT SHEET"].waitForExistence(timeout: 5))
        
        // Toggle to Grid
        let gridToggle = app.buttons.matching(identifier: "square.grid.3x3.fill").firstMatch
        XCTAssertTrue(gridToggle.exists)
        gridToggle.tap()
        
        // Toggle back to Strip
        let stripToggle = app.buttons.matching(identifier: "rectangle.grid.1x2.fill").firstMatch
        XCTAssertTrue(stripToggle.exists)
        stripToggle.tap()
    }

    func testTapExposureToDetails() throws {
        // Navigate to Gallery
        app.buttons["galleryButton"].tap()
        
        // Tap the first exposure card (it has exposure number "1")
        let firstExposure = app.buttons.matching(identifier: "1").firstMatch
        // Wait, I might need to check how I set accessibility identifiers for cards.
        // In ExposureStripCard, I didn't set an explicit identifier on the NavigationLink.
        // But the text "1" should be findable.
        
        let exposureOne = app.staticTexts["1"].firstMatch
        XCTAssertTrue(exposureOne.waitForExistence(timeout: 5))
        exposureOne.tap()
        
        // Verify Details View
        XCTAssertTrue(app.staticTexts["NOTES"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["APERTURE"].exists)
    }
}
