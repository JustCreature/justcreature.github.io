import SwiftUI

struct LightMeterView: View {
    let ev: Double
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("LIGHT METER")
                .font(.custom("InterTight-Bold", size: 8))
                .foregroundColor(.white.opacity(0.6))
            
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text(String(format: "%.1f", ev))
                    .font(.custom("JetBrainsMono-Bold", size: 18))
                    .foregroundColor(isCorrectExposure ? Color(hex: Constants.Design.green) : Color(hex: Constants.Design.accent))
                Text("EV")
                    .font(.custom("JetBrainsMono-Medium", size: 10))
                    .foregroundColor(.white.opacity(0.4))
            }
            
            // Scale Bar
            ZStack(alignment: .leading) {
                Rectangle()
                    .fill(.white.opacity(0.1))
                    .frame(height: 2)
                
                // Ticks
                HStack(spacing: 0) {
                    ForEach(-3...3, id: \.self) { i in
                        Rectangle()
                            .fill(i == 0 ? .white : .white.opacity(0.3))
                            .frame(width: 1, height: i == 0 ? 8 : 4)
                        if i < 3 { Spacer() }
                    }
                }
                .frame(height: 8)
                
                // Indicator
                Rectangle()
                    .fill(isCorrectExposure ? Color(hex: Constants.Design.green) : Color(hex: Constants.Design.accent))
                    .frame(width: 2, height: 12)
                    .offset(x: indicatorOffset)
            }
            .frame(width: 120)
        }
        .padding(12)
        .background(.ultraThinMaterial)
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(.white.opacity(0.1), lineWidth: 1)
        )
    }
    
    private var isCorrectExposure: Bool {
        // Simplified: correct exposure is arbitrary for simulation
        // Let's say between 10 and 15 EV is "green" for daylight
        ev > 10 && ev < 15
    }
    
    private var indicatorOffset: CGFloat {
        // Map EV to scale -3...+3
        // Center (0) is at 60px. Range is 120px.
        // Let's center around 12.5 EV for simulation.
        let centeredEV = ev - 12.5
        let clampedEV = max(-3, min(3, centeredEV))
        return CGFloat(clampedEV + 3) * (120.0 / 6.0)
    }
}
