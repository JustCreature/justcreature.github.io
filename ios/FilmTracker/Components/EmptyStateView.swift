import SwiftUI

struct EmptyStateView: View {
    var iconName: String
    var title: String
    var bodyText: String
    var actionTitle: String?
    var action: (() -> Void)?
    
    var body: some View {
        VStack(spacing: 20) {
            // Icon container with dashed border
            ZStack {
                RoundedRectangle(cornerRadius: Constants.Design.radiusMD)
                    .stroke(style: StrokeStyle(lineWidth: 1, dash: [6]))
                    .foregroundColor(.dim)
                    .frame(width: 88, height: 88)
                
                Image(systemName: iconName)
                    .font(.system(size: 32))
                    .foregroundColor(.muted)
            }
            
            VStack(spacing: 8) {
                Text(title)
                    .font(.appHeadline(20))
                    .foregroundColor(.appText)
                
                Text(bodyText)
                    .font(.appBody(15))
                    .foregroundColor(.muted)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
            }
            
            if let actionTitle = actionTitle, let action = action {
                Button {
                    action()
                } label: {
                    Text(actionTitle)
                        .font(.appLabel(16))
                        .padding(.vertical, 14)
                        .frame(maxWidth: .infinity)
                        .background(Color.accent)
                        .foregroundColor(.black)
                        .cornerRadius(Constants.Design.radiusMD)
                }
                .frame(width: 200)
                .padding(.top, 10)
            }
        }
        .padding()
    }
}

#Preview {
    EmptyStateView(
        iconName: "film",
        title: "No active rolls",
        bodyText: "Start your first film roll to begin tracking your exposures.",
        actionTitle: "Start New Roll",
        action: {}
    )
    .background(Color.appBg)
}
