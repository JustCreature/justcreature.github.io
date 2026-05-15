import SwiftUI
import SwiftData

@main
struct FilmTrackerApp: App {
    var sharedModelContainer: ModelContainer = {
        let schema = Schema([
            Camera.self,
            Lens.self,
            FilmRoll.self,
            Exposure.self,
            AppSettings.self,
        ])
        let modelConfiguration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false)

        do {
            return try ModelContainer(for: schema, configurations: [modelConfiguration])
        } catch {
            fatalError("Could not create ModelContainer: \(error)")
        }
    }()

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(sharedModelContainer)
    }
}
