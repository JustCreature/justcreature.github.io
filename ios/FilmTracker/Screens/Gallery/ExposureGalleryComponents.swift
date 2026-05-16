import SwiftUI
import SwiftData

struct ExposureStripCard: View {
    let exposure: Exposure
    let onCopyPrevious: () -> Void
    let onDelete: () -> Void
    let isFirst: Bool
    
    var body: some View {
        HStack(spacing: 12) {
            // Thumbnail
            ZStack(alignment: .topLeading) {
                if let data = exposure.imageData, let uiImage = UIImage(data: data) {
                    Image(uiImage: uiImage)
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .frame(width: 92, height: 92)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                } else {
                    RoundedRectangle(cornerRadius: 8)
                        .fill(LinearGradient(colors: [Color(hex: Constants.Design.surface2), Color(hex: Constants.Design.surface1)], startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(width: 92, height: 92)
                    
                    Image(systemName: "photo")
                        .foregroundColor(Color(hex: Constants.Design.dim))
                        .frame(width: 92, height: 92)
                }
                
                // Exposure Number Overlay
                Text("\(exposure.exposureNumber)")
                    .font(.custom("JetBrainsMono-Bold", size: 12))
                    .foregroundColor(.white)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(Color.black.opacity(0.6))
                    .clipShape(RoundedRectangle(cornerRadius: 4))
                    .padding(4)
            }
            
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text(exposure.capturedAt.formatted(date: .abbreviated, time: .shortened))
                        .font(.custom("JetBrainsMono-Regular", size: 10))
                        .foregroundColor(Color(hex: Constants.Design.muted))
                    
                    Spacer()
                    
                    if !isFirst {
                        Button(action: onCopyPrevious) {
                            Text("COPY PREV")
                                .font(.custom("JetBrainsMono-Bold", size: 10))
                                .foregroundColor(Color(hex: Constants.Design.accent))
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color(hex: Constants.Design.accent).opacity(0.1))
                                .clipShape(Capsule())
                        }
                    }
                }
                
                // EXIF Chips
                HStack(spacing: 8) {
                    ExifChip(text: exposure.aperture)
                    ExifChip(text: exposure.shutterSpeed)
                    if let focal = exposure.focalLength {
                        ExifChip(text: "\(focal)mm")
                    }
                }
                
                if let note = exposure.additionalInfo, !note.isEmpty {
                    Text(note)
                        .font(.custom("InterTight-Regular", size: 12))
                        .foregroundColor(Color(hex: Constants.Design.text))
                        .lineLimit(1)
                }
            }
            
            Spacer()
            
            // Delete button (visible on swipe usually, but adding a menu or button)
            Menu {
                Button(role: .destructive, action: onDelete) {
                    Label("Delete", systemImage: "trash")
                }
            } label: {
                Image(systemName: "ellipsis")
                    .foregroundColor(Color(hex: Constants.Design.dim))
                    .padding(8)
            }
        }
        .padding(12)
        .background(Color(hex: Constants.Design.surface1))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.white.opacity(0.05), lineWidth: 1)
        )
    }
}

struct ExifChip: View {
    let text: String
    
    var body: some View {
        Text(text)
            .font(.custom("JetBrainsMono-Bold", size: 10))
            .foregroundColor(Color(hex: Constants.Design.accent))
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background(Color(hex: Constants.Design.surface2))
            .clipShape(RoundedRectangle(cornerRadius: 4))
    }
}

struct ExposureGridCell: View {
    let exposure: Exposure
    
    var body: some View {
        ZStack(alignment: .bottomLeading) {
            if let data = exposure.imageData, let uiImage = UIImage(data: data) {
                Image(uiImage: uiImage)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(minWidth: 0, maxWidth: .infinity)
                    .aspectRatio(1, contentMode: .fill)
                    .clipped()
            } else {
                Rectangle()
                    .fill(LinearGradient(colors: [Color(hex: Constants.Design.surface2), Color(hex: Constants.Design.surface1)], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .aspectRatio(1, contentMode: .fill)
            }
            
            // Exposure Number (top-left)
            VStack {
                HStack {
                    Text("\(exposure.exposureNumber)")
                        .font(.custom("JetBrainsMono-Bold", size: 12))
                        .foregroundColor(.white)
                        .shadow(color: .black, radius: 2)
                        .padding(4)
                    Spacer()
                    
                    if exposure.location != nil {
                        Image(systemName: "location.fill")
                            .font(.system(size: 10))
                            .foregroundColor(.white)
                            .shadow(color: .black, radius: 2)
                            .padding(4)
                    }
                }
                Spacer()
            }
            
            // Aperture + Shutter (bottom-left)
            HStack(spacing: 4) {
                Text(exposure.aperture)
                Text("·")
                Text(exposure.shutterSpeed)
            }
            .font(.custom("JetBrainsMono-Bold", size: 10))
            .foregroundColor(.white)
            .shadow(color: .black, radius: 2)
            .padding(4)
        }
        .background(Color(hex: Constants.Design.surface1))
        .clipShape(RoundedRectangle(cornerRadius: 4))
    }
}
