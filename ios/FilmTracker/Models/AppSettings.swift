import Foundation
import SwiftData

@Model
final class AppSettings {
    @Attribute(.unique) var id: String
    var gridEnabled: Bool
    var locationEnabled: Bool
    var hapticsEnabled: Bool
    var version: String
    
    init(id: String = "singleton", gridEnabled: Bool = true, locationEnabled: Bool = true, hapticsEnabled: Bool = true, version: String = "2.0.0") {
        self.id = id
        self.gridEnabled = gridEnabled
        self.locationEnabled = locationEnabled
        self.hapticsEnabled = hapticsEnabled
        self.version = version
    }
}
