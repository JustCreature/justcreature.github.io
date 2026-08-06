import Foundation
import SwiftData

@Model
final class FilmRoll {
    @Attribute(.unique) var id: String
    var name: String
    var iso: Int
    var ei: Int?
    var totalExposures: Int
    var cameraId: String?
    var currentLensId: String?
    var createdAt: Date
    var tag: String?
    
    init(id: String = UUID().uuidString, name: String, iso: Int, ei: Int? = nil, totalExposures: Int, cameraId: String? = nil, currentLensId: String? = nil, createdAt: Date = Date(), tag: String? = nil) {
        self.id = id
        self.name = name
        self.iso = iso
        self.ei = ei
        self.totalExposures = totalExposures
        self.cameraId = cameraId
        self.currentLensId = currentLensId
        self.createdAt = createdAt
        self.tag = tag
    }
}
