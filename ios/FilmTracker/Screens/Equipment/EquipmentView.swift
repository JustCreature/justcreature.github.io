import SwiftUI
import SwiftData

struct EquipmentView: View {
    @Environment(\.modelContext) private var modelContext
    @State private var selectedSegment = 0
    @State private var showingAddSheet = false
    
    var body: some View {
        ZStack {
            Color.appBg.ignoresSafeArea()
            
            VStack(spacing: 0) {
                headerView
                
                segmentPicker
                
                if selectedSegment == 0 {
                    CameraListView()
                } else {
                    LensListView()
                }
                
                Spacer()
            }
        }
        .navigationTitle("Equipment")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button {
                    showingAddSheet = true
                } label: {
                    Image(systemName: "plus")
                        .foregroundColor(.accent)
                }
                .accessibilityIdentifier("addEquipmentButton")
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
