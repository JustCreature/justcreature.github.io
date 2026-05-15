import SwiftUI

struct AppChip: View {
    enum Variant {
        case standard
        case accentGlow
        case ghost
    }
    
    var title: String
    var variant: Variant = .standard
    var isLarge: Bool = false
    var isMono: Bool = false
    
    var body: some View {
        Text(title)
            .font(isMono ? .appMono(isLarge ? 16 : 14) : .appLabel(isLarge ? 14 : 12))
            .padding(.horizontal, isLarge ? 16 : 10)
            .padding(.vertical, isLarge ? 8 : 4)
            .background(backgroundView)
            .foregroundColor(foregroundColor)
            .cornerRadius(Constants.Design.radiusPill)
            .overlay(
                RoundedRectangle(cornerRadius: Constants.Design.radiusPill)
                    .stroke(borderColor, lineWidth: 1)
            )
    }
    
    @ViewBuilder
    private var backgroundView: some View {
        switch variant {
        case .standard:
            Color.surface2
        case .accentGlow:
            Color.accent.opacity(0.15)
        case .ghost:
            Color.clear
        }
    }
    
    private var foregroundColor: Color {
        switch variant {
        case .standard:
            .appText
        case .accentGlow:
            .accent
        case .ghost:
            .muted
        }
    }
    
    private var borderColor: Color {
        switch variant {
        case .standard:
            .clear
        case .accentGlow:
            .accent.opacity(0.3)
        case .ghost:
            .dim
        }
    }
}

#Preview {
    HStack {
        AppChip(title: "ISO 400")
        AppChip(title: "f/8", variant: .accentGlow)
        AppChip(title: "1/125", variant: .ghost)
        AppChip(title: "36 EXP", isLarge: true, isMono: true)
    }
    .padding()
    .background(Color.appBg)
}
