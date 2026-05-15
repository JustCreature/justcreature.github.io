import Foundation
import SwiftData

@Model
final class Lens {
    @Attribute(.unique) var id: String
    var name: String
    var maxAperture: String
    var focalLength: Int?
    var focalLengthMin: Int?
    var focalLengthMax: Int?
    var createdAt: Date
    
    var isZoom: Bool {
        focalLengthMin != nil && focalLengthMax != nil
    }
    
    init(id: String = UUID().uuidString, name: String, maxAperture: String, focalLength: Int? = nil, focalLengthMin: Int? = nil, focalLengthMax: Int? = nil, createdAt: Date = Date()) {
        self.id = id
        self.name = name
        self.maxAperture = maxAperture
        self.focalLength = focalLength
        self.focalLengthMin = focalLengthMin
        self.focalLengthMax = focalLengthMax
        self.createdAt = createdAt
    }
}
