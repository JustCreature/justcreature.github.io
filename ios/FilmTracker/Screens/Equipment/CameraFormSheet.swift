import SwiftUI
import SwiftData

struct CameraFormSheet: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    
    var camera: Camera? // nil for create, non-nil for edit
    
    @State private var make: String = ""
    @State private var model: String = ""
    
    var isReady: Bool {
        !make.trimmingCharacters(in: .whitespaces).isEmpty &&
        !model.trimmingCharacters(in: .whitespaces).isEmpty
    }
    
    init(camera: Camera? = nil) {
        self.camera = camera
        _make = State(initialValue: camera?.make ?? "")
        _model = State(initialValue: camera?.model ?? "")
    }
    
    var body: some View {
        BottomSheet(isPresented: .constant(true), title: camera == nil ? "New camera" : "Edit camera") {
            VStack(spacing: 24) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("MAKE")
                        .font(.appMono(10))
                        .foregroundColor(.muted)
                    
                    TextField("Nikon", text: $make)
                        .padding()
                        .background(Color.surface2)
                        .cornerRadius(Constants.Design.radiusMD)
                        .foregroundColor(.appText)
                        .tint(.accent)
                        .accessibilityIdentifier("cameraMakeInput")
                }
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("MODEL")
                        .font(.appMono(10))
                        .foregroundColor(.muted)
                    
                    TextField("FE", text: $model)
                        .padding()
                        .background(Color.surface2)
                        .cornerRadius(Constants.Design.radiusMD)
                        .foregroundColor(.appText)
                        .tint(.accent)
                        .accessibilityIdentifier("cameraModelInput")
                }
                
                AppButton(title: camera == nil ? "Add camera" : "Save changes", isDisabled: !isReady) {
                    save()
                }
                .padding(.top, 8)
                .accessibilityIdentifier("confirmCameraFormButton")
            }
        }
        .presentationDetents([.medium, .large])
        .presentationBackground(.clear)
    }
    
    private func save() {
        if let camera = camera {
            camera.make = make
            camera.model = model
            camera.name = "\(make) \(model)"
        } else {
            let newCamera = Camera(make: make, model: model)
            modelContext.insert(newCamera)
        }
        dismiss()
    }
}

#Preview {
    CameraFormSheet()
        .modelContainer(for: Camera.self, inMemory: true)
}
