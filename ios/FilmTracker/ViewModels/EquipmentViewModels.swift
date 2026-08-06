import SwiftUI
import SwiftData
import Observation

@Observable
final class CameraViewModel {
    var modelContext: ModelContext
    
    init(modelContext: ModelContext) {
        self.modelContext = modelContext
    }
    
    func addCamera(make: String, model: String) {
        let camera = Camera(make: make, model: model)
        modelContext.insert(camera)
    }
    
    func deleteCamera(_ camera: Camera) {
        modelContext.delete(camera)
    }
}

@Observable
final class LensViewModel {
    var modelContext: ModelContext
    
    init(modelContext: ModelContext) {
        self.modelContext = modelContext
    }
    
    func addLens(name: String, maxAperture: String, focalLength: Int? = nil, focalLengthMin: Int? = nil, focalLengthMax: Int? = nil) {
        let lens = Lens(name: name, maxAperture: maxAperture, focalLength: focalLength, focalLengthMin: focalLengthMin, focalLengthMax: focalLengthMax)
        modelContext.insert(lens)
    }
    
    func deleteLens(_ lens: Lens) {
        modelContext.delete(lens)
    }
}
