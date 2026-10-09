import SwiftUI
import AppKit

// MARK: - Kaseno & GitKura Unified Design System
// Brings the distinct notebook aesthetic (Bricolage Grotesque display headers,
// Patrick Hand handwritten notes, JetBrains Mono pill badges, and yellow marker accents)
// to Kaseno for macOS.

enum AppTheme {
    // MARK: - Signature Accent Colors
    static let kuraYellow = Color(red: 254 / 255, green: 240 / 255, blue: 138 / 255) // #FEF08A
    static let kuraYellowDark = Color(red: 113 / 255, green: 63 / 255, blue: 18 / 255)
    static let kuraBlue = Color(red: 186 / 255, green: 230 / 255, blue: 253 / 255)   // #BAE6FD
    static let kuraBlueDark = Color(red: 3 / 255, green: 105 / 255, blue: 161 / 255)
    static let kuraGreen = Color(red: 187 / 255, green: 247 / 255, blue: 208 / 255) // #BBF7D0
    static let kuraGreenDark = Color(red: 21 / 255, green: 128 / 255, blue: 61 / 255)
    static let kuraNavy = Color(red: 30 / 255, green: 41 / 255, blue: 59 / 255)      // #1E293B
}

extension Font {
    /// Bricolage Grotesque display font: quirky, rounded grotesque with strong character.
    /// Uses system rounded design with heavy weight when custom font is not registered in system.
    static func bricolageTitle(size: CGFloat = 14, weight: Font.Weight = .bold) -> Font {
        if NSFont(name: "Bricolage Grotesque", size: size) != nil {
            return .custom("Bricolage Grotesque", size: size).weight(weight)
        }
        return .system(size: size, weight: weight, design: .rounded)
    }

    /// Patrick Hand handwritten font: warm, relaxed notebook script for hints and annotations.
    static func handwrittenNote(size: CGFloat = 13.5, weight: Font.Weight = .medium) -> Font {
        if NSFont(name: "Patrick Hand", size: size) != nil {
            return .custom("Patrick Hand", size: size).weight(weight)
        }
        return .system(size: size, weight: weight, design: .rounded)
    }

    /// JetBrains Mono: clean monospaced font for pill badges, shortcuts, and pixel coordinates.
    static func monoBadge(size: CGFloat = 11, weight: Font.Weight = .semibold) -> Font {
        if NSFont(name: "JetBrains Mono", size: size) != nil {
            return .custom("JetBrains Mono", size: size).weight(weight)
        }
        return .system(size: size, weight: weight, design: .monospaced)
    }

    /// Plus Jakarta Sans: clean geometric sans-serif for UI labels.
    static func kuraSans(size: CGFloat = 12, weight: Font.Weight = .regular) -> Font {
        if NSFont(name: "Plus Jakarta Sans", size: size) != nil {
            return .custom("Plus Jakarta Sans", size: size).weight(weight)
        }
        return .system(size: size, weight: weight, design: .default)
    }
}

// MARK: - GitKura UI Components for SwiftUI

/// GitKura-style pill badge with borders and monospace/rounded typography
struct KuraPillBadge: View {
    let text: String
    var icon: String? = nil
    var dotColor: Color? = nil
    var background: Color = Color.white.opacity(0.06)
    var foreground: Color = .primary
    var borderColor: Color = Color.white.opacity(0.18)
    var isMono: Bool = true

    var body: some View {
        HStack(spacing: 5) {
            if let dotColor {
                Circle()
                    .fill(dotColor)
                    .frame(width: 6, height: 6)
            }
            if let icon {
                Image(systemName: icon)
                    .font(.system(size: 9, weight: .bold))
            }
            Text(text)
                .font(isMono ? Font.monoBadge(size: 10.5) : Font.bricolageTitle(size: 10.5, weight: .semibold))
        }
        .foregroundStyle(foreground)
        .padding(.horizontal, 8)
        .padding(.vertical, 3)
        .background(background, in: Capsule())
        .overlay(Capsule().strokeBorder(borderColor, lineWidth: 1))
        .fixedSize()
    }
}

/// Chapter breadcrumb capsule (e.g. "● CHAPTER 01 • CANVAS SETUP")
struct KuraChapterHeader: View {
    let chapter: String
    let title: String
    var subtitle: String? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 5) {
                Circle().fill(AppTheme.kuraYellow).frame(width: 5, height: 5)
                Text(chapter.uppercased())
                    .font(Font.monoBadge(size: 9.5, weight: .bold))
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 9)
            .padding(.vertical, 3)
            .background(Color.black.opacity(0.25), in: Capsule())
            .overlay(Capsule().strokeBorder(Color.white.opacity(0.15), lineWidth: 1))

            Text(title)
                .font(Font.bricolageTitle(size: 22, weight: .heavy))
                .padding(.horizontal, 4)
                .background {
                    // Soft yellow marker highlighter behind title
                    RoundedRectangle(cornerRadius: 4)
                        .fill(AppTheme.kuraYellow)
                        .opacity(0.85)
                        .offset(y: 4)
                        .frame(height: 14)
                }

            if let subtitle {
                Text(subtitle)
                    .font(Font.handwrittenNote(size: 14))
                    .foregroundStyle(.secondary)
            }
        }
    }
}
