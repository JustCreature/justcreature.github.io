import SwiftUI
import SwiftData
import PhotosUI

@Observable
final class GalleryViewModel {
    var roll: FilmRoll
    var modelContext: ModelContext
    
    var exposures: [Exposure] = []
    var isGridView = false
    var selectedPhotosPickerItems: [PhotosPickerItem] = [] {
        didSet {
            if !selectedPhotosPickerItems.isEmpty {
                importPhotos()
            }
        }
    }
    
    init(roll: FilmRoll, modelContext: ModelContext) {
        self.roll = roll
        self.modelContext = modelContext
        fetchExposures()
    }
    
    func fetchExposures() {
        let rollId = roll.id
        let descriptor = FetchDescriptor<Exposure>(
            predicate: #Predicate<Exposure> { $0.filmRollId == rollId },
            sortBy: [SortDescriptor(\.exposureNumber)]
        )
        
        do {
            exposures = try modelContext.fetch(descriptor)
        } catch {
            print("Failed to fetch exposures: \(error)")
        }
    }
    
    func deleteExposure(_ exposure: Exposure) {
        modelContext.delete(exposure)
        fetchExposures()
    }
    
    func copyPrevious(to exposure: Exposure) {
        guard let index = exposures.firstIndex(where: { $0.id == exposure.id }), index > 0 else { return }
        let previous = exposures[index - 1]
        
        exposure.aperture = previous.aperture
        exposure.shutterSpeed = previous.shutterSpeed
        exposure.ei = previous.ei
        exposure.lensId = previous.lensId
        exposure.focalLength = previous.focalLength
        
        try? modelContext.save()
        fetchExposures()
    }
    
    private func importPhotos() {
        let items = selectedPhotosPickerItems
        selectedPhotosPickerItems = []
        
        Task {
            for item in items {
                if let data = try? await item.loadTransferable(type: Data.self) {
                    await MainActor.run {
                        addExposureFromData(data)
                    }
                }
            }
        }
    }
    
    private func addExposureFromData(_ data: Data) {
        guard let downscaledData = ImageUtils.downscale(data) else { return }
        
        let nextNumber = (exposures.last?.exposureNumber ?? 0) + 1
        
        let newExposure = Exposure(
            filmRollId: roll.id,
            exposureNumber: nextNumber,
            aperture: "f/8", // Default values
            shutterSpeed: "1/125",
            imageData: downscaledData,
            capturedAt: Date()
        )
        
        modelContext.insert(newExposure)
        fetchExposures()
    }
    
    var rollProgress: String {
        "\(exposures.count)/\(roll.totalExposures)"
    }
    
    var rollMetadata: String {
        "ISO \(roll.iso) · EI \(roll.ei ?? roll.iso)"
    }
}
