import Foundation

enum Constants {
    static let apertures = [
        "f/1.4", "f/2", "f/2.8", "f/3.5", "f/4", "f/4.5", "f/5.6",
        "f/8", "f/11", "f/16", "f/22"
    ]
    
    static let shutterSpeeds = [
        "1/4000", "1/2000", "1/1000", "1/500", "1/250", "1/125",
        "1/60", "1/30", "1/15", "1/8", "1/4", "1/2", "1\"", "2\"", "4\"", "8\"", "BULB"
    ]
    
    static let eiValues = [
        25, 32, 40, 50, 64, 80, 100, 125, 160, 200,
        250, 320, 400, 500, 640, 800, 1000, 1250, 1600,
        2000, 2500, 3200, 4000, 5000, 6400
    ]
    
    static let focalPresets = [18, 24, 28, 35, 50, 85, 100, 135, 200]
    
    enum Design {
        static let bg = "#0a0a0b"
        static let surface0 = "#111113"
        static let surface1 = "#17171a"
        static let surface2 = "#1f1f23"
        static let surface3 = "#2a2a30"
        static let accent = "#f4a261"
        static let text = "#f5f5f7"
        static let muted = "#9a9aa3"
        static let dim = "#5e5e68"
        static let red = "#ff453a"
        static let green = "#30d158"
        
        static let radiusXS: CGFloat = 4
        static let radiusSM: CGFloat = 6
        static let radiusMD: CGFloat = 10
        static let radiusLG: CGFloat = 16
        static let radiusXL: CGFloat = 22
        static let radiusPill: CGFloat = 999
    }
}
