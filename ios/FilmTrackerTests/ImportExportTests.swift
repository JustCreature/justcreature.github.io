import XCTest
import SwiftData
@testable import FilmTracker

@MainActor
final class ImportExportTests: XCTestCase {
    var modelContainer: ModelContainer!
    var modelContext: ModelContext!
    
    override func setUpWithError() throws {
        let schema = Schema([Camera.self, Lens.self, FilmRoll.self, Exposure.self, AppSettings.self])
        let modelConfiguration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: true)
        modelContainer = try ModelContainer(for: schema, configurations: [modelConfiguration])
        modelContext = modelContainer.mainContext
    }
    
    func testExportImportRoundTrip() async throws {
        // 1. Create seed data
        let roll = FilmRoll(name: "Test Roll", iso: 400, totalExposures: 36)
        modelContext.insert(roll)
        
        let exposure = Exposure(
            filmRollId: roll.id,
            exposureNumber: 1,
            aperture: "f/8",
            shutterSpeed: "1/250",
            imageData: UIImage(systemName: "camera")?.pngData() // Dummy image
        )
        modelContext.insert(exposure)
        try modelContext.save()
        
        // 2. Export
        let exportURL = try await ExportService.shared.exportRoll(roll, exposures: [exposure], format: .jsonWithImages)
        XCTAssertTrue(FileManager.default.fileExists(atPath: exportURL.path))
        
        // 3. Import into a new context (to simulate fresh import)
        let importSchema = Schema([Camera.self, Lens.self, FilmRoll.self, Exposure.self, AppSettings.self])
        let importConfig = ModelConfiguration(schema: importSchema, isStoredInMemoryOnly: true)
        let importContainer = try ModelContainer(for: importSchema, configurations: [importConfig])
        let importContext = importContainer.mainContext
        
        try await ImportService.shared.importFromJSON(url: exportURL, modelContext: importContext)
        
        // 4. Verify
        let fetchRolls = FetchDescriptor<FilmRoll>()
        let importedRolls = try importContext.fetch(fetchRolls)
        
        XCTAssertEqual(importedRolls.count, 1)
        XCTAssertTrue(importedRolls[0].name.contains("Test Roll"))
        XCTAssertTrue(importedRolls[0].name.contains("[IMPORTED]"))
        
        let fetchExposures = FetchDescriptor<Exposure>()
        let importedExposures = try importContext.fetch(fetchExposures)
        
        XCTAssertEqual(importedExposures.count, 1)
        XCTAssertEqual(importedExposures[0].aperture, "f/8")
        XCTAssertEqual(importedExposures[0].shutterSpeed, "1/250")
        XCTAssertNotNil(importedExposures[0].imageData)
        
        // Cleanup
        try? FileManager.default.removeItem(at: exportURL)
    }
}
