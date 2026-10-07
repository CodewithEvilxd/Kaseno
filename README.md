# Kaseno

Kaseno is a native macOS image editor and creative photo compositing studio built for Apple silicon. Fast, lightweight, and completely open source.

Built with **Swift (SwiftUI & AppKit)**, **Metal (GPU-accelerated compositing)**, and optimized **C** routines for pixel-level performance, Kaseno delivers a fluid, distraction-free workflow with familiar desktop shortcuts and modern tools.

Developed & maintained by **[@codewithevilxd](https://github.com/codewithevilxd)**.

---

## Download & Installation

Download the latest release directly from **[GitHub Releases](https://github.com/codewithevilxd/Kaseno/releases/latest)**.

```sh
# Clone the repository
git clone https://github.com/codewithevilxd/Kaseno.git
```

---

## Key Features

### 🗂️ Layers & Masking
- Non-destructive layers and folders with adjustable opacity and full Photoshop blend modes
- Raster layer masks: paint, fill, invert, blur, and feather anywhere on canvas
- Clipping masks and folder-level masks
- GPU-rendered layer effects: Stroke, Drop Shadow, Color Overlay, Inner Shadow, Outer Glow, and Inner Glow
- Adjustment layers: Hue/Saturation, Levels, Curves, Exposure, Gradient Map, Grain, Black & White, Color Balance, Invert, Gaussian Blur, Motion Blur, and Noise
- Fast layer actions: Merge Down, Merge Layers, Merge Group (⌘E), duplicate, inline rename, and nested drag-and-drop

### 📐 Precision Transforms
- Non-destructive move, scale, rotate, and flip (images retain full source resolution)
- Free distort (⌘-drag handle) with Shift-axis constraint
- Multi-layer and whole-folder unified transforms
- Magnetic snapping to canvas bounds, layer centers, and custom guides
- Keyboard nudge stepping with arrow keys for exact coordinates and angles

### 🎯 Selections & Retouching
- Marquee (Rectangular & Elliptical), Freehand & Polygonal Lasso, and Color/Object Wand
- Smart **Select Subject**, Expand, Contract, and Feathering
- Content-Aware Fill for intelligent inpainting and canvas extension
- Brush engine with customizable size, hardness, smoothing, and erase modes
- Spot Healing Brush & aligned Clone Stamp
- Interactive Gradient and live Vector Shape tools
- Multiline draggable Type tool with typography controls and clipping mask support

### 🎨 Color & Camera Raw Adjustments
- Camera Raw engine: Light, Color, Tone Curve, Color Mixer, Grading, Detail, Optics, and Geometry
- Curves, Levels (with Auto), Hue/Saturation, Exposure, Gradient Map, and Grain
- Live filters: Gaussian Blur, Motion Blur, Vignette, Bloom/Glow, Tonal Contrast, Lens Correction, and Background Removal

### 🚀 Performance & Native Integrations
- Multi-tab project workspace with smooth zooming, panning, and persistent rulers
- Smart memory scaling designed for Apple silicon
- PSD and PSB import support (8-bit RGB with folders, masks, and blend modes)
- High-quality export for PNG and JPEG with live compression preview (⇧⌥⌘S)
- Live project editing for AI agents and external scripts (using `.comp` packages)

---

## Requirements

- **macOS 26.0 or later** (Apple silicon)
- **Xcode 26 or later** (for building from source)

---

## Building from Source

1. Clone this repository:
   ```sh
   git clone https://github.com/codewithevilxd/Kaseno.git
   ```
2. Open `Compositor.xcodeproj` in Xcode.
3. Select the **Compositor** scheme and press **⌘R** to build and run.

To run the automated test suite:
```sh
xcodebuild -project Compositor.xcodeproj -scheme Compositor -destination 'platform=macOS' test
```

---

## Author

- **GitHub**: [@codewithevilxd](https://github.com/codewithevilxd)
- **Project**: [Kaseno](https://github.com/codewithevilxd/Kaseno)

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
