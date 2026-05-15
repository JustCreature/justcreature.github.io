import SwiftUI

struct AppCard<Content: View>: View {
    var content: Content
    
    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    
    var body: some View {
        ZStack {
            Color.surface1
            
            // Subtle grain placeholder
            Color.black.opacity(0.05)
                .blendMode(.overlay)
            
            content
        }
        .cornerRadius(Constants.Design.radiusLG)
        .overlay(
            RoundedRectangle(cornerRadius: Constants.Design.radiusLG)
                .stroke(Color.white.opacity(0.1), lineWidth: 0.5)
        )
    }
}

#Preview {
    AppCard {
        VStack(alignment: .leading) {
            Text("Kodak Portra 400")
                .font(.appHeadline())
                .foregroundColor(.appText)
            Text("36 exposures remaining")
                .font(.appBody(14))
                .foregroundColor(.muted)
        }
        .padding()
    }
    .frame(height: 100)
    .padding()
    .background(Color.appBg)
}
