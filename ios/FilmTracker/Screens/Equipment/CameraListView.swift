import SwiftUI
import SwiftData

struct CameraListView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Camera.createdAt, order: .reverse) private var cameras: [Camera]
    
    @State private var cameraToEdit: Camera?
    @State private var cameraToDelete: Camera?
    
    let onAdd: () -> Void
    
    var body: some View {
        Group {
            if cameras.isEmpty {
                EmptyStateView(
                    iconName: "camera",
                    title: "No cameras",
                    bodyText: "Add your camera bodies to track which one shot each roll.",
                    actionTitle: "Add Camera"
                ) {
                    onAdd()
                }
                .padding(.top, 40)
            } else {
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(cameras) { camera in
                            EntityRow(
                                title: camera.name,
                                subtitle: "\(camera.make.uppercased())",
                                iconName: "camera",
                                menuActions: AnyView(
                                    Group {
                                        Button("Edit") {
                                            cameraToEdit = camera
                                        }
                                        Button("Delete", role: .destructive) {
                                            cameraToDelete = camera
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
        .sheet(item: $cameraToEdit) { camera in
            CameraFormSheet(camera: camera)
        }
        .sheet(item: $cameraToDelete) { camera in
            ConfirmationSheet(
                title: "Delete Camera?",
                message: "Are you sure you want to delete \(camera.name)? This action cannot be undone.",
                onConfirm: {
                    modelContext.delete(camera)
                    cameraToDelete = nil
                },
                onCancel: {
                    cameraToDelete = nil
                }
            )
            .presentationDetents([.height(250)])
            .presentationBackground(.clear)
        }
    }
}

extension Camera: Identifiable {} // SwiftData @Model is already Identifiable but let's be explicit if needed

#Preview {
    ZStack {
        Color.appBg.ignoresSafeArea()
        CameraListView(onAdd: {})
            .modelContainer(for: Camera.self, inMemory: true)
    }
}
