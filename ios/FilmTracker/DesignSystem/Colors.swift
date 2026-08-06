import SwiftUI

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
    
    static let appBg = Color(UIColor { trait in
        trait.userInterfaceStyle == .dark ? UIColor(Color(hex: Constants.Design.bg)) : UIColor(Color(hex: "#f5f5f7"))
    })
    
    static let surface0 = Color(UIColor { trait in
        trait.userInterfaceStyle == .dark ? UIColor(Color(hex: Constants.Design.surface0)) : UIColor(Color(hex: "#ffffff"))
    })
    
    static let surface1 = Color(UIColor { trait in
        trait.userInterfaceStyle == .dark ? UIColor(Color(hex: Constants.Design.surface1)) : UIColor(Color(hex: "#f2f2f7"))
    })
    
    static let surface2 = Color(UIColor { trait in
        trait.userInterfaceStyle == .dark ? UIColor(Color(hex: Constants.Design.surface2)) : UIColor(Color(hex: "#e5e5ea"))
    })
    
    static let surface3 = Color(UIColor { trait in
        trait.userInterfaceStyle == .dark ? UIColor(Color(hex: Constants.Design.surface3)) : UIColor(Color(hex: "#d1d1d6"))
    })
    
    static let accent = Color(hex: Constants.Design.accent)
    
    static let appText = Color(UIColor { trait in
        trait.userInterfaceStyle == .dark ? UIColor(Color(hex: Constants.Design.text)) : UIColor(Color(hex: "#1c1c1e"))
    })
    
    static let muted = Color(UIColor { trait in
        trait.userInterfaceStyle == .dark ? UIColor(Color(hex: Constants.Design.muted)) : UIColor(Color(hex: "#8e8e93"))
    })
    
    static let dim = Color(UIColor { trait in
        trait.userInterfaceStyle == .dark ? UIColor(Color(hex: Constants.Design.dim)) : UIColor(Color(hex: "#c7c7cc"))
    })
    
    static let appRed = Color(hex: Constants.Design.red)
    static let appGreen = Color(hex: Constants.Design.green)
}
