import SwiftUI

struct FocalLengthOverlay: View {
    let currentFocalLength: Int
    
    private let focalPoints = [15, 24, 35, 50, 85, 135, 200]
    
    var body: some View {
        VStack(spacing: 8) {
            ZStack(alignment: .bottom) {
                // Ruler line
                Rectangle()
                    .fill(.white.opacity(0.2))
                    .frame(height: 1)
                
                // Tick marks
                HStack(alignment: .bottom, spacing: 0) {
                    ForEach(focalPoints, id: \.self) { point in
                        VStack(spacing: 4) {
                            Text("\(point)")
                                .font(.custom("JetBrainsMono-Medium", size: 8))
                                .foregroundColor(currentFocalLength == point ? Color(hex: Constants.Design.accent) : .white.opacity(0.4))
                            
                            Rectangle()
                                .fill(currentFocalLength == point ? Color(hex: Constants.Design.accent) : .white.opacity(0.3))
                                .frame(width: 1, height: currentFocalLength == point ? 12 : 6)
                        }
                        if point != focalPoints.last { Spacer() }
                    }
                }
                
                // Active thumb
                GeometryReader { geo in
                    let x = xOffset(for: currentFocalLength, in: geo.size.width)
                    Circle()
                        .fill(Color(hex: Constants.Design.accent))
                        .frame(width: 8, height: 8)
                        .shadow(color: Color(hex: Constants.Design.accent).opacity(0.5), radius: 4)
                        .offset(x: x - 4, y: geo.size.height - 4)
                }
                .frame(height: 12)
            }
            .frame(height: 30)
            
            Text("\(currentFocalLength)mm")
                .font(.custom("JetBrainsMono-Bold", size: 12))
                .foregroundColor(Color(hex: Constants.Design.accent))
        }
        .padding(.horizontal, 40)
    }
    
    private func xOffset(for focal: Int, in width: CGFloat) -> CGFloat {
        guard let first = focalPoints.first, let last = focalPoints.last else { return 0 }
        // Non-linear mapping could be better, but let's do simple linear for now
        let range = CGFloat(last - first)
        let progress = CGFloat(focal - first) / range
        return progress * width
    }
}
