export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'soft-light'
  | 'hard-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

export type ToolType =
  | 'move'
  | 'marquee-rect'
  | 'marquee-ellipse'
  | 'lasso'
  | 'wand'
  | 'crop'
  | 'brush'
  | 'clone'
  | 'eraser'
  | 'gradient'
  | 'smudge'
  | 'type'
  | 'shape'
  | 'warp'
  | 'liquify'
  | 'eyedropper'
  | 'hand'
  | 'zoom';

export type AdjustmentType =
  | 'brightness-contrast'
  | 'levels'
  | 'curves'
  | 'hue-saturation'
  | 'color-balance'
  | 'exposure'
  | 'black-white'
  | 'invert'
  | 'gaussian-blur'
  | 'noise'
  | 'lut';

export interface LayerEffects {
  stroke?: {
    enabled: boolean;
    size: number; // 1 to 100
    color: string;
    opacity: number; // 0 to 1
    position: 'outside' | 'inside' | 'center';
  };
  dropShadow?: {
    enabled: boolean;
    distance: number; // 0 to 100
    angle: number; // 0 to 360
    blur: number; // 0 to 100
    color: string;
    opacity: number; // 0 to 1
  };
  outerGlow?: {
    enabled: boolean;
    size: number; // 0 to 100
    color: string;
    opacity: number; // 0 to 1
  };
  colorOverlay?: {
    enabled: boolean;
    color: string;
    opacity: number; // 0 to 1
  };
}

export interface LayerAdjustment {
  kind: AdjustmentType;
  brightness?: number; // -100 to 100
  contrast?: number; // -100 to 100
  levels?: {
    inBlack: number; // 0..255
    inMid: number; // 0.1..9.9 (default 1.0)
    inWhite: number; // 0..255
    outBlack: number; // 0..255
    outWhite: number; // 0..255
  };
  curves?: {
    rgb: { x: number; y: number }[];
    red?: { x: number; y: number }[];
    green?: { x: number; y: number }[];
    blue?: { x: number; y: number }[];
  };
  hue?: number; // -180 to 180
  saturation?: number; // -100 to 100
  lightness?: number; // -100 to 100
  colorize?: boolean;
  colorBalance?: {
    shadows: [number, number, number]; // cyan/red, magenta/green, yellow/blue (-100..100)
    midtones: [number, number, number];
    highlights: [number, number, number];
  };
  exposure?: number; // -5 to 5
  gamma?: number; // 0.1 to 3
  blurRadius?: number; // 1 to 100
  noiseAmount?: number; // 0 to 100
  lut?: {
    preset: 'portra-400' | 'teal-orange' | 'fuji-pro' | 'golden-hour' | 'cyberpunk' | 'bw-noir' | 'custom';
    intensity: number; // 0 to 100
    cubeData?: string;
  };
}

export interface LayerTransform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
}

export interface Layer {
  id: string;
  name: string;
  isVisible: boolean;
  isLocked?: boolean;
  opacity: number; // 0..1
  blendMode: BlendMode;
  transform: LayerTransform;
  canvas: HTMLCanvasElement;
  thumbnailUrl?: string;
  isGroup?: boolean;
  parentID?: string | null;
  isCollapsed?: boolean;
  maskCanvas?: HTMLCanvasElement | null;
  maskEnabled?: boolean;
  maskLinked?: boolean;
  isClippingMask?: boolean;
  isSmartObject?: boolean;
  smartObjectDoc?: KasenoDocument;
  effects?: LayerEffects | null;
  adjustment?: LayerAdjustment | null;
  text?: {
    content: string;
    fontFamily: string;
    fontSize: number;
    color: string;
    align: 'left' | 'center' | 'right';
    bold?: boolean;
    italic?: boolean;
  };
  shape?: {
    type: 'rect' | 'rounded-rect' | 'ellipse' | 'line';
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
    radius?: number;
  };
}

export interface CanvasGuide {
  id: string;
  axis: 'horizontal' | 'vertical';
  position: number; // In canvas pixels
}

export interface KasenoDocument {
  id: string;
  name: string;
  width: number;
  height: number;
  resolution: number; // DPI
  layers: Layer[];
  activeLayerID: string | null;
  guides: CanvasGuide[];
  history: HistoryState[];
  historyIndex: number;
}

export interface HistoryState {
  actionName: string;
  layersSnapshot: SerializedLayer[];
  width: number;
  height: number;
}

export interface SerializedLayer {
  id: string;
  name: string;
  isVisible: boolean;
  isLocked?: boolean;
  opacity: number;
  blendMode: BlendMode;
  transform: LayerTransform;
  dataUrl: string;
  maskDataUrl?: string;
  isGroup?: boolean;
  parentID?: string | null;
  isCollapsed?: boolean;
  maskEnabled?: boolean;
  maskLinked?: boolean;
  isClippingMask?: boolean;
  isSmartObject?: boolean;
  smartObjectDoc?: KasenoDocument;
  effects?: LayerEffects | null;
  adjustment?: LayerAdjustment | null;
  text?: Layer['text'];
  shape?: Layer['shape'];
}

export interface ToolSettings {
  brush: {
    size: number;
    hardness: number;
    opacity: number;
    flow: number;
    spacing: number;
  };
  eraser: {
    size: number;
    hardness: number;
    opacity: number;
  };
  wand: {
    tolerance: number;
    contiguous: boolean;
  };
  marquee: {
    feather: number;
    mode: 'new' | 'add' | 'subtract';
  };
  gradient: {
    type: 'linear' | 'radial';
  };
  type: {
    fontFamily: string;
    fontSize: number;
    color: string;
    align: 'left' | 'center' | 'right';
    bold: boolean;
    italic: boolean;
  };
  shape: {
    type: 'rect' | 'rounded-rect' | 'ellipse' | 'line';
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
    radius: number;
  };
  clone: {
    size: number;
    hardness: number;
    opacity: number;
    source: { x: number; y: number } | null;
  };
  crop: {
    aspectRatio: 'free' | '1:1' | '16:9' | '4:3';
  };
  warp: {
    gridDivisions: 3 | 4 | 5;
    divisions?: 3 | 4 | 5;
  };
  liquify: {
    size: number;
    strength: number;
    mode: 'push' | 'bloat' | 'pucker' | 'reconstruct';
  };
}

export interface SelectionArea {
  active: boolean;
  mask: Uint8Array | null; // width * height byte mask (255 = selected, 0 = not)
  bounds?: { x: number; y: number; width: number; height: number };
}
