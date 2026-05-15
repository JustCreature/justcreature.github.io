import SwiftUI

struct FABMenu: View {
    @Environment(\.dismiss) private var dismiss
    var onNewRoll: () -> Void
    var onImport: () -> Void
    var onResumeLast: () -> Void
    
    var body: some View {
        VStack(spacing: 24) {
            VStack(spacing: 8) {
                Text("ACTIONS")
                    .font(.appMono(10))
                    .foregroundColor(.muted)
                    .frame(maxWidth: .infinity, alignment: .leading)
                
                VStack(spacing: 12) {
                    FABMenuItem(icon: "camera", title: "New roll", action: { dismiss(); onNewRoll() })
                        .accessibilityIdentifier("fabNewRoll")
                    FABMenuItem(icon: "arrow.down.doc", title: "Import", action: { dismiss(); onImport() })
                        .accessibilityIdentifier("fabImport")
                    FABMenuItem(icon: "clock", title: "Resume last", action: { dismiss(); onResumeLast() })
                        .accessibilityIdentifier("fabResumeLast")
                }
            }
            
            AppButton(title: "Cancel", variant: .secondary) {
                dismiss()
            }
        }
        .padding(24)
        .background(Color.surface1)
        .cornerRadius(Constants.Design.radiusXL, corners: [.topLeft, .topRight])
    }
}

struct FABMenuItem: View {
    let icon: String
    let title: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 16) {
                Image(systemName: icon)
                    .font(.system(size: 20))
                    .foregroundColor(.accent)
                    .frame(width: 24)
                
                Text(title)
                    .font(.appHeadline(18))
                    .foregroundColor(.appText)
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.dim)
            }
            .padding()
            .background(Color.surface2)
            .cornerRadius(Constants.Design.radiusMD)
        }
    }
}
