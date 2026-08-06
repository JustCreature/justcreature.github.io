import Foundation
import SwiftData
import UIKit

enum ImportErrors: Error {
    case invalidJSON
    case missingMetadata
    case fileAccessError
}

final class ImportService {
    static let shared = ImportService()
    
    private let decoder: JSONDecoder = {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return decoder
    }()
    
    func importFromJSON(url: URL, modelContext: ModelContext) async throws {
        // Start accessing security-scoped resource if needed (from UIDocumentPicker)
        let accessing = url.startAccessingSecurityScopedResource()
        defer { if accessing { url.stopAccessingSecurityScopedResource() } }
        
        let data = try Data(contentsOf: url)
        let metadata = try decoder.decode(ExportMetadata.self, from: data)
        
        try await processImport(metadata: metadata, modelContext: modelContext)
    }
    
    func importFromFolder(url: URL, modelContext: ModelContext) async throws {
        let accessing = url.startAccessingSecurityScopedResource()
        defer { if accessing { url.stopAccessingSecurityScopedResource() } }
        
        let metadataURL = url.appendingPathComponent("metadata.json")
        guard FileManager.default.fileExists(atPath: metadataURL.path) else {
            throw ImportErrors.missingMetadata
        }
        
        let data = try Data(contentsOf: metadataURL)
        var metadata = try decoder.decode(ExportMetadata.self, from: data)
        
        // Match images from folder
        let updatedExposures = metadata.exposures.map { exp -> ExportExposure in
            let imageFileName = "exposure_\(exp.exposureNumber)_\(exp.id).jpg"
            let imageURL = url.appendingPathComponent(imageFileName)
            
            if FileManager.default.fileExists(atPath: imageURL.path),
               let imageData = try? Data(contentsOf: imageURL),
               let downscaled = ImageUtils.downscale(imageData) {
                return ExportExposure(
                    id: exp.id,
                    filmRollId: exp.filmRollId,
                    exposureNumber: exp.exposureNumber,
                    aperture: exp.aperture,
                    shutterSpeed: exp.shutterSpeed,
                    additionalInfo: exp.additionalInfo,
                    imageData: downscaled.base64EncodedString(),
                    location: exp.location,
                    capturedAt: exp.capturedAt,
                    ei: exp.ei,
                    lensId: exp.lensId,
                    focalLength: exp.focalLength
                )
            }
            return exp
        }
        
        metadata = ExportMetadata(
            filmRoll: metadata.filmRoll,
            exposures: updatedExposures,
            exportedAt: metadata.exportedAt,
            version: metadata.version
        )
        
        try await processImport(metadata: metadata, modelContext: modelContext)
    }
    
    private func processImport(metadata: ExportMetadata, modelContext: ModelContext) async throws {
        // Create FilmRoll
        let roll = FilmRoll(
            id: UUID().uuidString, // New ID for imported roll to avoid collisions
            name: "[IMPORTED] \(metadata.filmRoll.name)",
            iso: metadata.filmRoll.iso,
            ei: metadata.filmRoll.ei,
            totalExposures: metadata.filmRoll.totalExposures,
            cameraId: metadata.filmRoll.cameraId,
            currentLensId: metadata.filmRoll.currentLensId,
            createdAt: metadata.filmRoll.createdAt,
            tag: "IMPORTED"
        )
        
        modelContext.insert(roll)
        
        // Create Exposures
        for exp in metadata.exposures {
            let imageData = exp.imageData.flatMap { Data(base64Encoded: $0) }
            let downscaled = imageData.flatMap { ImageUtils.downscale($0) }
            
            let exposure = Exposure(
                id: UUID().uuidString, // New ID
                filmRollId: roll.id,
                exposureNumber: exp.exposureNumber,
                aperture: exp.aperture,
                shutterSpeed: exp.shutterSpeed,
                additionalInfo: exp.additionalInfo,
                imageData: downscaled,
                latitude: exp.location?.latitude,
                longitude: exp.location?.longitude,
                capturedAt: exp.capturedAt,
                ei: exp.ei,
                lensId: exp.lensId,
                focalLength: exp.focalLength
            )
            modelContext.insert(exposure)
        }
        
        try modelContext.save()
    }
}

// Extension to help creating ExportExposure manually in folder import loop
extension ExportExposure {
    init(id: String, filmRollId: String, exposureNumber: Int, aperture: String, shutterSpeed: String, additionalInfo: String?, imageData: String?, location: ExportLocation?, capturedAt: Date, ei: Int?, lensId: String?, focalLength: Int?) {
        self.id = id
        self.filmRollId = filmRollId
        self.exposureNumber = exposureNumber
        self.aperture = aperture
        self.shutterSpeed = shutterSpeed
        self.additionalInfo = additionalInfo
        self.imageData = imageData
        self.location = location
        self.capturedAt = capturedAt
        self.ei = ei
        self.lensId = lensId
        self.focalLength = focalLength
    }
}
