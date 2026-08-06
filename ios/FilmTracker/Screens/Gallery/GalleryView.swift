import SwiftUI
import SwiftData
import PhotosUI

struct GalleryView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    
    @State private var viewModel: GalleryViewModel
    @State private var showingExportSheet = false
    @State private var exposureToDelete: Exposure?
    @State private var showingDeleteConfirmation = false
    
    @Binding var path: NavigationPath
    
    init(roll: FilmRoll, modelContext: ModelContext, path: Binding<NavigationPath>) {
        _viewModel = State(initialValue: GalleryViewModel(roll: roll, modelContext: modelContext))
        _path = path
    }
    
    var body: some View {
        ZStack {
            Color.appBg.ignoresSafeArea()
            
            VStack(spacing: 0) {
                header
                
                quickActions
                
                if viewModel.exposures.isEmpty {
                    EmptyStateView(
                        iconName: "photo.on.rectangle",
                        title: "No exposures yet",
                        bodyText: "Start shooting or import photos from your library.",
                        actionTitle: "Add from gallery",
                        action: {
                            // Trigger PHPicker implicitly via state change if needed, 
                            // but usually it's a PhotosPicker button.
                        }
                    )
                    .padding(.top, 60)
                } else {
                    ScrollView {
                        if viewModel.isGridView {
                            gridView
                        } else {
                            stripView
                        }
                        
                        filmLeader
                    }
                }
                
                Spacer(minLength: 0)
            }
        }
        .navigationBarHidden(true)
        .sheet(isPresented: $showingExportSheet) {
            ExportSheet(roll: viewModel.roll)
                .presentationDetents([.height(300)])
        }
        .confirmationDialog("Delete Exposure?", isPresented: $showingDeleteConfirmation, titleVisibility: .visible) {
            Button("Delete", role: .destructive) {
                if let exposure = exposureToDelete {
                    viewModel.deleteExposure(exposure)
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This will permanently remove this exposure.")
        }
    }
    
    private var header: some View {
        VStack(spacing: 4) {
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
                
                VStack(spacing: 2) {
                    Text("CONTACT SHEET")
                        .font(.custom("InterTight-Bold", size: 14))
                        .foregroundColor(.muted)
                    Text("\(viewModel.rollProgress) · \(viewModel.rollMetadata)")
                        .font(.custom("JetBrainsMono-Bold", size: 10))
                        .foregroundColor(.accent)
                }
                
                Spacer()
                
                HStack(spacing: 12) {
                    Button {
                        showingExportSheet = true
                    } label: {
                        Image(systemName: "square.and.arrow.up")
                            .font(.title3)
                            .foregroundColor(.accent)
                    }
                    .accessibilityIdentifier("exportButton")
                    
                    Button {
                        path = NavigationPath()
                    } label: {
                        Image(systemName: "house")
                            .font(.title3)
                            .foregroundColor(.appText)
                            .padding(10)
                            .background(Color.surface1)
                            .clipShape(Circle())
                    }
                }
            }
            .padding(.horizontal)
            .padding(.top, 10)
            
            // Strip/Grid Toggle
            HStack {
                Spacer()
                HStack(spacing: 0) {
                    Button {
                        withAnimation { viewModel.isGridView = false }
                    } label: {
                        Image(systemName: "rectangle.grid.1x2.fill")
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(!viewModel.isGridView ? Color.surface3 : Color.clear)
                    }
                    
                    Button {
                        withAnimation { viewModel.isGridView = true }
                    } label: {
                        Image(systemName: "square.grid.3x3.fill")
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(viewModel.isGridView ? Color.surface3 : Color.clear)
                    }
                }
                .foregroundColor(.appText)
                .background(Color.surface1)
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.appText.opacity(0.1), lineWidth: 1))
            }
            .padding(.horizontal)
            .padding(.vertical, 8)
        }
        .background(Color.appBg)
    }
    
    private var quickActions: some View {
        HStack(spacing: 12) {
            Button {
                dismiss() // This assumes we came from CaptureView
            } label: {
                HStack {
                    Image(systemName: "camera.fill")
                    Text("Resume shooting")
                }
                .font(.custom("InterTight-Bold", size: 14))
                .foregroundColor(.black)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(Color.accent)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            
            PhotosPicker(
                selection: $viewModel.selectedPhotosPickerItems,
                matching: .images,
                photoLibrary: .shared()
            ) {
                HStack {
                    Image(systemName: "plus.circle.fill")
                    Text("Add from gallery")
                }
                .font(.custom("InterTight-Bold", size: 14))
                .foregroundColor(.appText)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(Color.surface1)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .accessibilityIdentifier("addFromGalleryButton")
        }
        .padding(.horizontal)
        .padding(.vertical, 12)
    }
    
    private var stripView: some View {
        LazyVStack(spacing: 12) {
            ForEach(Array(viewModel.exposures.enumerated()), id: \.element.id) { index, exposure in
                NavigationLink(value: exposure) {
                    ExposureStripCard(
                        exposure: exposure,
                        onCopyPrevious: {
                            viewModel.copyPrevious(to: exposure)
                        },
                        onDelete: {
                            exposureToDelete = exposure
                            showingDeleteConfirmation = true
                        },
                        isFirst: index == 0
                    )
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal)
    }
    
    private var gridView: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 4) {
            ForEach(viewModel.exposures) { exposure in
                NavigationLink(value: exposure) {
                    ExposureGridCell(exposure: exposure)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 4)
    }
    
    private var filmLeader: some View {
        VStack(spacing: 8) {
            let remaining = viewModel.roll.totalExposures - viewModel.exposures.count
            if remaining > 0 {
                Text("\(remaining) EXPOSURES REMAINING")
                    .font(.custom("JetBrainsMono-Bold", size: 12))
                    .foregroundColor(Color(hex: Constants.Design.dim))
                    .padding(.vertical, 40)
                    .frame(maxWidth: .infinity)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(style: StrokeStyle(lineWidth: 1, dash: [5, 5]))
                            .foregroundColor(Color(hex: Constants.Design.dim).opacity(0.3))
                    )
                    .padding(.horizontal)
            }
        }
        .padding(.top, 20)
        .padding(.bottom, 40)
    }
}

