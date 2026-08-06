import XCTest

final class EquipmentManagementTests: XCTestCase {
    let app = XCUIApplication()

    override func setUpWithError() throws {
        continueAfterFailure = false
        app.launch()
        
        // Navigate to Equipment tab
        app.tabBars.buttons["Equipment"].tap()
    }

    func testCreateCamera() throws {
        // Tap FAB
        app.buttons["addEquipmentFAB"].tap()
        
        // Fill form
        let makeField = app.textFields["cameraMakeInput"]
        let modelField = app.textFields["cameraModelInput"]
        
        XCTAssertTrue(makeField.waitForExistence(timeout: 5))
        
        makeField.tap()
        makeField.typeText("Nikon")
        
        modelField.tap()
        modelField.typeText("D750")
        
        // Confirm
        app.buttons["confirmCameraFormButton"].tap()
        
        // Verify in list
        let cameraTitle = app.staticTexts["Nikon D750"]
        XCTAssertTrue(cameraTitle.waitForExistence(timeout: 5))
    }

    func testEditCamera() throws {
        // First create a camera
        try testCreateCamera()
        
        // Tap ellipsis (more menu)
        let moreButton = app.buttons.matching(identifier: "entityRowMoreButton").firstMatch
        XCTAssertTrue(moreButton.waitForExistence(timeout: 5))
        moreButton.tap()
        
        // Tap Edit
        app.buttons["Edit"].tap()
        
        // Change model
        let modelField = app.textFields["cameraModelInput"]
        modelField.tap()
        modelField.typeText(" FE2") // Append
        
        // Save
        app.buttons["confirmCameraFormButton"].tap()
        
        // Verify updated title
        let updatedTitle = app.staticTexts["Nikon D750 FE2"]
        XCTAssertTrue(updatedTitle.waitForExistence(timeout: 5))
    }

    func testCreatePrimeLens() throws {
        // Switch to Lenses tab
        app.buttons["segmentButton_1"].tap()
        
        // Tap FAB
        app.buttons["addEquipmentFAB"].tap()
        
        // Fill form
        let nameField = app.textFields["lensNameInput"]
        XCTAssertTrue(nameField.waitForExistence(timeout: 5))
        
        nameField.tap()
        nameField.typeText("Summicron 50mm")
        app.keyboards.buttons["Return"].tap()
        
        // Aperture is f/2 by default
        
        // Type is Prime by default
        
        let focalField = app.textFields["lensFocalInput"]
        focalField.tap()
        focalField.typeText("50")
        
        // Confirm
        app.buttons["confirmLensFormButton"].tap()
        
        // Verify in list
        let lensTitle = app.staticTexts["Summicron 50mm"]
        XCTAssertTrue(lensTitle.waitForExistence(timeout: 5))
    }

    func testCreateZoomLens() throws {
        // Switch to Lenses tab
        app.buttons["segmentButton_1"].tap()
        
        // Tap FAB
        app.buttons["addEquipmentFAB"].tap()
        
        // Fill form
        let nameField = app.textFields["lensNameInput"]
        XCTAssertTrue(nameField.waitForExistence(timeout: 5))
        
        nameField.tap()
        nameField.typeText("Nikkor 24-70mm")
        app.keyboards.buttons["Return"].tap()
        
        // Switch to Zoom
        app.buttons["lensTypeZoom"].tap()
        
        let minFocalField = app.textFields["lensFocalMinInput"]
        minFocalField.tap()
        minFocalField.typeText("24")
        
        let maxFocalField = app.textFields["lensFocalMaxInput"]
        maxFocalField.tap()
        maxFocalField.typeText("70")
        
        // Confirm
        app.buttons["confirmLensFormButton"].tap()
        
        // Verify in list
        let lensTitle = app.staticTexts["Nikkor 24-70mm"]
        XCTAssertTrue(lensTitle.waitForExistence(timeout: 5))
    }
}
