# Kaseno for Windows (Creative Compositor)

**Kaseno for Windows** is the 1:1 Windows desktop port of Kaseno — high-performance photo editing and non-destructive compositing studio built with TypeScript, React 19, HTML5 Canvas 60fps rendering, and Electron.

---

## 🚀 Features

- **Non-Destructive Adjustment Layers**:
  - Brightness / Contrast
  - Levels (with real-time 256-bin histogram calculation)
  - Curves (spline LUT curve generator)
  - Hue / Saturation / Lightness (with Colorize)
  - Color Balance (Shadows, Midtones, Highlights across Cyan/Red, Magenta/Green, Yellow/Blue)
  - Exposure & Gamma Correction
  - Gaussian Blur & Add Noise
  - Invert & Black / White

- **Complete Layer Stack Engine**:
  - Unlimited layers with non-destructive stacking
  - Full Photoshop/Kaseno blend modes: *Normal, Multiply, Screen, Overlay, Darken, Lighten, Color Dodge, Color Burn, Soft Light, Hard Light, Difference, Exclusion, Hue, Saturation, Color, Luminosity*
  - Opacity slider (0–100%)
  - Non-destructive Layer Masks (grayscale clipping and raster masks)
  - Clipping Masks (clip adjustment or paint layers to the underlying layer)
  - Layer transforms (X/Y position, scaling, rotation, horizontal/vertical flipping)
  - Layer lock toggle & visibility toggle
  - Live 96x96 layer thumbnails

- **Painting & Tool Suite (14 Professional Tools)**:
  - **Move Tool (V)**: Direct layer and element repositioning
  - **Rectangular Marquee (M)**: Selection area
  - **Elliptical Marquee (Shift+M)**: Circular/elliptical selections
  - **Lasso Tool (L)**: Freehand polygon selection
  - **Magic Wand (W)**: Contiguous / non-contiguous flood tolerance selection
  - **Crop Tool (C)**: Aspect ratio crop guides
  - **Eyedropper (I)**: Instant canvas pixel color sampler
  - **Paintbrush (B)**: 60fps continuous interpolated dabs with size, hardness, opacity, flow, and spacing
  - **Clone Stamp (S)**: Alt-click sample source, clone painting
  - **Eraser (E)**: Non-destructive alpha eraser
  - **Type Tool (T)**: Vector typography
  - **Shape Tool (U)**: Rectangles, rounded rectangles, ellipses, and lines
  - **Hand Tool (H) & Spacebar**: Infinite 60fps panning
  - **Zoom Tool (Z) & Wheel**: Smooth zoom anchored to mouse cursor

- **History & Non-Destructive Undo/Redo**:
  - Full history timeline panel with 1-click step jumping
  - Photoshop shortcuts: `Ctrl+Z` (Undo), `Ctrl+Y` / `Ctrl+Shift+Z` (Redo)

- **File Formats & Interoperability**:
  - **`.kaseno` / `.comp` Packages**: Reads and saves native zipped project bundles (`manifest.json` + `images/*.png`)
  - **PSD Support**: Full multi-layer Adobe Photoshop `.psd` import via `ag-psd`
  - **Standard Images**: Import PNG, JPEG, WebP, SVG as new documents or new layers
  - **Flattened Export**: High-resolution export to PNG (with alpha), JPEG (with quality control), and WebP

---

## 🛠️ How to Run

### Development Mode (Browser):
```bash
npm run dev
```

### Development Mode (Native Electron Windows App):
```bash
npm run electron:dev
```

### Production Build:
```bash
npm run build
npm start
```

### Package into Standalone `.exe` Installer:
```bash
npx electron-builder
```

---

## ⌨️ Keyboard Shortcuts Reference

| Shortcut | Action |
|---|---|
| `V` | Move Tool |
| `M` / `Shift+M` | Rectangular / Elliptical Marquee |
| `L` | Lasso Tool |
| `W` | Magic Wand Tool |
| `C` | Crop Tool |
| `I` | Eyedropper |
| `B` | Brush Tool |
| `S` | Clone Stamp Tool |
| `E` | Eraser Tool |
| `T` | Type Tool |
| `U` | Shape Tool |
| `H` / `Space + Drag` | Hand Tool (Pan Canvas) |
| `Z` | Zoom Tool |
| `X` | Swap Foreground & Background Colors |
| `D` | Reset Colors (Cyan / White) |
| `Ctrl + Z` | Undo |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Redo |
| `Ctrl + S` | Save `.kaseno` project |
| `Ctrl + O` | Open file (`.kaseno`, `.comp`, `.psd`, image) |
| `Ctrl + N` | New document |
| `Ctrl + Shift + E` | Export flattened image |
| `Ctrl + D` | Deselect |
| `Ctrl + +` / `Ctrl + -` | Zoom in / Zoom out |
| `Ctrl + 0` | Fit canvas to screen (100%) |

---

*Authored by codewithevilxd for Windows users.*
