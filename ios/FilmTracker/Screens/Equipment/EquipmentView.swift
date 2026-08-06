import SwiftUI
import SwiftData

struct EquipmentView: View {
    @Environment(\.modelContext) private var modelContext
    @State private var selectedSegment = 0
    @State private var showingAddSheet = false
    
    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            Color.appBg.ignoresSafeArea()
            
            VStack(spacing: 0) {
                headerView
                
                segmentPicker
                
                if selectedSegment == 0 {
                    CameraListView(onAdd: { showingAddSheet = true })
                } else {
                    LensListView(onAdd: { showingAddSheet = true })
                }
                
                Spacer()
            }
            
            // FAB
            Button {
                showingAddSheet = true
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
            .accessibilityIdentifier("addEquipmentFAB")
        }
        .navigationTitle("Equipment")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                NavigationLink(destination: SettingsView()) {
                    Image(systemName: "gearshape")
                        .foregroundColor(.appText)
                }
            }
        }
        .sheet(isPresented: $showingAddSheet) {
            if selectedSegment == 0 {
                CameraFormSheet()
            } else {
                LensFormSheet()
            }
        }
    }
    
    private var headerView: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("GEAR")
                .font(.appMono(10))
                .foregroundColor(.muted)
            Text("Equipment")
                .font(.appHeadline(28))
                .foregroundColor(.appText)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 20)
        .padding(.top, 10)
    }
    
    private var segmentPicker: some View {
        HStack(spacing: 0) {
            segmentButton(title: "Cameras", index: 0)
            segmentButton(title: "Lenses", index: 1)
        }
        .padding(.horizontal, 20)
        .padding(.top, 20)
        .padding(.bottom, 10)
    }
    
    private func segmentButton(title: String, index: Int) -> some View {
        Button {
            selectedSegment = index
        } label: {
            VStack(spacing: 8) {
                Text(title)
                    .font(.appLabel(16))
                    .foregroundColor(selectedSegment == index ? .appText : .muted)
                
                Rectangle()
                    .fill(selectedSegment == index ? Color.accent : Color.clear)
                    .frame(height: 2)
            }
        }
        .frame(maxWidth: .infinity)
        .accessibilityIdentifier("segmentButton_\(index)")
    }
}

#Preview {
    NavigationStack {
        EquipmentView()
            .modelContainer(for: [Camera.self, Lens.self], inMemory: true)
    }
}
