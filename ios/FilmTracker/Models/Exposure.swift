import Foundation
import SwiftData
import CoreLocation

@Model
final class Exposure {
    @Attribute(.unique) var id: String
    var filmRollId: String
    var exposureNumber: Int
    var aperture: String
    var shutterSpeed: String
    var additionalInfo: String?
    
    @Attribute(.externalStorage) 
    var imageData: Data?
    
    var latitude: Double?
    var longitude: Double?
    var capturedAt: Date
    var ei: Int?
    var lensId: String?
    var focalLength: Int?
    
    var location: CLLocationCoordinate2D? {
        guard let latitude, let longitude else { return nil }
        return CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }
    
    init(
        id: String = UUID().uuidString,
        filmRollId: String,
        exposureNumber: Int,
        aperture: String,
        shutterSpeed: String,
        additionalInfo: String? = nil,
        imageData: Data? = nil,
        latitude: Double? = nil,
        longitude: Double? = nil,
        capturedAt: Date = Date(),
        ei: Int? = nil,
        lensId: String? = nil,
        focalLength: Int? = nil
    ) {
        self.id = id
        self.filmRollId = filmRollId
        self.exposureNumber = exposureNumber
        self.aperture = aperture
        self.shutterSpeed = shutterSpeed
        self.additionalInfo = additionalInfo
        self.imageData = imageData
        self.latitude = latitude
        self.longitude = longitude
        self.capturedAt = capturedAt
        self.ei = ei
        self.lensId = lensId
        self.focalLength = focalLength
    }
}
