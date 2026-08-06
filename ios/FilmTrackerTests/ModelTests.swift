import XCTest
import SwiftData
@testable import FilmTracker

final class ModelTests: XCTestCase {
    var container: ModelContainer!
    var context: ModelContext!

    override func setUp() {
        super.setUp()
        let schema = Schema([
            Camera.self,
            Lens.self,
            FilmRoll.self,
            Exposure.self,
            AppSettings.self
        ])
        let config = ModelConfiguration(isStoredInMemoryOnly: true)
        container = try! ModelContainer(for: schema, configurations: [config])
        context = ModelContext(container)
    }

    func testCameraCRUD() {
        let camera = Camera(make: "Nikon", model: "FE")
        context.insert(camera)
        
        let cameras = try! context.fetch(FetchDescriptor<Camera>())
        XCTAssertEqual(cameras.count, 1)
        XCTAssertEqual(cameras.first?.name, "Nikon FE")
        
        camera.model = "FE2"
        camera.name = "Nikon FE2"
        XCTAssertEqual(cameras.first?.name, "Nikon FE2")
        
        context.delete(camera)
        let camerasAfterDelete = try! context.fetch(FetchDescriptor<Camera>())
        XCTAssertEqual(camerasAfterDelete.count, 0)
    }

    func testLensCRUD() {
        let lens = Lens(name: "Nikkor 50mm", maxAperture: "f/1.4", focalLength: 50)
        context.insert(lens)
        
        let lenses = try! context.fetch(FetchDescriptor<Lens>())
        XCTAssertEqual(lenses.count, 1)
        XCTAssertEqual(lenses.first?.isZoom, false)
        
        let zoom = Lens(name: "Nikkor 80-200mm", maxAperture: "f/4.5", focalLengthMin: 80, focalLengthMax: 200)
        context.insert(zoom)
        XCTAssertEqual(try! context.fetch(FetchDescriptor<Lens>()).count, 2)
        XCTAssertEqual(zoom.isZoom, true)
    }
}
