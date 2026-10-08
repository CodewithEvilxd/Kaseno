import SwiftUI
import AppKit
import ImageIO

struct NewCanvasSheet: View {
    let session: EditorSession
    var onCreate: ((Int, Int) -> Void)? = nil
    var onOpen: (() -> Void)? = nil
    @State private var width = "1920"
    @State private var height = "1080"
    @State private var suggestedClipboardSize = false
    @FocusState private var focusedField: Field?
    private enum Field { case width, height }
    private var valid: Bool {
        CanvasDocument.validDimension(width) != nil && CanvasDocument.validDimension(height) != nil
    }
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .top) {
                    KuraChapterHeader(
                        chapter: "Chapter 01 · Canvas Setup",
                        title: "Canvas Setup & Workspace",
                        subtitle: "Configure pixel dimensions, choose device presets, or target storage."
                    )
                    Spacer()
                    // Preset sizes, tucked into a More button; the size in use is checked.
                    Menu {
                        Picker("Size", selection: preset) {
                            Text("Custom").tag(CanvasPreset?.none)
                            ForEach(CanvasPreset.groups.indices, id: \.self) { group in
                                Divider()
                                ForEach(CanvasPreset.groups[group]) { Text($0.title).tag(CanvasPreset?.some($0)) }
                            }
                        }
                        .pickerStyle(.inline).labelsHidden()
                    } label: {
                        // Three dots drawn exactly (a rotated symbol keeps its sideways width), flush with the fields'
                        // right edge; the frame keeps it easy to click.
                        VStack(spacing: 2.5) { ForEach(0..<3, id: \.self) { _ in Circle().frame(width: 2.5, height: 2.5) } }
                            .foregroundStyle(.primary)
                            .frame(width: 28, height: 28, alignment: .trailing)
                            .padding(.trailing, 10)
                            .contentShape(Rectangle())
                            .padding(.trailing, -10)
                    }
                    .menuStyle(.button).buttonStyle(.plain).menuIndicator(.hidden).fixedSize()
                    .help("Preset sizes for screens and common formats")
                    .accessibilityLabel("Preset sizes")
                }

                // Quick Preset Pills Strip (GitKura tag style)
                HStack(spacing: 8) {
                    ForEach(["1080p", "4K", "Instagram", "iPhone"], id: \.self) { presetName in
                        Button {
                            if presetName == "1080p" { width = "1920"; height = "1080" }
                            else if presetName == "4K" { width = "3840"; height = "2160" }
                            else if presetName == "Instagram" { width = "1080"; height = "1080" }
                            else if presetName == "iPhone" { width = "1206"; height = "2622" }
                        } label: {
                            let isSel = (presetName == "1080p" && width == "1920" && height == "1080") ||
                                        (presetName == "4K" && width == "3840" && height == "2160") ||
                                        (presetName == "Instagram" && width == "1080" && height == "1080") ||
                                        (presetName == "iPhone" && width == "1206" && height == "2622")
                            KuraPillBadge(
                                text: presetName,
                                background: isSel ? AppTheme.kuraYellow : Color.white.opacity(0.06),
                                foreground: isSel ? AppTheme.kuraNavy : .primary,
                                borderColor: isSel ? Color.yellow : Color.white.opacity(0.18)
                            )
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            HStack(spacing: 16) {
                dimension("Width", text: $width, field: .width)
                Image(systemName: "multiply").foregroundStyle(.tertiary).padding(.top, 20)
                dimension("Height", text: $height, field: .height)
            }
            HStack {
                Text(valid ? "✨ Transparent canvas · sRGB 16-bit color buffer" : "⚠️ Enter whole numbers from 1 to \(DocumentLimits.maxSide.formatted()) pixels.")
                    .font(Font.handwrittenNote(size: 13.5))
                    .foregroundStyle(valid ? Color.secondary : Color.orange)
                Spacer()
                KuraPillBadge(text: "sRGB", dotColor: .green, background: Color.black.opacity(0.2), foreground: .secondary)
            }
            HStack(spacing: 10) {
                Button("Open project") { onOpen?() }.buttonStyle(.bordered)
                Button("Import image") { session.showsImporter = true }.buttonStyle(.bordered)
                Spacer()
                Button("Create Canvas") {
                    guard let w = CanvasDocument.validDimension(width),
                          let h = CanvasDocument.validDimension(height) else { return }
                    if let onCreate { onCreate(w, h) }
                    else { session.createDocument(width: w, height: h, emptyLayer: true) }
                }
                .font(Font.bricolageTitle(size: 13, weight: .bold))
                .configuredNativeShortcut(.return).buttonStyle(.borderedProminent)
                .disabled(!valid).accessibilityIdentifier("createCanvas")
            }
        }
        .padding(28).frame(maxWidth: 500)
        .disabled(session.isImporting || session.showsBusy)
        .onAppear {
            if !suggestedClipboardSize {
                suggestedClipboardSize = true
                if session.skipsInitialClipboardCanvasSize {
                    session.skipsInitialClipboardCanvasSize = false
                } else if let size = Self.clipboardDimensions() {
                    width = String(size.width)
                    height = String(size.height)
                }
            }
            focusedField = .width
        }
    }
    /// The preset the fields match, or nil (Custom); choosing one fills them in.
    private var preset: Binding<CanvasPreset?> {
        Binding(get: { CanvasPreset.all.first { String($0.width) == width && String($0.height) == height } },
                set: { if let chosen = $0 { width = String(chosen.width); height = String(chosen.height) } })
    }

    static func clipboardDimensions(_ pasteboard: NSPasteboard = .general) -> (width: Int, height: Int)? {
        for type in [NSPasteboard.PasteboardType.png, .tiff] {
            guard let data = pasteboard.data(forType: type),
                  let source = CGImageSourceCreateWithData(data as CFData, nil),
                  let properties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any],
                  var width = properties[kCGImagePropertyPixelWidth] as? Int,
                  var height = properties[kCGImagePropertyPixelHeight] as? Int else { continue }
            if let orientation = properties[kCGImagePropertyOrientation] as? Int, (5...8).contains(orientation) {
                swap(&width, &height)
            }
            guard CanvasDocument.validDimension(String(width)) != nil,
                  CanvasDocument.validDimension(String(height)) != nil else { continue }
            return (width, height)
        }
        return nil
    }
    private func dimension(_ title: String, text: Binding<String>, field: Field) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).font(.callout.weight(.medium))
            HStack {
                TextField(title, text: text).textFieldStyle(.plain)
                    .focused($focusedField, equals: field)
                    .accessibilityIdentifier(title.lowercased() + "Input")
                Text("px").foregroundStyle(.secondary)
            }
            .padding(12).background(.quaternary.opacity(0.5), in: RoundedRectangle(cornerRadius: 7))
        }
    }
}

/// New Canvas sizes: common screens and resolutions, in pixels, upright as the device is usually held.
struct CanvasPreset: Identifiable, Hashable {
    let title: String
    let width: Int
    let height: Int
    var id: String { title }
    /// Resolutions, Apple screens, then social formats; the menu divides them.
    static let groups: [[CanvasPreset]] = [
        [
            CanvasPreset(title: "4K", width: 3840, height: 2160),
            CanvasPreset(title: "1440p", width: 2560, height: 1440),
            CanvasPreset(title: "1080p", width: 1920, height: 1080),
        ],
        [
            CanvasPreset(title: "iPhone 18 Pro", width: 1206, height: 2622),
            CanvasPreset(title: "iPhone 18 Pro Max", width: 1320, height: 2868),
            CanvasPreset(title: "MacBook Pro 14\"", width: 3024, height: 1964),
            CanvasPreset(title: "MacBook Pro 16\"", width: 3456, height: 2234),
            CanvasPreset(title: "Studio Display", width: 5120, height: 2880),
        ],
        [
            CanvasPreset(title: "Instagram Square", width: 1080, height: 1080),
            CanvasPreset(title: "Instagram Portrait", width: 1080, height: 1350),
            CanvasPreset(title: "Instagram Story", width: 1080, height: 1920),
            CanvasPreset(title: "YouTube Thumb", width: 1080, height: 608),
        ],
    ]
    static let all = groups.flatMap { $0 }
}
