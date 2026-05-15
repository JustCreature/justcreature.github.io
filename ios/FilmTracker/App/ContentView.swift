import SwiftUI

struct ContentView: View {
    @State private var selectedTab: Tab = .rolls
    
    enum Tab {
        case rolls
        case equipment
    }
    
    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                RollsView()
            }
            .tabItem {
                Label("Rolls", systemImage: "film")
            }
            .tag(Tab.rolls)
            
            NavigationStack {
                EquipmentView()
            }
            .tabItem {
                Label("Equipment", systemImage: "camera")
            }
            .tag(Tab.equipment)
        }
        .tint(Color(hex: Constants.Design.accent))
    }
}

// Placeholders for views
struct RollsView: View {
    var body: some View {
        Text("Film Rolls")
            .navigationTitle("Rolls")
    }
}

#Preview {
    ContentView()
}
