import SwiftUI
import SwiftData

struct CaptureView: View {
    enum ActivePicker {
        case none
        case aperture
        case shutterSpeed
        case ei
        case focalLength
    }
    
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    
    @State private var viewModel: CaptureViewModel
    @State private var showNoteSheet = false
    @State private var showLensPicker = false
    @State private var activePicker: ActivePicker = .none
    @State private var cameraAuthorized: Bool = true
    
    init(roll: FilmRoll, modelContext: ModelContext) {
        _viewModel = State(initialValue: CaptureViewModel(roll: roll, modelContext: modelContext))
    }
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            if cameraAuthorized {
                // Viewfinder
                CameraPreview(session: viewModel.cameraService.session)
                    .ignoresSafeArea()
                    .overlay {
                        if viewModel.showGrid {
                            GridView()
                        }
                        if viewModel.showFrameLines {
                            FrameLinesView()
                        }
                    }
                    .overlay {
                        if viewModel.currentFocalLength < 24 {
                            letterboxBars
                        }
                    }
                    .overlay {
                        VignetteOverlay()
                        GrainOverlay()
                    }
                    .onTapGesture {
                        withAnimation(.spring(response: 0.3)) {
                            activePicker = .none
                        }
                    }
                
                // UI Overlays
                VStack {
                    topBar
                    
                    HStack {
                        LightMeterView(ev: viewModel.currentEV)
                        Spacer()
                    }
                    .padding(.top, 20)
                    
                    Spacer()
                    
                    if activePicker == .none {
                        FocalLengthOverlay(currentFocalLength: viewModel.currentFocalLength)
                            .padding(.bottom, 20)
                    }
                    
                    // Picker Overlay
                    if activePicker != .none {
                        pickerView
                            .transition(.move(edge: .bottom).combined(with: .opacity))
                            .zIndex(1)
                    }
                    
                    // Settings Chips Row
                    settingsChipsRow
                    
                    // Bottom Controls
                    bottomControls
                }
                .padding(.horizontal)
                
                // Frame Counter (floating below top bar)
                VStack {
                    frameCounterPill
                    Spacer()
                }
                .padding(.top, 70)
                
                // Capture Flash
                if viewModel.isCapturing {
                    Color.white
                        .ignoresSafeArea()
                        .transition(.opacity)
                }
            } else {
                EmptyStateView(
                    iconName: "camera.fill",
                    title: "Camera Access Denied",
                    bodyText: "Please enable camera access in Settings to use the capture feature.",
                    actionTitle: "Open Settings"
                ) {
                    if let url = URL(string: UIApplication.openSettingsURLString) {
                        UIApplication.shared.open(url)
                    }
                }
            }
        }
        .navigationBarHidden(true)
        .sheet(isPresented: $showNoteSheet) {
            NoteSheet(note: $viewModel.pendingNote)
                .presentationDetents([.height(300)])
                .presentationDragIndicator(.hidden)
        }
        .sheet(isPresented: $showLensPicker) {
            LensPickerSheet(selectedLens: $viewModel.currentLens)
                .presentationDetents([.medium, .large])
                .presentationDragIndicator(.hidden)
        }
        .onAppear {
            Task {
                cameraAuthorized = await viewModel.cameraService.checkPermission()
                if cameraAuthorized {
                    viewModel.cameraService.setupSession()
                    viewModel.cameraService.start()
                }
            }
            viewModel.locationService.requestPermission()
            viewModel.locationService.startUpdating()
        }
        .onDisappear {
            viewModel.cameraService.stop()
            viewModel.locationService.stopUpdating()
        }
    }
    
    private var letterboxBars: some View {
        VStack(spacing: 0) {
            Color.black.opacity(0.4)
                .frame(height: 120)
            Spacer()
            Color.black.opacity(0.4)
                .frame(height: 120)
        }
        .ignoresSafeArea()
    }
    
    private var topBar: some View {
        HStack {
            Button {
                dismiss()
            } label: {
                Image(systemName: "chevron.left")
                    .font(.title2)
                    .foregroundColor(.white)
                    .padding(12)
                    .background(.ultraThinMaterial)
                    .clipShape(Circle())
            }
            
            // Lens Label Pill
            Button {
                showLensPicker = true
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "camera.filters")
                    Text(viewModel.currentLens?.name ?? "No lens")
                        .lineLimit(1)
                }
                .font(.custom("InterTight-Medium", size: 12))
                .foregroundColor(.white)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(.ultraThinMaterial)
                .clipShape(Capsule())
            }
            
            Spacer()
            
            HStack(spacing: 12) {
                NavigationLink(value: GalleryDestination(roll: viewModel.roll)) {
                    Image(systemName: "photo.on.rectangle")
                        .foregroundColor(.white)
                        .padding(10)
                        .background(.ultraThinMaterial)
                        .clipShape(Circle())
                }
                .accessibilityIdentifier("galleryButton")
                
                VStack(spacing: 8) {
                    toggleButton(icon: "grid", active: $viewModel.showGrid)
                    toggleButton(icon: "viewfinder", active: $viewModel.showFrameLines)
                }
            }
        }
        .padding(.top, 10)
    }
    
    private func toggleButton(icon: String, active: Binding<Bool>) -> some View {
        Button {
            active.wrappedValue.toggle()
        } label: {
            Image(systemName: icon)
                .foregroundColor(active.wrappedValue ? Color(hex: Constants.Design.accent) : .white)
                .padding(10)
                .background(.ultraThinMaterial)
                .clipShape(Circle())
        }
    }
    
    private var frameCounterPill: some View {
        HStack(spacing: 8) {
            Text(viewModel.roll.name)
                .font(.custom("InterTight-Medium", size: 12))
                .lineLimit(1)
            
            Text(viewModel.exposureProgress)
                .font(.custom("JetBrainsMono-Bold", size: 14))
                .foregroundColor(Color(hex: Constants.Design.accent))
            
            if viewModel.isRollFull {
                Text("END")
                    .font(.custom("JetBrainsMono-Bold", size: 12))
                    .foregroundColor(Color(hex: Constants.Design.red))
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
        .background(.ultraThinMaterial)
        .clipShape(Capsule())
    }
    
    @ViewBuilder
    private var pickerView: some View {
        VStack(spacing: 0) {
            switch activePicker {
            case .aperture:
                RadialDialPicker(options: viewModel.filteredApertures, selection: $viewModel.currentAperture)
            case .shutterSpeed:
                RadialDialPicker(options: Constants.shutterSpeeds, selection: $viewModel.currentShutterSpeed)
            case .ei:
                RadialDialPicker(options: Constants.eiValues.map { "\($0)" }, selection: Binding(
                    get: { "\(viewModel.currentEI)" },
                    set: { viewModel.currentEI = Int($0) ?? viewModel.currentEI }
                ))
            case .focalLength:
                RadialDialPicker(options: viewModel.focalLengthOptions, selection: Binding(
                    get: { "\(viewModel.currentFocalLength)mm" },
                    set: { viewModel.currentFocalLength = Int($0.replacingOccurrences(of: "mm", with: "")) ?? viewModel.currentFocalLength }
                ))
            case .none:
                EmptyView()
            }
            
            // Dismiss button for picker
            Button {
                withAnimation(.spring(response: 0.3)) {
                    activePicker = .none
                }
            } label: {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 44))
                    .foregroundColor(Color(hex: Constants.Design.accent))
            }
            .accessibilityIdentifier("dismissPickerButton")
            .accessibilityLabel("Confirm Selection")
            .padding(.bottom, 20)
            .frame(maxWidth: .infinity)
        }
        .background(Color(hex: Constants.Design.surface1))
        .cornerRadius(22)
        .padding(.bottom, 10)
        .contentShape(Rectangle())
        .onTapGesture { } // Catch-all to prevent fall-through
    }
    
    private var settingsChipsRow: some View {
        HStack(spacing: 12) {
            CaptureChip(label: "APER", value: viewModel.currentAperture, isActive: activePicker == .aperture) {
                togglePicker(.aperture)
            }
            CaptureChip(label: "SHUT", value: viewModel.currentShutterSpeed, isActive: activePicker == .shutterSpeed) {
                togglePicker(.shutterSpeed)
            }
            CaptureChip(label: "EI", value: "\(viewModel.currentEI)", isActive: activePicker == .ei) {
                togglePicker(.ei)
            }
            CaptureChip(label: "FOCL", value: "\(viewModel.currentFocalLength)mm", isActive: activePicker == .focalLength) {
                togglePicker(.focalLength)
            }
        }
        .padding(.bottom, 20)
    }
    
    private func togglePicker(_ picker: ActivePicker) {
        withAnimation(.spring(response: 0.3)) {
            if activePicker == picker {
                activePicker = .none
            } else {
                activePicker = picker
            }
        }
    }
    
    private var bottomControls: some View {
        HStack {
            // Note Button
            Button {
                showNoteSheet = true
            } label: {
                Image(systemName: "note.text")
                    .font(.title3)
                    .foregroundColor(viewModel.pendingNote != nil ? Color(hex: Constants.Design.accent) : .white)
                    .frame(width: 50, height: 50)
                    .background(.ultraThinMaterial)
                    .clipShape(Circle())
            }
            
            Spacer()
            
            // Shutter Button
            Button {
                viewModel.capture()
                UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
            } label: {
                ZStack {
                    Circle()
                        .strokeBorder(.white, lineWidth: 4)
                        .frame(width: 78, height: 78)
                    Circle()
                        .fill(.white)
                        .frame(width: 64, height: 64)
                }
            }
            .accessibilityIdentifier("shutterButton")
            .disabled(viewModel.isRollFull || viewModel.isCapturing)
            
            Spacer()
            
            // Last Shot Peek
            NavigationLink(value: GalleryDestination(roll: viewModel.roll)) {
                Group {
                    if let imageData = viewModel.lastExposureThumbnail, let uiImage = UIImage(data: imageData) {
                        Image(uiImage: uiImage)
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    } else {
                        Image(systemName: "photo.on.rectangle")
                            .foregroundColor(.white)
                    }
                }
                .frame(width: 50, height: 50)
                .background(.ultraThinMaterial)
                .clipShape(Circle())
                .overlay(Circle().stroke(.white.opacity(0.2), lineWidth: 1))
            }
            .accessibilityIdentifier("lastShotPeek")
        }
        .padding(.bottom, 30)
    }
}

struct GridView: View {
    var body: some View {
        ZStack {
            HStack {
                Spacer()
                Divider().background(.white.opacity(0.2))
                Spacer()
                Divider().background(.white.opacity(0.2))
                Spacer()
            }
            VStack {
                Spacer()
                Divider().background(.white.opacity(0.2))
                Spacer()
                Divider().background(.white.opacity(0.2))
                Spacer()
            }
        }
    }
}

struct FrameLinesView: View {
    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 12)
                .stroke(style: StrokeStyle(lineWidth: 1, dash: [5, 5]))
                .foregroundColor(Color(hex: Constants.Design.accent).opacity(0.5))
                .padding(40)
            
            // Crosshair
            Path { path in
                path.move(to: CGPoint(x: -10, y: 0))
                path.addLine(to: CGPoint(x: 10, y: 0))
                path.move(to: CGPoint(x: 0, y: -10))
                path.addLine(to: CGPoint(x: 0, y: 10))
            }
            .stroke(Color(hex: Constants.Design.accent).opacity(0.5), lineWidth: 1)
        }
    }
}

struct CaptureChip: View {
    let label: String
    let value: String
    let isActive: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.custom("InterTight-Medium", size: 8))
                    .foregroundColor(isActive ? Color(hex: Constants.Design.accent).opacity(0.8) : .white.opacity(0.6))
                Text(value)
                    .font(.custom("JetBrainsMono-Bold", size: 14))
                    .foregroundColor(isActive ? .black : Color(hex: Constants.Design.accent))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
            .background(isActive ? Color(hex: Constants.Design.accent) : Color.white.opacity(0.1))
            .background(.ultraThinMaterial)
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(isActive ? Color(hex: Constants.Design.accent) : .white.opacity(0.1), lineWidth: 1)
            )
            .shadow(color: isActive ? Color(hex: Constants.Design.accent).opacity(0.3) : .clear, radius: 10)
        }
        .accessibilityIdentifier(label)
    }
}
