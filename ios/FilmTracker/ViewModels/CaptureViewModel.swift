import Foundation
import SwiftData
import Observation
import CoreLocation

@Observable
final class CaptureViewModel {
    var roll: FilmRoll
    var modelContext: ModelContext
    
    var cameraService = CameraService()
    var locationService = LocationService()
    
    var currentAperture: String = "f/8"
    var currentShutterSpeed: String = "1/125"
    var currentEI: Int = 400
    var currentFocalLength: Int = 50
    var currentLens: Lens? {
        didSet {
            roll.currentLensId = currentLens?.id
            if let lens = currentLens {
                if let focal = lens.focalLength {
                    currentFocalLength = focal
                } else if let min = lens.focalLengthMin {
                    currentFocalLength = Swift.max(min, Swift.min(currentFocalLength, lens.focalLengthMax ?? min))
                }
                
                // Ensure current aperture is valid for the new lens
                if !filteredApertures.contains(currentAperture) {
                    currentAperture = lens.maxAperture
                }
            }
        }
    }
    
    var filteredApertures: [String] {
        guard let lens = currentLens else { return Constants.apertures }
        
        let lensMax = lens.maxAperture
        // Constants.apertures are ordered from f/1.4 to f/22
        // We want to find the index of lensMax and return all values from that index onwards.
        if let index = Constants.apertures.firstIndex(of: lensMax) {
            return Array(Constants.apertures[index...])
        }
        
        // If lensMax is not in constants (unlikely if UI prevents it), just return all
        return Constants.apertures
    }
    
    var focalLengthOptions: [String] {
        if let lens = currentLens {
            if lens.isZoom {
                let min = lens.focalLengthMin!
                let max = lens.focalLengthMax!
                // Generate steps of 5mm
                var steps: [Int] = []
                var current = min
                while current <= max {
                    steps.append(current)
                    current += 5
                }
                if steps.last != max { steps.append(max) }
                return steps.map { "\($0)mm" }
            } else {
                return ["\(lens.focalLength!)mm"]
            }
        }
        return Constants.focalPresets.map { "\($0)mm" }
    }
    
    var showGrid: Bool = false
    var showFrameLines: Bool = false
    var pendingNote: String?
    
    var isCapturing: Bool = false
    var lastExposureThumbnail: Data?
    
    init(roll: FilmRoll, modelContext: ModelContext) {
        self.roll = roll
        self.modelContext = modelContext
        self.currentEI = roll.ei ?? roll.iso
        
        // Load last exposure settings if available
        fetchLastExposure()
        
        // Initialize lens
        if let lensId = roll.currentLensId {
            fetchLens(id: lensId)
        }
    }
    
    func fetchLastExposure() {
        let rollId = roll.id
        let descriptor = FetchDescriptor<Exposure>(
            predicate: #Predicate<Exposure> { $0.filmRollId == rollId },
            sortBy: [SortDescriptor(\.exposureNumber, order: .reverse)]
        )
        
        if let lastExposure = try? modelContext.fetch(descriptor).first {
            currentAperture = lastExposure.aperture
            currentShutterSpeed = lastExposure.shutterSpeed
            currentEI = lastExposure.ei ?? roll.ei ?? roll.iso
            currentFocalLength = lastExposure.focalLength ?? 50
            lastExposureThumbnail = lastExposure.imageData
        }
    }
    
    func fetchLens(id: String) {
        let descriptor = FetchDescriptor<Lens>(
            predicate: #Predicate<Lens> { $0.id == id }
        )
        currentLens = try? modelContext.fetch(descriptor).first
        if let lens = currentLens {
            if let focal = lens.focalLength {
                currentFocalLength = focal
            } else if let min = lens.focalLengthMin {
                currentFocalLength = Swift.max(min, Swift.min(currentFocalLength, lens.focalLengthMax ?? min))
            }
        }
    }
    
    func capture() {
        guard !isCapturing else { return }
        isCapturing = true
        
        cameraService.capturePhoto { [weak self] rawData in
            guard let self = self, let data = rawData else {
                self?.isCapturing = false
                return
            }
            
            Task {
                // Downscale image
                guard let downscaledData = ImageUtils.downscale(data) else {
                    await MainActor.run { self.isCapturing = false }
                    return
                }
                
                let location = self.locationService.lastLocation
                
                await MainActor.run {
                    self.saveExposure(imageData: downscaledData, location: location)
                    self.isCapturing = false
                }
            }
        }
    }
    
    private func saveExposure(imageData: Data, location: CLLocation?) {
        let nextNumber = currentExposureCount() + 1
        
        let exposure = Exposure(
            filmRollId: roll.id,
            exposureNumber: nextNumber,
            aperture: currentAperture,
            shutterSpeed: currentShutterSpeed,
            imageData: imageData,
            latitude: location?.coordinate.latitude,
            longitude: location?.coordinate.longitude,
            ei: currentEI,
            lensId: currentLens?.id,
            focalLength: currentFocalLength
        )
        
        if let note = pendingNote {
            exposure.additionalInfo = note
            pendingNote = nil
        }
        
        modelContext.insert(exposure)
        lastExposureThumbnail = imageData
        
        // Haptic feedback could be triggered here or in the View
    }
    
    func currentExposureCount() -> Int {
        let rollId = roll.id
        let descriptor = FetchDescriptor<Exposure>(
            predicate: #Predicate<Exposure> { $0.filmRollId == rollId }
        )
        return (try? modelContext.fetchCount(descriptor)) ?? 0
    }
    
    var exposureProgress: String {
        let count = currentExposureCount()
        return "\(count) / \(roll.totalExposures)"
    }
    
    var isRollFull: Bool {
        currentExposureCount() >= roll.totalExposures
    }
    
    // MARK: - Light Meter Logic
    
    var currentEV: Double {
        let n = apertureValue(currentAperture)
        let t = shutterSpeedValue(currentShutterSpeed)
        
        // EV = log2(N^2 / t)
        // ISO adjustment: EV_S = EV_100 + log2(S / 100)
        // But for a simple simulated meter, we just show the EV for the current settings
        return log2(pow(n, 2) / t)
    }
    
    private func apertureValue(_ s: String) -> Double {
        // "f/8" -> 8.0
        let cleaned = s.replacingOccurrences(of: "f/", with: "")
        return Double(cleaned) ?? 1.0
    }
    
    private func shutterSpeedValue(_ s: String) -> Double {
        // "1/125" -> 0.008
        // "1\"" -> 1.0
        // "BULB" -> 1.0
        if s == "BULB" { return 1.0 }
        if s.contains("\"") {
            let cleaned = s.replacingOccurrences(of: "\"", with: "")
            return Double(cleaned) ?? 1.0
        }
        if s.contains("/") {
            let parts = s.components(separatedBy: "/")
            if parts.count == 2, let den = Double(parts[1]) {
                return 1.0 / den
            }
        }
        return Double(s) ?? 1.0
    }
}
