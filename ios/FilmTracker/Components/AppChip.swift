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
    var isSelected: Bool = false
    var action: (() -> Void)? = nil
    
    var body: some View {
        Button {
            action?()
        } label: {
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
        .disabled(action == nil)
    }
    
    @ViewBuilder
    private var backgroundView: some View {
        if isSelected {
            Color.accent.opacity(0.15)
        } else {
            switch variant {
            case .standard:
                Color.surface2
            case .accentGlow:
                Color.accent.opacity(0.15)
            case .ghost:
                Color.clear
            }
        }
    }
    
    private var foregroundColor: Color {
        if isSelected {
            return .accent
        }
        switch variant {
        case .standard:
            return .appText
        case .accentGlow:
            return .accent
        case .ghost:
            return .muted
        }
    }
    
    private var borderColor: Color {
        if isSelected {
            return .accent.opacity(0.3)
        }
        switch variant {
        case .standard:
            return .clear
        case .accentGlow:
            return .accent.opacity(0.3)
        case .ghost:
            return .dim
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
