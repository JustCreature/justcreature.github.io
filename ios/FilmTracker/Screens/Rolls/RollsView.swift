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
                    AppChip(
                        title: "\(filter.rawValue) (\(counts[filter] ?? 0))",
                        isSelected: selectedFilter == filter
                    ) {
                        selectedFilter = filter
                    }
                    .accessibilityIdentifier("filter_\(filter.rawValue.lowercased())")
                }
            }
            .padding(.horizontal)
        }
    }
}

struct RollsView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \FilmRoll.createdAt, order: .reverse) private var allRolls: [FilmRoll]
    @Query private var allExposures: [Exposure]
    
    @State private var selectedFilter: RollFilter = .all
    @State private var showingForm = false
    @State private var showingFABMenu = false
    @State private var rollToEdit: FilmRoll? = nil
    @State private var rollToDelete: FilmRoll? = nil
    @State private var showingDeleteConfirmation = false
    
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
        var counts: [RollFilter: Int] = [.all: allRolls.count]
        
        let activeCount = allRolls.filter { roll in
            let count = allExposures.filter { $0.filmRollId == roll.id }.count
            return count < roll.totalExposures
        }.count
        
        counts[.active] = activeCount
        counts[.complete] = allRolls.count - activeCount
        
        return counts
    }
    
    var body: some View {
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
                                RollCard(
                                    roll: roll,
                                    onEdit: { rollToEdit = roll },
                                    onDelete: { rollToDelete = roll; showingDeleteConfirmation = true }
                                )
                                .onTapGesture {
                                    // Navigation to Capture or Gallery
                                    print("Tap roll: \(roll.name)")
                                }
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
        .navigationTitle("Rolls")
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                Button {
                    print("Import stub")
                } label: {
                    Image(systemName: "arrow.down.doc")
                }
            }
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    print("Settings stub")
                } label: {
                    Image(systemName: "gear")
                }
            }
        }
        .sheet(isPresented: $showingFABMenu) {
            FABMenu(
                onNewRoll: { showingForm = true },
                onImport: { print("Import stub") },
                onResumeLast: { print("Resume last stub") }
            )
            .presentationDetents([.height(340)])
            .presentationBackground(.clear)
        }
        .sheet(isPresented: $showingForm) {
            RollFormSheet()
        }
        .sheet(item: $rollToEdit) { roll in
            RollFormSheet(roll: roll)
        }
        .sheet(isPresented: $showingDeleteConfirmation) {
            if let roll = rollToDelete {
                ConfirmationSheet(
                    title: "Delete roll?",
                    message: "This will permanently remove '\(roll.name)' and all its exposures. This action cannot be undone.",
                    confirmTitle: "Delete roll",
                    isDestructive: true
                ) {
                    deleteRoll(roll)
                    showingDeleteConfirmation = false
                } onCancel: {
                    showingDeleteConfirmation = false
                }
                .presentationDetents([.height(280)])
            }
        }
    }
    
    private func deleteRoll(_ roll: FilmRoll) {
        let rollId = roll.id
        // Delete exposures
        let exposuresToDelete = allExposures.filter { $0.filmRollId == rollId }
        for exposure in exposuresToDelete {
            modelContext.delete(exposure)
        }
        modelContext.delete(roll)
    }
}

#Preview {
    NavigationStack {
        RollsView()
            .modelContainer(for: [FilmRoll.self, Exposure.self, Camera.self, Lens.self], inMemory: true)
    }
}
