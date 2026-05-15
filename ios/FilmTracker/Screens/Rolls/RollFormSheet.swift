import SwiftUI
import SwiftData

struct RollFormSheet: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    
    var roll: FilmRoll? // Nil for create
    
    @Query private var cameras: [Camera]
    @Query private var lenses: [Lens]
    
    @State private var name: String = ""
    @State private var iso: Int = 400
    @State private var ei: Int? = nil
    @State private var totalExposures: Int = 36
    @State private var cameraId: String? = nil
    @State private var currentLensId: String? = nil
    @State private var tag: String = ""
    
    @State private var customExposures: String = ""
    @State private var isCustomExposures: Bool = false
    
    let filmPresets = [
        (name: "Kodak Portra 400", iso: 400),
        (name: "Kodak Portra 160", iso: 160),
        (name: "Fuji Superia 400", iso: 400),
        (name: "Ilford HP5 Plus", iso: 400),
        (name: "Kodak Tri-X 400", iso: 400),
        (name: "Cinestill 800T", iso: 800)
    ]
    
    let exposureOptions = [12, 24, 36]
    
    var isReady: Bool {
        !name.trimmingCharacters(in: .whitespaces).isEmpty
    }
    
    init(roll: FilmRoll? = nil) {
        self.roll = roll
        if let roll = roll {
            _name = State(initialValue: roll.name)
            _iso = State(initialValue: roll.iso)
            _ei = State(initialValue: roll.ei)
            _totalExposures = State(initialValue: roll.totalExposures)
            _cameraId = State(initialValue: roll.cameraId)
            _currentLensId = State(initialValue: roll.currentLensId)
            _tag = State(initialValue: roll.tag ?? "")
            
            if ![12, 24, 36].contains(roll.totalExposures) {
                _isCustomExposures = State(initialValue: true)
                _customExposures = State(initialValue: "\(roll.totalExposures)")
            }
        }
    }
    
    var body: some View {
        BottomSheet(isPresented: .constant(true), title: roll == nil ? "New film roll" : "Edit roll") {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Presets
                    if roll == nil {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("PRESETS")
                                .font(.appMono(10))
                                .foregroundColor(.muted)
                            
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 8) {
                                    ForEach(filmPresets, id: \.name) { preset in
                                        AppChip(title: preset.name, isSelected: name == preset.name) {
                                            name = preset.name
                                            iso = preset.iso
                                        }
                                        .accessibilityIdentifier("preset_\(preset.name.replacingOccurrences(of: " ", with: "_"))")
                                    }
                                }
                            }
                        }
                    }
                    
                    // Name
                    VStack(alignment: .leading, spacing: 8) {
                        Text("ROLL NAME")
                            .font(.appMono(10))
                            .foregroundColor(.muted)
                        
                        TextField("e.g. Vacations 2024", text: $name)
                            .padding()
                            .background(Color.surface2)
                            .cornerRadius(Constants.Design.radiusMD)
                            .foregroundColor(.appText)
                            .tint(.accent)
                            .accessibilityIdentifier("rollNameInput")
                    }
                    
                    // Tag (Optional)
                    VStack(alignment: .leading, spacing: 8) {
                        Text("TAG (OPTIONAL)")
                            .font(.appMono(10))
                            .foregroundColor(.muted)
                        
                        TextField("e.g. PORTRA", text: $tag)
                            .padding()
                            .background(Color.surface2)
                            .cornerRadius(Constants.Design.radiusMD)
                            .foregroundColor(.appText)
                            .tint(.accent)
                            .accessibilityIdentifier("rollTagInput")
                    }
                    
                    // ISO & Exposures
                    HStack(spacing: 16) {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("ISO")
                                .font(.appMono(10))
                                .foregroundColor(.muted)
                            
                            Menu {
                                ForEach(Constants.eiValues, id: \.self) { value in
                                    Button("\(value)") { iso = value }
                                }
                            } label: {
                                HStack {
                                    Text("\(iso)")
                                        .font(.appMono())
                                    Spacer()
                                    Image(systemName: "chevron.down")
                                        .font(.system(size: 12))
                                }
                                .padding()
                                .background(Color.surface2)
                                .cornerRadius(Constants.Design.radiusMD)
                                .foregroundColor(.appText)
                            }
                            .accessibilityIdentifier("isoMenu")
                        }
                        
                        VStack(alignment: .leading, spacing: 8) {
                            Text("EXPOSURES")
                                .font(.appMono(10))
                                .foregroundColor(.muted)
                            
                            HStack(spacing: 4) {
                                ForEach(exposureOptions, id: \.self) { opt in
                                    AppChip(title: "\(opt)", isSelected: !isCustomExposures && totalExposures == opt) {
                                        totalExposures = opt
                                        isCustomExposures = false
                                    }
                                    .accessibilityIdentifier("exp_\(opt)")
                                }
                                AppChip(title: "Custom", isSelected: isCustomExposures) {
                                    isCustomExposures = true
                                }
                                .accessibilityIdentifier("exp_custom")
                            }
                        }
                    }
                    
                    if isCustomExposures {
                        TextField("Count", text: $customExposures)
                            .keyboardType(.numberPad)
                            .padding()
                            .background(Color.surface2)
                            .cornerRadius(Constants.Design.radiusMD)
                            .foregroundColor(.appText)
                            .accessibilityIdentifier("customExposuresInput")
                    }
                    
                    // EI
                    VStack(alignment: .leading, spacing: 8) {
                        Text("EI (EXPOSURE INDEX)")
                            .font(.appMono(10))
                            .foregroundColor(.muted)
                        
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                AppChip(title: "None", isSelected: ei == nil) {
                                    ei = nil
                                }
                                .accessibilityIdentifier("ei_none")
                                ForEach(Constants.eiValues, id: \.self) { value in
                                    AppChip(title: "\(value)", isSelected: ei == value) {
                                        ei = value
                                    }
                                    .accessibilityIdentifier("ei_\(value)")
                                }
                            }
                        }
                    }
                    
                    // Camera
                    VStack(alignment: .leading, spacing: 8) {
                        Text("CAMERA")
                            .font(.appMono(10))
                            .foregroundColor(.muted)
                        
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                AppChip(title: "None", isSelected: cameraId == nil) {
                                    cameraId = nil
                                }
                                .accessibilityIdentifier("camera_none")
                                ForEach(cameras) { camera in
                                    AppChip(title: camera.name, isSelected: cameraId == camera.id) {
                                        cameraId = camera.id
                                    }
                                    .accessibilityIdentifier("camera_\(camera.id)")
                                }
                            }
                        }
                    }
                    
                    // Lens
                    VStack(alignment: .leading, spacing: 8) {
                        Text("LENS")
                            .font(.appMono(10))
                            .foregroundColor(.muted)
                        
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                AppChip(title: "None", isSelected: currentLensId == nil) {
                                    currentLensId = nil
                                }
                                .accessibilityIdentifier("lens_none")
                                ForEach(lenses) { lens in
                                    AppChip(title: lens.name, isSelected: currentLensId == lens.id) {
                                        currentLensId = lens.id
                                    }
                                    .accessibilityIdentifier("lens_\(lens.id)")
                                }
                            }
                        }
                    }
                    
                    AppButton(title: roll == nil ? "Start shooting" : "Save changes", isDisabled: !isReady) {
                        save()
                    }
                    .padding(.top, 8)
                    .accessibilityIdentifier("confirmRollFormButton")
                }
                .padding(.horizontal, 4)
            }
        }
        .presentationDetents([.large])
        .presentationBackground(.clear)
    }
    
    private func save() {
        let finalExposures = isCustomExposures ? (Int(customExposures) ?? totalExposures) : totalExposures
        let cleanedTag = tag.trimmingCharacters(in: .whitespaces).isEmpty ? nil : tag
        
        if let roll = roll {
            roll.name = name
            roll.iso = iso
            roll.ei = ei
            roll.totalExposures = finalExposures
            roll.cameraId = cameraId
            roll.currentLensId = currentLensId
            roll.tag = cleanedTag
        } else {
            let newRoll = FilmRoll(name: name, iso: iso, ei: ei, totalExposures: finalExposures, cameraId: cameraId, currentLensId: currentLensId, tag: cleanedTag)
            modelContext.insert(newRoll)
        }
        dismiss()
    }
}
