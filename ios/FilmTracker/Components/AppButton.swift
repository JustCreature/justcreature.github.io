import SwiftUI

struct AppButton: View {
    enum Variant {
        case primary
        case secondary
        case ghost
    }
    
    var title: String
    var variant: Variant = .primary
    var action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.appLabel(16))
                .padding(.vertical, 14)
                .frame(maxWidth: .infinity)
                .background(backgroundView)
                .foregroundColor(foregroundColor)
                .cornerRadius(Constants.Design.radiusMD)
        }
        .buttonStyle(ScaleButtonStyle())
    }
    
    @ViewBuilder
    private var backgroundView: some View {
        switch variant {
        case .primary:
            Color.accent
        case .secondary:
            Color.surface2
        case .ghost:
            Color.clear
        }
    }
    
    private var foregroundColor: Color {
        switch variant {
        case .primary:
            .black
        case .secondary, .ghost:
            .appText
        }
    }
}

struct ScaleButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.96 : 1.0)
            .animation(.easeOut(duration: 0.1), value: configuration.isPressed)
    }
}

#Preview {
    VStack {
        AppButton(title: "Primary Button") {}
        AppButton(title: "Secondary Button", variant: .secondary) {}
        AppButton(title: "Ghost Button", variant: .ghost) {}
    }
    .padding()
    .background(Color.appBg)
}
