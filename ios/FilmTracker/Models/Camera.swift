import Foundation
import SwiftData

@Model
final class Camera {
    @Attribute(.unique) var id: String
    var make: String
    var model: String
    var name: String
    var lensIDs: [String] = []
    var createdAt: Date
    
    init(id: String = UUID().uuidString, make: String, model: String, name: String? = nil, lensIDs: [String] = [], createdAt: Date = Date()) {
        self.id = id
        self.make = make
        self.model = model
        self.name = name ?? "\(make) \(model)"
        self.lensIDs = lensIDs
        self.createdAt = createdAt
    }
}
