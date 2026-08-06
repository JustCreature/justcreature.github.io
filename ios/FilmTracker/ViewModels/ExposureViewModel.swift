import SwiftUI
import SwiftData

@Observable
final class ExposureViewModel {
    var exposure: Exposure
    var modelContext: ModelContext
    
    var isEditing = false
    
    // Editable fields
    var aperture: String
    var shutterSpeed: String
    var ei: Int
    var focalLength: Int?
    var additionalInfo: String
    var lensId: String?
    
    var roll: FilmRoll?
    var camera: Camera?
    var lens: Lens?
    
    init(exposure: Exposure, modelContext: ModelContext) {
        self.exposure = exposure
        self.modelContext = modelContext
        
        self.aperture = exposure.aperture
        self.shutterSpeed = exposure.shutterSpeed
        self.ei = exposure.ei ?? 400
        self.focalLength = exposure.focalLength
        self.additionalInfo = exposure.additionalInfo ?? ""
        self.lensId = exposure.lensId
        
        fetchDetails()
    }
    
    private func fetchDetails() {
        // Fetch Roll
        let rollId = exposure.filmRollId
        let rollDescriptor = FetchDescriptor<FilmRoll>(predicate: #Predicate<FilmRoll> { $0.id == rollId })
        self.roll = try? modelContext.fetch(rollDescriptor).first
        
        // Fetch Camera from Roll
        if let cameraId = roll?.cameraId {
            let camDescriptor = FetchDescriptor<Camera>(predicate: #Predicate<Camera> { $0.id == cameraId })
            self.camera = try? modelContext.fetch(camDescriptor).first
        }
        
        // Fetch Lens
        if let lId = exposure.lensId {
            let lensDescriptor = FetchDescriptor<Lens>(predicate: #Predicate<Lens> { $0.id == lId })
            self.lens = try? modelContext.fetch(lensDescriptor).first
        }
    }
    
    func save() {
        exposure.aperture = aperture
        exposure.shutterSpeed = shutterSpeed
        exposure.ei = ei
        exposure.focalLength = focalLength
        exposure.additionalInfo = additionalInfo
        exposure.lensId = lensId
        
        try? modelContext.save()
        isEditing = false
    }
    
    func cancel() {
        aperture = exposure.aperture
        shutterSpeed = exposure.shutterSpeed
        ei = exposure.ei ?? 400
        focalLength = exposure.focalLength
        additionalInfo = exposure.additionalInfo ?? ""
        lensId = exposure.lensId
        isEditing = false
    }
    
    func delete() {
        modelContext.delete(exposure)
    }
    
    func updateImage(_ data: Data) {
        guard let downscaledData = ImageUtils.downscale(data) else { return }
        exposure.imageData = downscaledData
        try? modelContext.save()
    }
    
    var cameraName: String {
        camera?.name ?? "No camera"
    }
    
    var lensName: String {
        lens?.name ?? "No lens"
    }
    
    var rollName: String {
        roll?.name ?? "Unknown Roll"
    }
}
