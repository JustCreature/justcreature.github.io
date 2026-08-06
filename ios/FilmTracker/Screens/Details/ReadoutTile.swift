import SwiftUI

struct ReadoutTile: View {
    let label: String
    let value: String
    let isDimmed: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label.uppercased())
                .font(.custom("InterTight-Medium", size: 10))
                .foregroundColor(.muted)
            
            Text(value)
                .font(.custom("JetBrainsMono-Bold", size: 20))
                .foregroundColor(isDimmed ? .dim : .accent)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(Color.surface1)
        .clipShape(RoundedRectangle(cornerRadius: Constants.Design.radiusMD))
        .overlay(
            RoundedRectangle(cornerRadius: Constants.Design.radiusMD)
                .stroke(Color.appText.opacity(0.05), lineWidth: 1)
        )
    }
}
