import SwiftUI

struct GrainOverlay: View {
    var body: some View {
        Rectangle()
            .fill(.black.opacity(0.08)) // Placeholder for real grain
            .blendMode(.multiply)
            .allowsHitTesting(false)
    }
}

struct VignetteOverlay: View {
    var body: some View {
        RadialGradient(
            gradient: Gradient(colors: [.clear, .black.opacity(0.6)]),
            center: .center,
            startRadius: 100,
            endRadius: 400
        )
        .allowsHitTesting(false)
    }
}
