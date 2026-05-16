import SwiftUI
import SwiftData

struct ExportSheet: View {
    let roll: FilmRoll
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    
    @State private var selectedFormat: ExportFormat = .jsonOnly
    @State private var isExporting = false
    @State private var exportURL: URL?
    @State private var showingShareSheet = false
    
    @Query private var allExposures: [Exposure]
    
    var exposures: [Exposure] {
        allExposures.filter { $0.filmRollId == roll.id }.sorted { $0.exposureNumber < $1.exposureNumber }
    }
    
    var body: some View {
        VStack(spacing: 24) {
            // Header
            VStack(spacing: 8) {
                Text("EXPORT ROLL")
                    .font(.appMono(12))
                    .foregroundColor(.muted)
                Text(roll.name)
                    .font(.appHeadline(20))
                    .foregroundColor(.appText)
            }
            .padding(.top, 8)
            
            // Format Selection
            VStack(alignment: .leading, spacing: 16) {
                Text("SELECT FORMAT")
                    .font(.appMono(10))
                    .foregroundColor(.muted)
                
                VStack(spacing: 12) {
                    formatOption(
                        format: .jsonOnly,
                        title: "JSON Metadata Only",
                        subtitle: "Compact, compatible with PWA",
                        icon: "doc.text"
                    )
                    
                    formatOption(
                        format: .jsonWithImages,
                        title: "JSON with Images",
                        subtitle: "All-in-one file, base64 encoded",
                        icon: "doc.richtext"
                    )
                    
                    formatOption(
                        format: .archive,
                        title: "Multi-file Archive",
                        subtitle: "metadata.json + separate JPEGs",
                        icon: "archivebox"
                    )
                }
            }
            
            Spacer()
            
            // Export Button
            AppButton(
                title: isExporting ? "Exporting..." : "Export Roll",
                isDisabled: isExporting
            ) {
                performExport()
            }
        }
        .padding(24)
        .background(Color.surface1)
        .cornerRadius(Constants.Design.radiusXL, corners: [.topLeft, .topRight])
        .sheet(isPresented: $showingShareSheet, onDismiss: { dismiss() }) {
            if let url = exportURL {
                ShareSheet(activityItems: [url])
            }
        }
    }
    
    private func formatOption(format: ExportFormat, title: String, subtitle: String, icon: String) -> some View {
        Button {
            selectedFormat = format
        } label: {
            HStack(spacing: 16) {
                Image(systemName: icon)
                    .font(.system(size: 20))
                    .foregroundColor(selectedFormat == format ? .black : .accent)
                    .frame(width: 44, height: 44)
                    .background(selectedFormat == format ? Color.accent : Color.surface2)
                    .clipShape(RoundedRectangle(cornerRadius: Constants.Design.radiusSM))
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.appHeadline(16))
                        .foregroundColor(selectedFormat == format ? .accent : .appText)
                    Text(subtitle)
                        .font(.appBody(12))
                        .foregroundColor(.muted)
                }
                
                Spacer()
                
                if selectedFormat == format {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.accent)
                }
            }
            .padding(12)
            .background(selectedFormat == format ? Color.accent.opacity(0.1) : Color.surface2.opacity(0.5))
            .cornerRadius(Constants.Design.radiusMD)
            .overlay(
                RoundedRectangle(cornerRadius: Constants.Design.radiusMD)
                    .stroke(selectedFormat == format ? Color.accent : Color.clear, lineWidth: 1)
            )
        }
    }
    
    private func performExport() {
        isExporting = true
        
        Task {
            do {
                let url = try await ExportService.shared.exportRoll(roll, exposures: exposures, format: selectedFormat)
                await MainActor.run {
                    self.exportURL = url
                    self.isExporting = false
                    self.showingShareSheet = true
                }
            } catch {
                print("Export failed: \(error)")
                await MainActor.run {
                    self.isExporting = false
                }
            }
        }
    }
}

struct ShareSheet: UIViewControllerRepresentable {
    let activityItems: [Any]
    
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: activityItems, applicationActivities: nil)
    }
    
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
