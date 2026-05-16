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
                        .foregroundColor(selectedFilter == filter ? .black : .white)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(selectedFilter == filter ? Color.accent : Color.surface1)
                        .cornerRadius(Constants.Design.radiusPill)
                        .overlay(
                            Capsule()
                                .stroke(Color.white.opacity(0.1), lineWidth: 1)
                        )
                    }
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
    
    var filteredRolls: [FilmRoll] {
        allRolls.filter { roll in
            let exposureCount = allExposures.filter { $0.filmRollId == roll.id }.count
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
        counts[.active] = allRolls.filter { roll in
            allExposures.filter { $0.filmRollId == roll.id }.count < roll.totalExposures
        }.count
        counts[.complete] = allRolls.count - (counts[.active] ?? 0)
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
                let exposureCount = allExposures.filter { $0.filmRollId == roll.id }.count
                if exposureCount >= roll.totalExposures {
                    GalleryView(roll: roll, modelContext: modelContext)
                } else {
                    CaptureView(roll: roll, modelContext: modelContext)
                }
            }
            .navigationDestination(for: GalleryDestination.self) { destination in
                GalleryView(roll: destination.roll, modelContext: modelContext)
            }
            .navigationDestination(for: Exposure.self) { exposure in
                DetailsView(exposure: exposure, modelContext: modelContext)
            }
            .navigationTitle("Rolls")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        print("Import stub")
                    } label: {
                        Image(systemName: "square.and.arrow.down")
                            .foregroundColor(.accent)
                    }
                }
                
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        print("Settings stub")
                    } label: {
                        Image(systemName: "gearshape")
                            .foregroundColor(.white)
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
                    onImport: { print("Import stub") },
                    onResumeLast: {
                        if let lastRoll = allRolls.first {
                            navigationPath.append(lastRoll)
                        }
                    }
                )
                .presentationDetents([.height(340)])
                .presentationBackground(.clear)
            }
            .confirmationDialog("Delete Roll?", isPresented: $showingDeleteConfirmation, titleVisibility: .visible) {
                Button("Delete", role: .destructive) {
                    if let roll = rollToDelete {
                        deleteRoll(roll)
                    }
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("This will permanently remove the roll and all its exposures.")
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
