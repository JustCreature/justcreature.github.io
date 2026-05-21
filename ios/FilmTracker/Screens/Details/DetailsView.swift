import SwiftUI
import SwiftData
import PhotosUI

struct DetailsView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    
    @State private var viewModel: ExposureViewModel
    @State private var showingImageSource = false
    @State private var showingPhotosPicker = false
    @State private var selectedItem: PhotosPickerItem?
    @State private var showingDeleteConfirmation = false
    
    init(exposure: Exposure, modelContext: ModelContext) {
        _viewModel = State(initialValue: ExposureViewModel(exposure: exposure, modelContext: modelContext))
    }
    
    var body: some View {
        ZStack {
            Color.appBg.ignoresSafeArea()
            
            ScrollView {
                VStack(spacing: 20) {
                    heroImage
                    
                    if viewModel.isEditing {
                        editingForm
                    } else {
                        readoutGrid
                        
                        metadataCard
                        
                        notesSection
                    }
                    
                    Spacer(minLength: 40)
                }
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                HStack(spacing: 16) {
                    Button {
                        if viewModel.isEditing {
                            viewModel.save()
                        } else {
                            viewModel.isEditing = true
                        }
                    } label: {
                        Text(viewModel.isEditing ? "Save" : "Edit")
                            .font(.custom("InterTight-Bold", size: 16))
                            .foregroundColor(.accent)
                    }
                    
                    if viewModel.isEditing {
                        Button("Cancel") {
                            viewModel.cancel()
                        }
                        .font(.custom("InterTight-Medium", size: 16))
                        .foregroundColor(.appText)
                    } else {
                        Button(role: .destructive) {
                            showingDeleteConfirmation = true
                        } label: {
                            Image(systemName: "trash")
                                .foregroundColor(.appRed)
                        }
                    }
                }
            }
        }
        .confirmationDialog("Delete Exposure?", isPresented: $showingDeleteConfirmation, titleVisibility: .visible) {
            Button("Delete", role: .destructive) {
                viewModel.delete()
                dismiss()
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This will permanently remove this exposure.")
        }
        .onChange(of: selectedItem) { _, newItem in
            if let newItem {
                Task {
                    if let data = try? await newItem.loadTransferable(type: Data.self) {
                        viewModel.updateImage(data)
                    }
                }
            }
        }
    }
    
    private var heroImage: some View {
        ZStack(alignment: .top) {
            // Main Image
            Group {
                if let data = viewModel.exposure.imageData, let uiImage = UIImage(data: data) {
                    Image(uiImage: uiImage)
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } else {
                    Rectangle()
                        .fill(LinearGradient(colors: [Color(hex: Constants.Design.surface2), Color(hex: Constants.Design.surface1)], startPoint: .topLeading, endPoint: .bottomTrailing))
                }
            }
            .frame(maxWidth: .infinity)
            .aspectRatio(4/3, contentMode: .fit)
            .clipped()
            .overlay {
                if viewModel.isEditing {
                    Color.black.opacity(0.4)
                    Button {
                        showingPhotosPicker = true
                    } label: {
                        VStack(spacing: 8) {
                            Image(systemName: "camera.fill")
                                .font(.largeTitle)
                            Text("Replace Image")
                                .font(.custom("InterTight-Bold", size: 16))
                        }
                        .foregroundColor(.white)
                    }
                }
            }
            
            // Perforation Overlays
            perforationOverlay(isTop: true)
            perforationOverlay(isTop: false)
        }
        .photosPicker(isPresented: $showingPhotosPicker, selection: $selectedItem, matching: .images)
    }
    
    @ViewBuilder
    private var editingForm: some View {
        VStack(spacing: 20) {
            VStack(alignment: .leading, spacing: 12) {
                Text("EXPOSURE SETTINGS")
                    .font(.appMono(10))
                    .foregroundColor(.muted)
                
                VStack(spacing: 0) {
                    pickerRow(label: "Aperture", options: Constants.apertures, selection: $viewModel.aperture)
                    Divider().background(Color.appText.opacity(0.1))
                    pickerRow(label: "Shutter", options: Constants.shutterSpeeds, selection: $viewModel.shutterSpeed)
                    Divider().background(Color.appText.opacity(0.1))
                    pickerRow(label: "EI", options: Constants.eiValues.map { "\($0)" }, selection: Binding(
                        get: { "\(viewModel.ei)" },
                        set: { viewModel.ei = Int($0) ?? 400 }
                    ))
                    Divider().background(Color.appText.opacity(0.1))
                    pickerRow(label: "Focal", options: Constants.focalPresets.map { "\($0)mm" }, selection: Binding(
                        get: { viewModel.focalLength != nil ? "\(viewModel.focalLength!)mm" : "—" },
                        set: { viewModel.focalLength = Int($0.replacingOccurrences(of: "mm", with: "")) }
                    ))
                }
                .background(Color.surface1)
                .cornerRadius(12)
            }
            
            notesSection
        }
        .padding(.horizontal, 20)
    }
    
    private func pickerRow(label: String, options: [String], selection: Binding<String>) -> some View {
        HStack {
            Text(label)
                .font(.appBody(16))
                .foregroundColor(.appText)
            Spacer()
            Picker(label, selection: selection) {
                ForEach(options, id: \.self) { option in
                    Text(option).tag(option)
                }
            }
            .pickerStyle(.menu)
            .tint(.accent)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }
    
    private func perforationOverlay(isTop: Bool) -> some View {
        VStack {
            if !isTop { Spacer() }
            
            HStack {
                if isTop {
                    Text(viewModel.rollName)
                    Spacer()
                    Text("\(viewModel.exposure.exposureNumber)A → \(viewModel.exposure.exposureNumber)")
                } else {
                    Text("ISO \(viewModel.exposure.ei ?? 0)")
                    Spacer()
                    Text(viewModel.exposure.capturedAt.formatted(date: .numeric, time: .omitted))
                }
            }
            .font(.custom("JetBrainsMono-Bold", size: 10))
            .foregroundColor(.white.opacity(0.8))
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Color.black.opacity(0.4))
            
            if isTop { Spacer() }
        }
        .frame(height: isTop ? 40 : nil)
    }
    
    private var readoutGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            ReadoutTile(label: "Aperture", value: viewModel.aperture, isDimmed: false)
            ReadoutTile(label: "Shutter", value: viewModel.shutterSpeed, isDimmed: false)
            ReadoutTile(label: "EI", value: "\(viewModel.ei)", isDimmed: false)
            ReadoutTile(label: "Focal", value: viewModel.focalLength != nil ? "\(viewModel.focalLength!)mm" : "—", isDimmed: viewModel.focalLength == nil)
        }
        .padding(.horizontal, 20)
    }
    
    private var metadataCard: some View {
        VStack(spacing: 0) {
            metadataRow(icon: "camera", label: "Camera", value: viewModel.cameraName)
            Divider().background(Color.appText.opacity(0.05))
            metadataRow(icon: "camera.filters", label: "Lens", value: viewModel.lensName)
            Divider().background(Color.appText.opacity(0.05))
            metadataRow(icon: "clock", label: "Captured", value: viewModel.exposure.capturedAt.formatted(date: .abbreviated, time: .shortened))
            Divider().background(Color.appText.opacity(0.05))
            metadataRow(icon: "location", label: "Location", value: locationString)
        }
        .background(Color.surface1)
        .clipShape(RoundedRectangle(cornerRadius: Constants.Design.radiusLG))
        .padding(.horizontal, 20)
    }
    
    private func metadataRow(icon: String, label: String, value: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(.muted)
                .frame(width: 20)
            
            Text(label)
                .font(.custom("InterTight-Medium", size: 14))
                .foregroundColor(.muted)
            
            Spacer()
            
            Text(value)
                .font(.custom("JetBrainsMono-Bold", size: 14))
                .foregroundColor(.appText)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
    }
    
    private var notesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("NOTES")
                .font(.custom("InterTight-Bold", size: 12))
                .foregroundColor(.muted)
                .padding(.leading, 4)

            if viewModel.isEditing {
                TextEditor(text: $viewModel.additionalInfo)
                    .font(.custom("InterTight-Regular", size: 14))
                    .foregroundColor(.appText)
                    .frame(minHeight: 120)
                    .padding(12)
                    .background(Color.surface2)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            } else {
                Text(viewModel.additionalInfo.isEmpty ? "No notes added." : viewModel.additionalInfo)
                    .font(.custom("InterTight-Regular", size: 14))
                    .foregroundColor(viewModel.additionalInfo.isEmpty ? .dim : .appText)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(16)
                    .background(Color.surface1)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
        .padding(.horizontal, 20)
    }
    
    private var locationString: String {
        if let location = viewModel.exposure.location {
            return "\(String(format: "%.4f", location.latitude)), \(String(format: "%.4f", location.longitude))"
        } else {
            return "—"
        }
    }
}
