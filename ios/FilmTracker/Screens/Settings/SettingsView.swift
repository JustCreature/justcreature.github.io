import SwiftUI
import SwiftData

struct SettingsView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    
    @Query private var settings: [AppSettings]
    @Query private var cameras: [Camera]
    @Query private var lenses: [Lens]
    @Query private var rolls: [FilmRoll]
    @Query private var exposures: [Exposure]
    
    @State private var showingClearConfirmation = false
    
    private var currentSettings: AppSettings {
        if let first = settings.first {
            return first
        } else {
            let newSettings = AppSettings()
            modelContext.insert(newSettings)
            return newSettings
        }
    }
    
    var body: some View {
        ZStack {
            Color.appBg.ignoresSafeArea()
            
            VStack(spacing: 0) {
                header
                
                ScrollView {
                    VStack(spacing: 24) {
                        // Capture Section
                        settingsSection(title: "CAPTURE") {
                            ToggleRow(
                                icon: "grid",
                                title: "Rule-of-thirds grid",
                                isOn: Binding(
                                    get: { currentSettings.gridEnabled },
                                    set: { currentSettings.gridEnabled = $0 }
                                )
                            )
                            
                            ToggleRow(
                                icon: "location",
                                title: "Location tagging",
                                isOn: Binding(
                                    get: { currentSettings.locationEnabled },
                                    set: { currentSettings.locationEnabled = $0 }
                                )
                            )
                            
                            ToggleRow(
                                icon: "waveform",
                                title: "Haptic feedback",
                                isOn: Binding(
                                    get: { currentSettings.hapticsEnabled },
                                    set: { currentSettings.hapticsEnabled = $0 }
                                )
                            )
                        }
                        
                        // Sync Section
                        settingsSection(title: "SYNC") {
                            HStack {
                                Image(systemName: "icloud")
                                    .foregroundColor(.dim)
                                    .frame(width: 24)
                                Text("Google Drive Sync")
                                    .font(.appBody(16))
                                    .foregroundColor(.muted)
                                Spacer()
                                Text("Coming soon")
                                    .font(.appMono(10))
                                    .foregroundColor(.dim)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Color.surface2)
                                    .cornerRadius(4)
                            }
                            .padding(.vertical, 8)
                        }
                        
                        // Data Section
                        settingsSection(title: "DATA MANAGEMENT") {
                            SettingsActionRow(icon: "square.and.arrow.up", title: "Export all rolls") {
                                // Multi-roll export logic if needed, or just a hint
                            }
                            .opacity(0.5) // Placeholder
                            
                            SettingsActionRow(icon: "trash", title: "Clear all data", isDestructive: true) {
                                showingClearConfirmation = true
                            }
                        }
                        
                        // About Section
                        settingsSection(title: "ABOUT") {
                            HStack {
                                Text("Version")
                                    .font(.appBody(16))
                                Spacer()
                                Text(currentSettings.version)
                                    .font(.appMono(12))
                                    .foregroundColor(.muted)
                            }
                            .padding(.vertical, 8)
                            
                            Link(destination: URL(string: "https://github.com/nikitazavartsev/film-meta-tracker")!) {
                                HStack {
                                    Text("Open Source")
                                        .font(.appBody(16))
                                    Spacer()
                                    Image(systemName: "arrow.up.right")
                                        .font(.system(size: 12))
                                }
                                .foregroundColor(.accent)
                            }
                            .padding(.vertical, 8)
                        }
                    }
                    .padding(20)
                }
            }
        }
        .navigationBarHidden(true)
        .confirmationDialog("Clear All Data?", isPresented: $showingClearConfirmation, titleVisibility: .visible) {
            Button("Delete Everything", role: .destructive) {
                clearAllData()
            }
            Button("Cancel", role: .cancel) { }
        } message: {
            Text("This will permanently delete all cameras, lenses, film rolls, and exposures. This action cannot be undone.")
        }
    }
    
    private var header: some View {
        HStack {
            Button {
            dismiss()
            } label: {
            Image(systemName: "chevron.left")
                .font(.title3)
                .foregroundColor(.appText)
                .padding(10)
                .background(Color.surface1)
                .clipShape(Circle())
            }

            Spacer()

            Text("SETTINGS")
            .font(.appHeadline(16))
            .foregroundColor(.appText)            
            Spacer()
            
            // Empty spacer to balance header
            Color.clear.frame(width: 44, height: 44)
        }
        .padding(.horizontal)
        .padding(.top, 8)
        .padding(.bottom, 12)
        .background(Color.appBg)
    }
    
    private func settingsSection<Content: View>(title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.appMono(10))
                .foregroundColor(.muted)
            
            VStack(spacing: 0) {
                content()
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(Color.surface1)
            .cornerRadius(Constants.Design.radiusMD)
        }
    }
    
    private func clearAllData() {
        for camera in cameras { modelContext.delete(camera) }
        for lens in lenses { modelContext.delete(lens) }
        for roll in rolls { modelContext.delete(roll) }
        for exposure in exposures { modelContext.delete(exposure) }
        try? modelContext.save()
    }
}

struct ToggleRow: View {
    let icon: String
    let title: String
    @Binding var isOn: Bool
    
    var body: some View {
        Toggle(isOn: $isOn) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .foregroundColor(.accent)
                    .frame(width: 24)
                Text(title)
                    .font(.appBody(16))
            }
        }
        .tint(.accent)
        .padding(.vertical, 10)
    }
}

struct SettingsActionRow: View {
    let icon: String
    let title: String
    var isDestructive: Bool = false
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .foregroundColor(isDestructive ? .red : .accent)
                    .frame(width: 24)
                Text(title)
                    .font(.appBody(16))
                    .foregroundColor(isDestructive ? .red : .appText)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 12))
                    .foregroundColor(.dim)
            }
            .padding(.vertical, 12)
        }
    }
}
