import React from 'react';
import { 
  Move, Square, Circle, Wand2, Crop, Pipette, 
  Paintbrush, Stamp, Eraser, Spline, Type, Shapes, 
  Hand, ZoomIn, ArrowUpDown, RefreshCcw, Droplets, Blend,
  Grid3x3, Waves
} from 'lucide-react';
import { ToolType } from '../types/kaseno';

interface ToolBarProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  foregroundColor: string;
  backgroundColor: string;
  onOpenColorPicker: (type: 'fg' | 'bg') => void;
  onSwapColors: () => void;
  onResetColors: () => void;
}

export const ToolBar: React.FC<ToolBarProps> = ({
  activeTool,
  onSelectTool,
  foregroundColor,
  backgroundColor,
  onOpenColorPicker,
  onSwapColors,
  onResetColors,
}) => {
  const tools: { id: ToolType; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { id: 'move', label: 'Move Tool', icon: <Move size={17} />, shortcut: 'V' },
    { id: 'marquee-rect', label: 'Marquee Tool', icon: <Square size={17} />, shortcut: 'M' },
    { id: 'lasso', label: 'Lasso Tool', icon: <Spline size={17} />, shortcut: 'L' },
    { id: 'wand', label: 'Magic Wand / Object Selection', icon: <Wand2 size={17} />, shortcut: 'W' },
    { id: 'crop', label: 'Crop Tool', icon: <Crop size={17} />, shortcut: 'C' },
    { id: 'warp', label: 'Mesh Warp Tool', icon: <Grid3x3 size={17} />, shortcut: 'K' },
    { id: 'liquify', label: 'Liquify Push & Bloat Tool', icon: <Waves size={17} />, shortcut: 'J' },
    { id: 'eyedropper', label: 'Eyedropper', icon: <Pipette size={17} />, shortcut: 'I' },
    { id: 'brush', label: 'Brush Tool', icon: <Paintbrush size={17} />, shortcut: 'B' },
    { id: 'clone', label: 'Clone Stamp Tool', icon: <Stamp size={17} />, shortcut: 'S' },
    { id: 'smudge', label: 'Blur & Smear Tool', icon: <Droplets size={17} />, shortcut: 'R' },
    { id: 'eraser', label: 'Eraser Tool', icon: <Eraser size={17} />, shortcut: 'E' },
    { id: 'gradient', label: 'Gradient Tool', icon: <Blend size={17} />, shortcut: 'G' },
    { id: 'type', label: 'Type Tool', icon: <Type size={17} />, shortcut: 'T' },
    { id: 'shape', label: 'Shape Tool', icon: <Shapes size={17} />, shortcut: 'U' },
    { id: 'hand', label: 'Hand Tool', icon: <Hand size={17} />, shortcut: 'H' },
    { id: 'zoom', label: 'Zoom Tool', icon: <ZoomIn size={17} />, shortcut: 'Z' },
  ];

  return (
    <div className="studio-toolbar">
      {tools.map((tool) => (
        <button
          key={tool.id}
          className={`tool-button ${activeTool === tool.id ? 'active' : ''}`}
          onClick={() => onSelectTool(tool.id)}
          title={`${tool.label} (${tool.shortcut})`}
        >
          {tool.icon}
        </button>
      ))}

      <div style={{ flex: 1, minHeight: 10 }} />

      {/* ColorPaletteControls matching Kaseno ColorPaletteControls.swift */}
      <div style={{ position: 'relative', width: 36, height: 36, marginTop: 4, marginBottom: 8 }}>
        {/* Background Swatch (offset x:12, y:12) */}
        <div
          onClick={() => onOpenColorPicker('bg')}
          style={{
            position: 'absolute',
            left: 12,
            top: 12,
            width: 24,
            height: 24,
            borderRadius: 6,
            backgroundColor: backgroundColor,
            border: '1.5px solid #ffffff',
            boxShadow: '0 0 0 1px #000000, 0 2px 4px rgba(0,0,0,0.5)',
            cursor: 'pointer',
            zIndex: 1,
          }}
          title="Background color"
        />

        {/* Foreground Swatch (top left) */}
        <div
          onClick={() => onOpenColorPicker('fg')}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 24,
            height: 24,
            borderRadius: 6,
            backgroundColor: foregroundColor,
            border: '1.5px solid #ffffff',
            boxShadow: '0 0 0 1px #000000, 0 2px 4px rgba(0,0,0,0.5)',
            cursor: 'pointer',
            zIndex: 2,
          }}
          title="Foreground color"
        />

        {/* Swap Colors Button (45 deg angle arrow, top-right) */}
        <button
          type="button"
          onClick={onSwapColors}
          style={{
            position: 'absolute',
            right: -6,
            top: -4,
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 1,
            zIndex: 3,
            display: 'flex',
            alignItems: 'center',
          }}
          title="Swap foreground and background (X)"
        >
          <ArrowUpDown size={11} style={{ transform: 'rotate(45deg)' }} />
        </button>

        {/* Reset Colors Button (Default black/white, bottom-left) */}
        <button
          type="button"
          onClick={onResetColors}
          style={{
            position: 'absolute',
            left: -4,
            bottom: -6,
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 1,
            zIndex: 3,
            display: 'flex',
            alignItems: 'center',
          }}
          title="Default colors (D)"
        >
          <RefreshCcw size={9} />
        </button>
      </div>
    </div>
  );
};
