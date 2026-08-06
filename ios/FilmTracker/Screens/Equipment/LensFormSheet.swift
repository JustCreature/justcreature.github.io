import SwiftUI
import SwiftData

struct LensFormSheet: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    
    var lens: Lens? // nil for create, non-nil for edit
    
    @State private var name: String = ""
    @State private var maxAperture: String = "f/2"
    @State private var isZoom: Bool = false
    @State private var focalLength: String = ""
    @State private var focalLengthMin: String = ""
    @State private var focalLengthMax: String = ""
    
    var isReady: Bool {
        guard !name.trimmingCharacters(in: .whitespaces).isEmpty else { return false }
        if isZoom {
            guard let min = Int(focalLengthMin), let max = Int(focalLengthMax) else { return false }
            return min < max
        } else {
            return Int(focalLength) != nil
        }
    }
    
    init(lens: Lens? = nil) {
        self.lens = lens
        _name = State(initialValue: lens?.name ?? "")
        _maxAperture = State(initialValue: lens?.maxAperture ?? "f/2")
        _isZoom = State(initialValue: lens?.isZoom ?? false)
        _focalLength = State(initialValue: lens?.focalLength.map(String.init) ?? "")
        _focalLengthMin = State(initialValue: lens?.focalLengthMin.map(String.init) ?? "")
        _focalLengthMax = State(initialValue: lens?.focalLengthMax.map(String.init) ?? "")
    }
    
    var body: some View {
        BottomSheet(isPresented: .constant(true), title: lens == nil ? "New lens" : "Edit lens") {
            ScrollView {
                VStack(spacing: 24) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("LENS NAME")
                            .font(.appMono(10))
                            .foregroundColor(.muted)
                        
                        TextField("Summicron 50mm", text: $name)
                            .padding()
                            .background(Color.surface2)
                            .cornerRadius(Constants.Design.radiusMD)
                            .foregroundColor(.appText)
                            .tint(.accent)
                            .accessibilityIdentifier("lensNameInput")
                    }
                    
                    VStack(alignment: .leading, spacing: 8) {
                        Text("MAX APERTURE")
                            .font(.appMono(10))
                            .foregroundColor(.muted)
                        
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(Constants.apertures, id: \.self) { aperture in
                                    AppChip(
                                        title: aperture,
                                        isSelected: maxAperture == aperture
                                    ) {
                                        maxAperture = aperture
                                    }
                                }
                            }
                        }
                    }
                    
                    VStack(alignment: .leading, spacing: 8) {
                        Text("TYPE")
                            .font(.appMono(10))
                            .foregroundColor(.muted)
                        
                        HStack(spacing: 0) {
                            Button { isZoom = false } label: {
                                Text("Prime")
                                    .font(.appLabel(14))
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 10)
                                    .background(!isZoom ? Color.surface3 : Color.surface2)
                                    .foregroundColor(!isZoom ? .appText : .muted)
                            }
                            .accessibilityIdentifier("lensTypePrime")
                            
                            Button { isZoom = true } label: {
                                Text("Zoom")
                                    .font(.appLabel(14))
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 10)
                                    .background(isZoom ? Color.surface3 : Color.surface2)
                                    .foregroundColor(isZoom ? .appText : .muted)
                            }
                            .accessibilityIdentifier("lensTypeZoom")
                        }
                        .cornerRadius(Constants.Design.radiusSM)
                    }
                    
                    if !isZoom {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("FOCAL LENGTH (mm)")
                                .font(.appMono(10))
                                .foregroundColor(.muted)
                            
                            TextField("50", text: $focalLength)
                                .keyboardType(.numberPad)
                                .padding()
                                .background(Color.surface2)
                                .cornerRadius(Constants.Design.radiusMD)
                                .foregroundColor(.appText)
                                .tint(.accent)
                                .accessibilityIdentifier("lensFocalInput")
                        }
                    } else {
                        HStack(spacing: 16) {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("MIN (mm)")
                                    .font(.appMono(10))
                                    .foregroundColor(.muted)
                                
                                TextField("24", text: $focalLengthMin)
                                    .keyboardType(.numberPad)
                                    .padding()
                                    .background(Color.surface2)
                                    .cornerRadius(Constants.Design.radiusMD)
                                    .foregroundColor(.appText)
                                    .tint(.accent)
                                    .accessibilityIdentifier("lensFocalMinInput")
                            }
                            
                            VStack(alignment: .leading, spacing: 8) {
                                Text("MAX (mm)")
                                    .font(.appMono(10))
                                    .foregroundColor(.muted)
                                
                                TextField("70", text: $focalLengthMax)
                                    .keyboardType(.numberPad)
                                    .padding()
                                    .background(Color.surface2)
                                    .cornerRadius(Constants.Design.radiusMD)
                                    .foregroundColor(.appText)
                                    .tint(.accent)
                                    .accessibilityIdentifier("lensFocalMaxInput")
                            }
                        }
                    }
                    
                    AppButton(title: lens == nil ? "Add lens" : "Save changes", isDisabled: !isReady) {
                        save()
                    }
                    .padding(.top, 8)
                    .accessibilityIdentifier("confirmLensFormButton")
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationBackground(.clear)
    }
    
    private func save() {
        if let lens = lens {
            lens.name = name
            lens.maxAperture = maxAperture
            lens.focalLength = isZoom ? nil : Int(focalLength)
            lens.focalLengthMin = isZoom ? Int(focalLengthMin) : nil
            lens.focalLengthMax = isZoom ? Int(focalLengthMax) : nil
        } else {
            let newLens = Lens(
                name: name,
                maxAperture: maxAperture,
                focalLength: isZoom ? nil : Int(focalLength),
                focalLengthMin: isZoom ? Int(focalLengthMin) : nil,
                focalLengthMax: isZoom ? Int(focalLengthMax) : nil
            )
            modelContext.insert(newLens)
        }
        dismiss()
    }
}

#Preview {
    LensFormSheet()
        .modelContainer(for: Lens.self, inMemory: true)
}
