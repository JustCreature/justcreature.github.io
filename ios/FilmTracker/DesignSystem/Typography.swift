import SwiftUI

extension Font {
    static func appHeadline(_ size: CGFloat = 20) -> Font {
        .system(size: size, weight: .bold, design: .default)
    }
    
    static func appBody(_ size: CGFloat = 16) -> Font {
        .system(size: size, weight: .regular, design: .default)
    }
    
    static func appMono(_ size: CGFloat = 14) -> Font {
        .system(size: size, weight: .medium, design: .monospaced)
    }
    
    static func appLabel(_ size: CGFloat = 12) -> Font {
        .system(size: size, weight: .semibold, design: .default)
    }
}
