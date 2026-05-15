import SwiftUI
import SwiftData

struct LensPickerSheet: View {
    @Binding var selectedLens: Lens?
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    
    @Query(sort: \Lens.name) private var lenses: [Lens]
    
    var body: some View {
        VStack(spacing: 0) {
            GrabberBar()
            
            Text("SELECT LENS")
                .font(.custom("InterTight-Bold", size: 14))
                .foregroundColor(.white.opacity(0.6))
                .padding(.vertical, 20)
            
            ScrollView {
                VStack(spacing: 0) {
                    // No Lens option
                    lensRow(lens: nil)
                    
                    ForEach(lenses) { lens in
                        Divider().background(.white.opacity(0.1))
                        lensRow(lens: lens)
                    }
                }
                .background(Color(hex: Constants.Design.surface2))
                .cornerRadius(12)
                .padding(.horizontal)
            }
            .frame(maxHeight: 400)
            
            Spacer().frame(height: 30)
        }
        .background(Color(hex: Constants.Design.surface1))
    }
    
    private func lensRow(lens: Lens?) -> some View {
        Button {
            selectedLens = lens
            dismiss()
        } label: {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(lens?.name ?? "No lens")
                        .font(.custom("InterTight-Medium", size: 16))
                        .foregroundColor(.white)
                    
                    if let l = lens {
                        Text(lensMetadata(l))
                            .font(.custom("JetBrainsMono-Medium", size: 12))
                            .foregroundColor(.white.opacity(0.5))
                    }
                }
                
                Spacer()
                
                if selectedLens?.id == lens?.id {
                    Image(systemName: "checkmark")
                        .foregroundColor(Color(hex: Constants.Design.accent))
                }
            }
            .padding(.vertical, 16)
            .padding(.horizontal, 16)
            .contentShape(Rectangle())
        }
    }
    
    private func lensMetadata(_ lens: Lens) -> String {
        let focal = lens.isZoom ? "\(lens.focalLengthMin!)-\(lens.focalLengthMax!)mm" : "\(lens.focalLength!)mm"
        return "\(focal) · \(lens.maxAperture)"
    }
}
