import SwiftUI

struct EntityRow: View {
    var title: String
    var subtitle: String
    var iconName: String
    var menuActions: AnyView?
    
    var body: some View {
        HStack(spacing: 16) {
            // Icon circle
            ZStack {
                Circle()
                    .fill(Color.accent)
                    .frame(width: 40, height: 40)
                
                Image(systemName: iconName)
                    .font(.system(size: 18))
                    .foregroundColor(.black)
            }
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.appHeadline(16))
                    .foregroundColor(.appText)
                    .accessibilityIdentifier("entityRowTitle")
                
                Text(subtitle)
                    .font(.appMono(12))
                    .foregroundColor(.muted)
            }
            
            Spacer()
            
            if let menuActions = menuActions {
                Menu {
                    menuActions
                } label: {
                    Image(systemName: "ellipsis")
                        .font(.system(size: 20))
                        .foregroundColor(.muted)
                        .padding(8)
                }
                .accessibilityIdentifier("entityRowMoreButton")
            }
        }
        .padding(.vertical, 12)
        .padding(.horizontal, 16)
        .background(Color.surface1)
        .cornerRadius(Constants.Design.radiusMD)
        .overlay(
            RoundedRectangle(cornerRadius: Constants.Design.radiusMD)
                .stroke(Color.white.opacity(0.05), lineWidth: 0.5)
        )
    }
}

#Preview {
    VStack(spacing: 12) {
        EntityRow(
            title: "Nikon FE",
            subtitle: "35mm · SLR",
            iconName: "camera",
            menuActions: AnyView(
                Group {
                    Button("Edit") {}
                    Button("Delete", role: .destructive) {}
                }
            )
        )
        
        EntityRow(
            title: "Nikkor 50mm f/1.4",
            subtitle: "Prime · f/1.4",
            iconName: "lens"
        )
    }
    .padding()
    .background(Color.appBg)
}
