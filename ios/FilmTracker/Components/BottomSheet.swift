import SwiftUI

struct BottomSheet<Content: View>: View {
    @Environment(\.dismiss) private var dismiss
    @Binding var isPresented: Bool
    var title: String?
    var content: Content
    
    init(isPresented: Binding<Bool>, title: String? = nil, @ViewBuilder content: () -> Content) {
        self._isPresented = isPresented
        self.title = title
        self.content = content()
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Grabber
            Capsule()
                .fill(Color.dim)
                .frame(width: 36, height: 4)
                .padding(.top, 8)
                .padding(.bottom, 16)
            
            if let title = title {
                HStack {
                    Spacer()
                    Text(title)
                        .font(.appHeadline(18))
                        .foregroundColor(.appText)
                    Spacer()
                }
                .padding(.bottom, 20)
                .overlay(alignment: .topLeading) {
                    Button {
                        isPresented = false
                        dismiss()
                    } label: {
                        Text("Cancel")
                            .font(.appBody(14))
                            .foregroundColor(.accent)
                    }
                    .padding(.leading, 0)
                    .padding(.top, -10)
                }
            }
            
            content
                .padding(.bottom, 34) // Safe area bottom
        }
        .padding(.horizontal, 20)
        .background(Color.surface1)
        .cornerRadius(Constants.Design.radiusXL, corners: [.topLeft, .topRight])
    }
}

// Helper for rounded corners on specific sides
extension View {
    func cornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        clipShape(RoundedCorner(radius: radius, corners: corners))
    }
}

struct RoundedCorner: Shape {
    var radius: CGFloat = .infinity
    var corners: UIRectCorner = .allCorners

    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(roundedRect: rect, byRoundingCorners: corners, cornerRadii: CGSize(width: radius, height: radius))
        return Path(path.cgPath)
    }
}

#Preview {
    ZStack(alignment: .bottom) {
        Color.black.ignoresSafeArea()
        BottomSheet(isPresented: .constant(true), title: "Add New Roll") {
            VStack(spacing: 12) {
                AppButton(title: "Confirm") {}
                AppButton(title: "Cancel", variant: .secondary) {}
            }
        }
    }
}
