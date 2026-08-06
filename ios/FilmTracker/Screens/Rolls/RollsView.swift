import SwiftUI
import SwiftData

enum RollFilter: String, CaseIterable {
    case all = "All"
    case active = "Active"
    case complete = "Complete"
}

struct FilterPillsView: View {
    @Binding var selectedFilter: RollFilter
    let counts: [RollFilter: Int]
    
    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(RollFilter.allCases, id: \.self) { filter in
                    Button {
                        selectedFilter = filter
                    } label: {
                        HStack(spacing: 6) {
                            Text(filter.rawValue)
                            Text("\(counts[filter] ?? 0)")
                                .font(.appMono(10))
                                .opacity(0.6)
                        }
                        .font(.appHeadline(14))
                        .foregroundColor(selectedFilter == filter ? .black : .appText)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(selectedFilter == filter ? Color.accent : Color.surface1)
                        .cornerRadius(Constants.Design.radiusPill)
                        .overlay(
                            Capsule()
                                .stroke(Color.appText.opacity(0.1), lineWidth: 1)
                        )
                    }
                    .accessibilityIdentifier("filter_\(filter.rawValue.lowercased())")
                }
            }
            .padding(.horizontal)
        }
    }
}

struct GalleryDestination: Hashable {
    let roll: FilmRoll
}

struct RollsView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \FilmRoll.createdAt, order: .reverse) private var allRolls: [FilmRoll]
    @Query private var allExposures: [Exposure]
    
    @State private var selectedFilter: RollFilter = .all
    @State private var showingForm = false
    @State private var showingFABMenu = false
    @State private var rollToEdit: FilmRoll?
    @State private var rollToDelete: FilmRoll?
    @State private var showingDeleteConfirmation = false
    @State private var navigationPath = NavigationPath()
    
    // Import handling
    @State private var showingDocumentPicker = false
    @State private var documentPickerMode: UIDocumentPickerMode = .import
    @State private var importErrorMessage: String?
    @State private var showingImportError = false
    
    var filteredRolls: [FilmRoll] {
        allRolls.filter { roll in
            let rollId = roll.id
            let exposureCount = allExposures.filter { $0.filmRollId == rollId }.count
            switch selectedFilter {
            case .all: return true
            case .active: return exposureCount < roll.totalExposures
            case .complete: return exposureCount >= roll.totalExposures
            }
        }
    }
    
    var filterCounts: [RollFilter: Int] {
        var counts: [RollFilter: Int] = [:]
        counts[.all] = allRolls.count
        let activeCount = allRolls.filter { roll in
            let rollId = roll.id
            return allExposures.filter { $0.filmRollId == rollId }.count < roll.totalExposures
        }.count
        counts[.active] = activeCount
        counts[.complete] = allRolls.count - activeCount
        return counts
    }
    
    var body: some View {
        NavigationStack(path: $navigationPath) {
            ZStack(alignment: .bottomTrailing) {
                Color.appBg.ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // Filter Header
                    FilterPillsView(selectedFilter: $selectedFilter, counts: filterCounts)
                        .padding(.vertical, 12)
                    
                    if filteredRolls.isEmpty {
                        EmptyStateView(
                            iconName: "film",
                            title: "No rolls found",
                            bodyText: selectedFilter == .all ? "Start your photography journey by adding your first film roll." : "No rolls match the selected filter.",
                            actionTitle: "Add film roll",
                            action: {
                                showingForm = true
                            }
                        )
                        .padding(.top, 40)
                    } else {
                        ScrollView {
                            LazyVStack(spacing: 12) {
                                ForEach(filteredRolls) { roll in
                                    NavigationLink(value: roll) {
                                        RollCard(
                                            roll: roll,
                                            onEdit: { rollToEdit = roll },
                                            onDelete: { rollToDelete = roll; showingDeleteConfirmation = true }
                                        )
                                    }
                                    .buttonStyle(.plain)
                                    .accessibilityIdentifier(roll.name)
                                }
                            }
                            .padding(.vertical, 12)
                            .padding(.bottom, 80) // Space for FAB
                        }
                    }
                    
                    Spacer(minLength: 0)
                }
                
                // FAB
                Button {
                    showingFABMenu = true
                } label: {
                    Image(systemName: "plus")
                        .font(.system(size: 24, weight: .bold))
                        .foregroundColor(.black)
                        .frame(width: 60, height: 60)
                        .background(Color.accent)
                        .clipShape(Circle())
                        .shadow(color: Color.accent.opacity(0.3), radius: 10, x: 0, y: 5)
                }
                .padding(24)
                .accessibilityIdentifier("addRollFAB")
            }
            .navigationDestination(for: FilmRoll.self) { roll in
                let rollId = roll.id
                let exposureCount = allExposures.filter { $0.filmRollId == rollId }.count
                if exposureCount >= roll.totalExposures {
                    GalleryView(roll: roll, modelContext: modelContext, path: $navigationPath)
                } else {
                    CaptureView(roll: roll, modelContext: modelContext, path: $navigationPath)
                }
            }
            .navigationDestination(for: GalleryDestination.self) { destination in
                GalleryView(roll: destination.roll, modelContext: modelContext, path: $navigationPath)
            }
            .navigationDestination(for: Exposure.self) { exposure in
                DetailsView(exposure: exposure, modelContext: modelContext)
            }
            .navigationTitle("Rolls")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        showingDocumentPicker = true
                    } label: {
                        Image(systemName: "square.and.arrow.down")
                            .foregroundColor(.accent)
                    }
                }
                
                ToolbarItem(placement: .topBarTrailing) {
                    NavigationLink(destination: SettingsView()) {
                        Image(systemName: "gearshape")
                            .foregroundColor(.appText)
                    }
                }
            }
            .sheet(isPresented: $showingForm) {
                RollFormSheet(onSave: { newRoll in
                    navigationPath.append(newRoll)
                })
            }
            .sheet(item: $rollToEdit) { roll in
                RollFormSheet(roll: roll)
            }
            .sheet(isPresented: $showingFABMenu) {
                FABMenu(
                    onNewRoll: { showingForm = true },
                    onImport: { showingDocumentPicker = true },
                    onResumeLast: {
                        if let lastRoll = allRolls.first {
                            navigationPath.append(lastRoll)
                        }
                    }
                )
                .presentationDetents([.height(340)])
                .presentationBackground(.clear)
            }
            .sheet(isPresented: $showingDocumentPicker) {
                DocumentPicker { urls in
                    guard let url = urls.first else { return }
                    Task {
                        do {
                            if url.hasDirectoryPath {
                                try await ImportService.shared.importFromFolder(url: url, modelContext: modelContext)
                            } else {
                                try await ImportService.shared.importFromJSON(url: url, modelContext: modelContext)
                            }
                        } catch {
                            importErrorMessage = error.localizedDescription
                            showingImportError = true
                        }
                    }
                }
            }
            .alert("Import Failed", isPresented: $showingImportError) {
                Button("OK", role: .cancel) { }
            } message: {
                Text(importErrorMessage ?? "An unknown error occurred during import.")
            }
            .sheet(isPresented: $showingDeleteConfirmation) {
                ConfirmationSheet(
                    title: "Delete Roll?",
                    message: "This will permanently delete '\(rollToDelete?.name ?? "")' and all its exposures. This cannot be undone.",
                    confirmTitle: "Delete",
                    isDestructive: true,
                    onConfirm: {
                        if let roll = rollToDelete {
                            deleteRoll(roll)
                        }
                        showingDeleteConfirmation = false
                    },
                    onCancel: {
                        showingDeleteConfirmation = false
                    }
                )
                .presentationDetents([.height(300)])
            }

        }
    }
    
    private func deleteRoll(_ roll: FilmRoll) {
        let rollId = roll.id
        let exposuresToDelete = allExposures.filter { $0.filmRollId == rollId }
        for exposure in exposuresToDelete {
            modelContext.delete(exposure)
        }
        modelContext.delete(roll)
    }
}
