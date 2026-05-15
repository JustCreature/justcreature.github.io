import SwiftUI
import SwiftData

struct LensListView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Lens.createdAt, order: .reverse) private var lenses: [Lens]
    
    @State private var lensToEdit: Lens?
    @State private var lensToDelete: Lens?
    
    var body: some View {
        Group {
            if lenses.isEmpty {
                EmptyStateView(
                    iconName: "circle.circle",
                    title: "No lenses",
                    bodyText: "Add lenses to track focal length and maximum aperture per shot.",
                    actionTitle: "Add Lens"
                ) {
                }
                .padding(.top, 40)
            } else {
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(lenses) { lens in
                            EntityRow(
                                title: lens.name,
                                subtitle: formatSubtitle(lens),
                                iconName: "circle.circle",
                                menuActions: AnyView(
                                    Group {
                                        Button("Edit") {
                                            lensToEdit = lens
                                        }
                                        Button("Delete", role: .destructive) {
                                            lensToDelete = lens
                                        }
                                    }
                                )
                            )
                        }
                    }
                    .padding(20)
                }
            }
        }
        .sheet(item: $lensToEdit) { lens in
            LensFormSheet(lens: lens)
        }
        .sheet(item: $lensToDelete) { lens in
            ConfirmationSheet(
                title: "Delete Lens?",
                message: "Are you sure you want to delete \(lens.name)? This action cannot be undone.",
                onConfirm: {
                    modelContext.delete(lens)
                    lensToDelete = nil
                },
                onCancel: {
                    lensToDelete = nil
                }
            )
            .presentationDetents([.height(250)])
            .presentationBackground(.clear)
        }
    }
    
    private func formatSubtitle(_ lens: Lens) -> String {
        let focal = lens.isZoom 
            ? "\(lens.focalLengthMin ?? 0)-\(lens.focalLengthMax ?? 0)mm"
            : "\(lens.focalLength ?? 0)mm"
        return "\(focal) · \(lens.maxAperture)"
    }
}

extension Lens: Identifiable {}

#Preview {
    ZStack {
        Color.appBg.ignoresSafeArea()
        LensListView()
            .modelContainer(for: Lens.self, inMemory: true)
    }
}
