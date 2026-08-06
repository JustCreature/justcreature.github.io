import XCTest

final class CaptureWorkflowTests: XCTestCase {
    let app = XCUIApplication()
    let rollName = "Capture Test Roll \(UUID().uuidString.prefix(4))"
    
    override func setUpWithError() throws {
        continueAfterFailure = false
        app.launch()
        
        // Add a camera and lens first for full testing
        addCamera(name: "Test Camera")
        addLens(name: "Test Lens")
        
        // Create a roll
        createRoll(name: rollName)
    }
    
    func testCaptureScreenLoads() {
        // Verify capture screen elements
        XCTAssertTrue(app.buttons["grid"].exists)
        XCTAssertTrue(app.buttons["viewfinder"].exists)
        XCTAssertTrue(app.staticTexts[rollName].exists)
        XCTAssertTrue(app.buttons["note.text"].exists)
        XCTAssertTrue(app.buttons["photo.on.rectangle"].exists) // last shot peek
    }
    
    func testPickerInteractions() {
        // Tap Aperture chip
        app.buttons["APER"].tap()
        
        // Verify radial picker appears
        XCTAssertTrue(app.staticTexts["SWIPE TO ROTATE"].exists)
        
        // Dismiss picker
        let dismissButton = app.buttons["dismissPickerButton"]
        XCTAssertTrue(dismissButton.waitForExistence(timeout: 5))
        dismissButton.tap()
        
        // Verify picker closed
        XCTAssertFalse(app.staticTexts["SWIPE TO ROTATE"].exists)
    }
    
    func testNoteSheet() {
        app.buttons["note.text"].tap()
        
        let noteEditor = app.textViews.firstMatch
        XCTAssertTrue(noteEditor.exists)
        
        noteEditor.tap()
        noteEditor.typeText("Test Note")
        
        app.buttons["Save Note"].tap()
        
        // Verify note icon is present
        XCTAssertTrue(app.buttons["note.text"].exists)
    }
    
    // Helper methods
    private func addCamera(name: String) {
        app.tabBars.buttons["Equipment"].tap()
        app.buttons["addEquipmentButton"].tap()
        let makeField = app.textFields["cameraMakeInput"]
        makeField.tap()
        makeField.typeText(name)
        let modelField = app.textFields["cameraModelInput"]
        modelField.tap()
        modelField.typeText("TestModel")
        app.buttons["confirmCameraFormButton"].tap()
    }
    
    private func addLens(name: String) {
        app.tabBars.buttons["Equipment"].tap()
        app.buttons["segmentButton_1"].tap() // Lenses
        app.buttons["addEquipmentButton"].tap()
        let nameField = app.textFields["lensNameInput"]
        nameField.tap()
        nameField.typeText(name)
        let focalField = app.textFields["lensFocalInput"]
        focalField.tap()
        focalField.typeText("50")
        app.buttons["confirmLensFormButton"].tap()
    }
    
    private func createRoll(name: String) {
        app.tabBars.buttons["Rolls"].tap()
        app.buttons["addRollFAB"].tap()
        app.buttons["New roll"].tap()
        let nameField = app.textFields["rollNameInput"]
        nameField.tap()
        nameField.typeText(name)
        app.buttons["confirmRollFormButton"].tap()
    }
}
