import SwiftUI
import SwiftData

struct RollCard: View {
    let roll: FilmRoll
    let onEdit: () -> Void
    let onDelete: () -> Void
    
    @Query private var exposures: [Exposure]
    @Query private var cameras: [Camera]
    @Query private var lenses: [Lens]
    
    init(roll: FilmRoll, onEdit: @escaping () -> Void, onDelete: @escaping () -> Void) {
        self.roll = roll
        self.onEdit = onEdit
        self.onDelete = onDelete
        
        let rollId = roll.id
        _exposures = Query(filter: #Predicate<Exposure> { $0.filmRollId == rollId }, sort: \.exposureNumber, order: .reverse)
    }
    
    private var lastExposureImage: UIImage? {
        if let data = exposures.first?.imageData {
            return UIImage(data: data)
        }
        return nil
    }
    
    private var cameraName: String? {
        cameras.first(where: { $0.id == roll.cameraId })?.name
    }
    
    private var lensName: String? {
        lenses.first(where: { $0.id == roll.currentLensId })?.name
    }
    
    private var progress: Double {
        guard roll.totalExposures > 0 else { return 0 }
        return Double(exposures.count) / Double(roll.totalExposures)
    }
    
    var body: some View {
        AppCard {
            HStack(spacing: 16) {
                // Left: Thumbnail
                ZStack(alignment: .topLeading) {
                    if let image = lastExposureImage {
                        Image(uiImage: image)
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                            .frame(width: 96, height: 96)
                            .clipped()
                    } else {
                        Rectangle()
                            .fill(Color.surface2)
                            .frame(width: 96, height: 96)
                            .overlay(
                                Image(systemName: "film")
                                    .font(.system(size: 32))
                                    .foregroundColor(.dim)
                            )
                    }
                    
                    Text("\(exposures.count)")
                        .font(.appMono(12))
                        .fontWeight(.bold)
                        .padding(4)
                        .background(Color.black.opacity(0.6))
                        .foregroundColor(.accent)
                        .cornerRadius(4)
                        .padding(4)
                }
                .frame(width: 96, height: 96)
                .cornerRadius(Constants.Design.radiusMD)
                
                // Right: Details
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        if let tag = roll.tag {
                            AppChip(title: tag.uppercased(), variant: .accentGlow)
                        }
                        
                        Text(roll.name)
                            .font(.appHeadline(18))
                            .foregroundColor(.appText)
                            .lineLimit(1)
                        
                        Spacer()
                        
                        Menu {
                            Button(action: onEdit) {
                                Label("Edit", systemImage: "pencil")
                            }
                            .accessibilityIdentifier("rollCardEditButton")
                            
                            Button(role: .destructive, action: onDelete) {
                                Label("Delete", systemImage: "trash")
                            }
                            .accessibilityIdentifier("rollCardDeleteButton")
                        } label: {
                            Image(systemName: "ellipsis")
                                .padding(8)
                                .foregroundColor(.muted)
                                .contentShape(Rectangle())
                                .accessibilityIdentifier("rollCardMoreMenu")
                        }
                    }
                    
                    // Metadata line
                    Text(metadataString)
                        .font(.appMono(11))
                        .foregroundColor(.muted)
                        .lineLimit(1)
                    
                    Spacer()
                    
                    // Progress
                    VStack(alignment: .leading, spacing: 4) {
                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                Rectangle()
                                    .fill(Color.surface3)
                                    .frame(height: 2)
                                
                                Rectangle()
                                    .fill(Color.accent)
                                    .frame(width: geo.size.width * min(progress, 1.0), height: 2)
                            }
                        }
                        .frame(height: 2)
                        
                        HStack {
                            Text("\(exposures.count)/\(roll.totalExposures)")
                                .font(.appMono(11))
                            Spacer()
                            Text("\(Int(progress * 100))%")
                                .font(.appMono(11))
                        }
                        .foregroundColor(.muted)
                    }
                }
            }
            .padding(12)
        }
        .padding(.horizontal)
    }
    
    private var metadataString: String {
        var components: [String] = ["ISO \(roll.iso)"]
        if let ei = roll.ei {
            components.append("EI \(ei)")
        }
        if let camera = cameraName {
            components.append(camera)
        }
        if let lens = lensName {
            components.append(lens)
        }
        return components.joined(separator: " · ")
    }
}
