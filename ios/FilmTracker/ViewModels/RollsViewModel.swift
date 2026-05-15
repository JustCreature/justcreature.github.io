import SwiftUI
import SwiftData
import Observation

@Observable
final class RollsViewModel {
    var modelContext: ModelContext
    
    init(modelContext: ModelContext) {
        self.modelContext = modelContext
    }
    
    func addRoll(name: String, iso: Int, ei: Int?, totalExposures: Int, cameraId: String?, currentLensId: String?, tag: String? = nil) {
        let roll = FilmRoll(name: name, iso: iso, ei: ei, totalExposures: totalExposures, cameraId: cameraId, currentLensId: currentLensId, tag: tag)
        modelContext.insert(roll)
    }
    
    func updateRoll(_ roll: FilmRoll, name: String, iso: Int, ei: Int?, totalExposures: Int, cameraId: String?, currentLensId: String?, tag: String?) {
        roll.name = name
        roll.iso = iso
        roll.ei = ei
        roll.totalExposures = totalExposures
        roll.cameraId = cameraId
        roll.currentLensId = currentLensId
        roll.tag = tag
    }
    
    func deleteRoll(_ roll: FilmRoll) {
        // Also delete related exposures
        let rollId = roll.id
        let descriptor = FetchDescriptor<Exposure>(predicate: #Predicate { $0.filmRollId == rollId })
        if let exposures = try? modelContext.fetch(descriptor) {
            for exposure in exposures {
                modelContext.delete(exposure)
            }
        }
        modelContext.delete(roll)
    }
}
