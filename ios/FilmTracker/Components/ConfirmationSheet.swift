import SwiftUI

struct ConfirmationSheet: View {
    var title: String
    var message: String
    var confirmTitle: String = "Delete"
    var isDestructive: Bool = true
    var onConfirm: () -> Void
    var onCancel: () -> Void
    
    var body: some View {
        VStack(spacing: 24) {
            VStack(spacing: 8) {
                Text(title)
                    .font(.appHeadline(20))
                    .foregroundColor(.appText)
                
                Text(message)
                    .font(.appBody(15))
                    .foregroundColor(.muted)
                    .multilineTextAlignment(.center)
            }
            
            VStack(spacing: 12) {
                AppButton(
                    title: confirmTitle,
                    variant: isDestructive ? .destructive : .primary,
                    action: onConfirm
                )
                .accessibilityIdentifier("confirmationConfirmButton")
                
                AppButton(
                    title: "Cancel",
                    variant: .secondary,
                    action: onCancel
                )
                .accessibilityIdentifier("confirmationCancelButton")
            }
        }
        .padding(24)
        .background(Color.surface1)
        .cornerRadius(Constants.Design.radiusXL, corners: [.topLeft, .topRight])
    }
}

#Preview {
    ZStack(alignment: .bottom) {
        Color.black.ignoresSafeArea()
        ConfirmationSheet(
            title: "Delete Roll?",
            message: "This action cannot be undone. All exposures in this roll will be lost.",
            onConfirm: {},
            onCancel: {}
        )
    }
}
