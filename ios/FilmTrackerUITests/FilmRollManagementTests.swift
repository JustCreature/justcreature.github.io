import XCTest

final class FilmRollManagementTests: XCTestCase {
    let app = XCUIApplication()

    override func setUpWithError() throws {
        continueAfterFailure = false
        app.launch()
        
        // Ensure we are on Rolls tab
        app.tabBars.buttons["Rolls"].tap()
    }

    @discardableResult
    func createFilmRoll(suffix: String) throws -> String {
        // Tap FAB
        let fab = app.buttons["addRollFAB"]
        XCTAssertTrue(fab.waitForExistence(timeout: 5))
        fab.tap()
        
        // Tap New roll in menu
        let newRollButton = app.buttons["fabNewRoll"]
        XCTAssertTrue(newRollButton.waitForExistence(timeout: 5))
        newRollButton.tap()
        
        // Select preset
        let portraPreset = app.buttons["preset_Kodak_Portra_400"]
        XCTAssertTrue(portraPreset.waitForExistence(timeout: 5))
        portraPreset.tap()
        
        // Append suffix
        let nameField = app.textFields["rollNameInput"]
        nameField.tap()
        nameField.typeText(" \(suffix)")
        
        let finalName = "Kodak Portra 400 \(suffix)"
        
        // Confirm
        app.buttons["confirmRollFormButton"].tap()
        
        // Verify we are in CaptureView or see the roll title (frame counter has it)
        let rollTitle = app.staticTexts[finalName]
        XCTAssertTrue(rollTitle.waitForExistence(timeout: 10))
        
        // Navigate back to Rolls list
        let backButton = app.buttons["chevron.left"]
        if backButton.exists {
            backButton.tap()
        }
        
        // Verify in list
        XCTAssertTrue(app.staticTexts[finalName].waitForExistence(timeout: 5))
        
        return finalName
    }

    func testCreateFilmRoll() throws {
        try createFilmRoll(suffix: "Create-\(UUID().uuidString.prefix(4))")
    }

    func testFilterRolls() throws {
        let name = try createFilmRoll(suffix: "Filter-\(UUID().uuidString.prefix(4))")
        
        // Tap Complete
        app.buttons["filter_complete"].tap()
        
        // Verify empty state (unless we have complete rolls from before, but this roll is active)
        // If we have complete rolls from before, "No rolls found" won't be there.
        // So we just check that our new roll is NOT there.
        XCTAssertFalse(app.staticTexts[name].exists)
    }

    func testEditFilmRoll() throws {
        let name = try createFilmRoll(suffix: "Edit-\(UUID().uuidString.prefix(4))")
        
        // Tap more menu for THIS specific roll if possible, or just first match
        let moreButton = app.buttons.matching(identifier: "rollCardMoreMenu").firstMatch
        XCTAssertTrue(moreButton.waitForExistence(timeout: 5))
        moreButton.tap()
        
        // Tap Edit
        let editMenuButton = app.buttons.matching(identifier: "rollCardEditButton").firstMatch
        XCTAssertTrue(editMenuButton.waitForExistence(timeout: 5))
        editMenuButton.tap()
        
        // Change name
        let nameField = app.textFields["rollNameInput"]
        nameField.tap()
        nameField.typeText(" Updated")
        
        let updatedName = "\(name) Updated"
        
        // Save
        app.buttons["confirmRollFormButton"].tap()
        
        // Verify updated title
        let updatedTitle = app.staticTexts[updatedName]
        XCTAssertTrue(updatedTitle.waitForExistence(timeout: 5))
    }

    func testDeleteFilmRoll() throws {
        let suffix = "Del-\(UUID().uuidString.prefix(4))"
        let name = try createFilmRoll(suffix: suffix)
        
        // Tap more menu
        let moreButton = app.buttons.matching(identifier: "rollCardMoreMenu").firstMatch
        XCTAssertTrue(moreButton.waitForExistence(timeout: 5))
        moreButton.tap()
        
        // Tap Delete
        let deleteMenuButton = app.buttons.matching(identifier: "rollCardDeleteButton").firstMatch
        XCTAssertTrue(deleteMenuButton.waitForExistence(timeout: 5))
        deleteMenuButton.tap()
        
        // Wait for sheet
        let confirmButton = app.buttons["confirmationConfirmButton"]
        XCTAssertTrue(confirmButton.waitForExistence(timeout: 10))
        confirmButton.tap()
        
        // Verify removed
        let rollTitle = app.staticTexts[name]
        let doesNotExistPredicate = NSPredicate(format: "exists == false")
        expectation(for: doesNotExistPredicate, evaluatedWith: rollTitle, handler: nil)
        waitForExpectations(timeout: 10, handler: nil)
    }
}
