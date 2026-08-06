import SwiftUI

struct RadialDialPicker: View {
    let options: [String]
    @Binding var selection: String
    
    @State private var offset: CGFloat = 0
    @State private var lastOffset: CGFloat = 0
    
    private let radius: CGFloat = 180
    private let arcAngle: Double = 130 // Total arc angle
    
    var body: some View {
        VStack(spacing: 20) {
            // Pointer
            Image(systemName: "triangle.fill")
                .font(.system(size: 12))
                .foregroundColor(Color(hex: Constants.Design.accent))
                .rotationEffect(.degrees(180))
            
            ZStack {
                ForEach(0..<options.count, id: \.self) { index in
                    let angle = angleForIndex(index)
                    let isSelected = options[index] == selection
                    
                    Button {
                        select(index: index)
                    } label: {
                        VStack(spacing: 4) {
                            Text(options[index])
                                .font(.custom("JetBrainsMono-Bold", size: isSelected ? 18 : 14))
                                .foregroundColor(isSelected ? Color(hex: Constants.Design.accent) : .white.opacity(opacityForIndex(index)))
                            
                            // Tick mark
                            Rectangle()
                                .fill(isSelected ? Color(hex: Constants.Design.accent) : .white.opacity(0.3))
                                .frame(width: 2, height: isSelected ? 15 : 8)
                        }
                        .frame(width: 80, height: 80)
                        .background(Color.white.opacity(0.001))
                    }
                    .buttonStyle(.plain)
                    .offset(y: -radius)
                    .rotationEffect(.degrees(angle))
                    .accessibilityIdentifier("pickerItem_\(options[index])")
                    .accessibilityLabel(options[index])
                    .accessibilityAction {
                        select(index: index)
                    }
                }
            }
            .frame(height: radius)
            .contentShape(Rectangle())
            .padding(.top, radius / 2)
            .gesture(
                DragGesture()
                    .onChanged { value in
                        offset = lastOffset + value.translation.width
                        updateSelection()
                    }
                    .onEnded { _ in
                        snapToNearest()
                        lastOffset = offset
                    }
            )

            HStack(spacing: 4) {
                Image(systemName: "chevron.left")
                Text("SWIPE TO ROTATE")
                    .font(.custom("InterTight-Medium", size: 10))
                Image(systemName: "chevron.right")
            }
            .foregroundColor(.white.opacity(0.4))
        }
        .padding(.vertical, 30)
        .background(Color(hex: Constants.Design.surface1))
        .onAppear {
            if let index = options.firstIndex(of: selection) {
                let step = 40.0
                offset = -CGFloat(index) * step
                lastOffset = offset
            }
        }
    }
    
    private func select(index: Int) {
        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
            selection = options[index]
            let step = 40.0
            offset = -CGFloat(index) * step
            lastOffset = offset
        }
        UISelectionFeedbackGenerator().selectionChanged()
    }
    
    private func angleForIndex(_ index: Int) -> Double {
        let baseAngle = Double(index) * (arcAngle / Double(options.count - 1))
        let rotation = Double(offset / 4) // Adjust sensitivity
        return baseAngle + rotation - (arcAngle / 2)
    }
    
    private func opacityForIndex(_ index: Int) -> Double {
        let angle = angleForIndex(index)
        let absAngle = abs(angle)
        if absAngle > 60 { return 0 }
        return 1.0 - (absAngle / 60.0)
    }
    
    private func updateSelection() {
        let step = 40.0 // Pixels per option
        let index = Int(round(-offset / step))
        let clampedIndex = max(0, min(options.count - 1, index))
        if options[clampedIndex] != selection {
            selection = options[clampedIndex]
            UISelectionFeedbackGenerator().selectionChanged()
        }
    }
    
    private func snapToNearest() {
        let step = 40.0
        let index = Int(round(-offset / step))
        let clampedIndex = max(0, min(options.count - 1, index))
        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
            offset = -CGFloat(clampedIndex) * step
        }
    }
}
