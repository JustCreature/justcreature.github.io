import SwiftUI

struct NoteSheet: View {
    @Binding var note: String?
    @Environment(\.dismiss) private var dismiss
    
    @State private var localNote: String = ""
    
    var body: some View {
        VStack(spacing: 20) {
            GrabberBar()
            
            VStack(alignment: .leading, spacing: 8) {
                Text("ADD NOTE")
                    .font(.custom("InterTight-Bold", size: 14))
                    .foregroundColor(.white.opacity(0.6))
                
                TextEditor(text: $localNote)
                    .font(.custom("InterTight-Medium", size: 16))
                    .frame(height: 120)
                    .padding(12)
                    .background(Color(hex: Constants.Design.surface2))
                    .cornerRadius(10)
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(.white.opacity(0.1), lineWidth: 1)
                    )
                
                Text("Saved with next exposure")
                    .font(.custom("InterTight-Medium", size: 12))
                    .foregroundColor(Color(hex: Constants.Design.accent).opacity(0.8))
            }
            .padding(.horizontal)
            
            AppButton(title: "Save Note", variant: .primary) {
                note = localNote.isEmpty ? nil : localNote
                dismiss()
            }
            .padding(.horizontal)
            .padding(.bottom, 30)
        }
        .background(Color(hex: Constants.Design.surface1))
        .onAppear {
            localNote = note ?? ""
        }
    }
}

struct GrabberBar: View {
    var body: some View {
        Capsule()
            .fill(.white.opacity(0.2))
            .frame(width: 36, height: 4)
            .padding(.top, 12)
    }
}
