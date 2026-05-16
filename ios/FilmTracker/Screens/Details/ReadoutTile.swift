import SwiftUI

struct ReadoutTile: View {
    let label: String
    let value: String
    let isDimmed: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label.uppercased())
                .font(.custom("InterTight-Medium", size: 10))
                .foregroundColor(Color(hex: Constants.Design.muted))
            
            Text(value)
                .font(.custom("JetBrainsMono-Bold", size: 20))
                .foregroundColor(isDimmed ? Color(hex: Constants.Design.dim) : Color(hex: Constants.Design.accent))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(Color(hex: Constants.Design.surface1))
        .clipShape(RoundedRectangle(cornerRadius: Constants.Design.radiusMD))
        .overlay(
            RoundedRectangle(cornerRadius: Constants.Design.radiusMD)
                .stroke(Color.white.opacity(0.05), lineWidth: 1)
        )
    }
}
