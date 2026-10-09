import React, { useRef, useEffect, useState, useCallback } from 'react';
import { KasenoDocument, ToolType, ToolSettings, SelectionArea, Layer } from '../types/kaseno';
import { Renderer } from '../engine/Renderer';
import { BrushEngine, StrokePoint } from '../engine/BrushEngine';
import { SelectionEngine } from '../engine/SelectionEngine';
import { WarpEngine, WarpGridPoint } from '../engine/WarpEngine';
import { CanvasRulers } from './CanvasRulers';

interface CanvasViewportProps {
  doc: KasenoDocument;
  activeTool: ToolType;
  settings: ToolSettings;
  foregroundColor: string;
  backgroundColor: string;
  zoom: number;
  onZoomChange: (z: number) => void;
  selection: SelectionArea;
  onUpdateSelection: (sel: SelectionArea) => void;
  onUpdateLayer: (layerID: string, updater: (l: Layer) => Layer) => void;
  onCommitHistory: (actionName: string) => void;
  onPickColor?: (color: string) => void;
  warpGrid?: WarpGridPoint[][] | null;
  onWarpGridChange?: (grid: WarpGridPoint[][] | null) => void;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  doc,
  activeTool,
  settings,
  foregroundColor,
  backgroundColor,
  zoom,
  onZoomChange,
  selection,
  onUpdateSelection,
  onUpdateLayer,
  onCommitHistory,
  onPickColor,
  warpGrid,
  onWarpGridChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const compositeCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);
  const [lastPoint, setLastPoint] = useState<StrokePoint | null>(null);
  const [startPoint, setStartPoint] = useState<StrokePoint | null>(null);
  const [dashOffset, setDashOffset] = useState(0);

  const [draggingWarpPoint, setDraggingWarpPoint] = useState<{ r: number; c: number } | null>(null);
  const [hoverWarpPoint, setHoverWarpPoint] = useState<{ r: number; c: number } | null>(null);
  const [brushCursor, setBrushCursor] = useState<{ x: number; y: number } | null>(null);

  const activeLayer = doc.layers.find(l => l.id === doc.activeLayerID);

  // Center document on first load or resize
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPan({
        x: Math.round((rect.width - doc.width * zoom) / 2),
        y: Math.round((rect.height - doc.height * zoom) / 2),
      });
    }
  }, [doc.id]);

  // Animated marching ants loop
  useEffect(() => {
    if (!selection.active) return;
    const interval = setInterval(() => {
      setDashOffset(prev => (prev + 1) % 8);
    }, 80);
    return () => clearInterval(interval);
  }, [selection.active]);

  // Redraw composite document whenever layers or doc changes
  const redrawComposite = useCallback(() => {
    const canvas = compositeCanvasRef.current;
    if (!canvas) return;
    canvas.width = doc.width;
    canvas.height = doc.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    Renderer.renderDocument(ctx, doc.width, doc.height, doc.layers);
  }, [doc]);

  useEffect(() => {
    redrawComposite();
  }, [redrawComposite]);

  // Redraw overlay (marching ants, brush cursor, shape previews)
  useEffect(() => {
    const overlay = overlayCanvasRef.current;
    if (!overlay) return;
    overlay.width = doc.width;
    overlay.height = doc.height;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, doc.width, doc.height);

    // Render marching ants if selection is active
    if (selection.active && selection.mask) {
      SelectionEngine.renderMarchingAnts(ctx, selection.mask, doc.width, doc.height, dashOffset);
    }

    // Render Mesh Warp Grid and control points
    if (activeTool === 'warp' && warpGrid && activeLayer) {
      const rows = warpGrid.length;
      const cols = warpGrid[0].length;
      const lx = activeLayer.transform.x;
      const ly = activeLayer.transform.y;

      ctx.save();
      ctx.translate(lx, ly);

      // Draw grid lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
      ctx.lineWidth = 1.5;

      // Horizontal lines
      for (let r = 0; r < rows; r++) {
        ctx.beginPath();
        for (let c = 0; c < cols; c++) {
          const pt = warpGrid[r][c];
          if (c === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      }

      // Vertical lines
      for (let c = 0; c < cols; c++) {
        ctx.beginPath();
        for (let r = 0; r < rows; r++) {
          const pt = warpGrid[r][c];
          if (r === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      }

      // Draw control points
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const pt = warpGrid[r][c];
          const isDragging = draggingWarpPoint?.r === r && draggingWarpPoint?.c === c;
          const isHover = hoverWarpPoint?.r === r && hoverWarpPoint?.c === c;

          ctx.beginPath();
          ctx.arc(pt.x, pt.y, isDragging || isHover ? 6 : 4.5, 0, Math.PI * 2);
          ctx.fillStyle = isDragging ? '#fbbf24' : isHover ? '#38bdf8' : '#ffffff';
          ctx.fill();
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      ctx.restore();
    }

    // Render Liquify brush cursor
    if (activeTool === 'liquify' && brushCursor) {
      const radius = (settings.liquify?.size || 60) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(brushCursor.x, brushCursor.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();

      // Center dot
      ctx.beginPath();
      ctx.arc(brushCursor.x, brushCursor.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();
    }
  }, [doc.width, doc.height, selection, dashOffset, activeTool, warpGrid, activeLayer, draggingWarpPoint, hoverWarpPoint, brushCursor, settings.liquify?.size]);

  // Convert client viewport coordinates to canvas document pixel coordinates
  const clientToCanvas = (clientX: number, clientY: number): { x: number; y: number } => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.round((clientX - rect.left - pan.x) / zoom);
    const y = Math.round((clientY - rect.top - pan.y) / zoom);
    return { x, y };
  };

  // Keyboard spacebar listener for panning hand tool
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !spacePressed) {
        setSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [spacePressed]);

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      // Zoom anchored at cursor
      const zoomFactor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      const newZoom = Math.max(0.1, Math.min(32, zoom * zoomFactor));

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        setPan(prev => ({
          x: mouseX - (mouseX - prev.x) * (newZoom / zoom),
          y: mouseY - (mouseY - prev.y) * (newZoom / zoom),
        }));
        onZoomChange(newZoom);
      }
    } else {
      // Pan
      setPan(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  };

  // Pointer Down
  const handlePointerDown = (e: React.PointerEvent) => {
    if (spacePressed || activeTool === 'hand' || e.button === 1) {
      setIsPanning(true);
      setLastPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    if (!activeLayer || activeLayer.isLocked) return;

    const pt = clientToCanvas(e.clientX, e.clientY);
    setIsDrawing(true);
    setStartPoint(pt);
    setLastPoint(pt);

    // Warp tool point selection
    if (activeTool === 'warp' && warpGrid && activeLayer) {
      const lx = pt.x - activeLayer.transform.x;
      const ly = pt.y - activeLayer.transform.y;
      const hitRadius = 14 / zoom;

      for (let r = 0; r < warpGrid.length; r++) {
        for (let c = 0; c < warpGrid[0].length; c++) {
          const gp = warpGrid[r][c];
          if (Math.hypot(gp.x - lx, gp.y - ly) <= hitRadius) {
            setDraggingWarpPoint({ r, c });
            return;
          }
        }
      }
      return;
    }

    // Liquify tool deform start
    if (activeTool === 'liquify' && activeLayer) {
      const lx = pt.x - activeLayer.transform.x;
      const ly = pt.y - activeLayer.transform.y;
      WarpEngine.applyLiquify(
        activeLayer.canvas,
        lx,
        ly,
        (settings.liquify?.size || 60) / 2,
        settings.liquify?.strength || 0.5,
        settings.liquify?.mode || 'push',
        0,
        0
      );
      activeLayer.thumbnailUrl = Renderer.generateThumbnail(activeLayer);
      redrawComposite();
      return;
    }

    if (activeTool === 'eyedropper') {
      const compCanvas = compositeCanvasRef.current;
      if (compCanvas) {
        const ctx = compCanvas.getContext('2d');
        if (ctx) {
          const pixel = ctx.getImageData(pt.x, pt.y, 1, 1).data;
          const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`;
          onPickColor?.(hex);
        }
      }
      return;
    }

    if (activeTool === 'wand') {
      const compCanvas = compositeCanvasRef.current;
      if (compCanvas) {
        const ctx = compCanvas.getContext('2d');
        if (ctx) {
          const imgData = ctx.getImageData(0, 0, doc.width, doc.height);
          const mask = SelectionEngine.magicWand(
            imgData,
            pt.x,
            pt.y,
            settings.wand.tolerance,
            settings.wand.contiguous
          );
          onUpdateSelection({ active: true, mask });
        }
      }
      return;
    }

    if (activeTool === 'clone' && e.altKey) {
      // Pick source point for clone stamp
      onUpdateLayer(activeLayer.id, l => l);
      settings.clone.source = pt;
      return;
    }

    if (activeTool === 'brush' || activeTool === 'eraser' || activeTool === 'clone') {
      const ctx = activeLayer.canvas.getContext('2d');
      if (ctx) {
        if (activeTool === 'clone' && settings.clone.source) {
          const offset = { x: settings.clone.source.x - pt.x, y: settings.clone.source.y - pt.y };
          BrushEngine.cloneStampBetween(ctx, activeLayer.canvas, pt, pt, offset, settings.clone);
        } else {
          BrushEngine.strokeBetween(ctx, pt, pt, {
            color: foregroundColor,
            size: activeTool === 'eraser' ? settings.eraser.size : settings.brush.size,
            hardness: activeTool === 'eraser' ? settings.eraser.hardness : settings.brush.hardness,
            opacity: activeTool === 'eraser' ? settings.eraser.opacity : settings.brush.opacity,
            flow: activeTool === 'eraser' ? 1 : settings.brush.flow,
            isEraser: activeTool === 'eraser',
          });
        }
        activeLayer.thumbnailUrl = Renderer.generateThumbnail(activeLayer);
        redrawComposite();
      }
    }
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning && lastPoint) {
      const dx = e.clientX - lastPoint.x;
      const dy = e.clientY - lastPoint.y;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    const pt = clientToCanvas(e.clientX, e.clientY);
    setBrushCursor(pt);

    // Warp tool point drag & hover
    if (activeTool === 'warp' && warpGrid && activeLayer) {
      if (draggingWarpPoint && isDrawing) {
        const lx = pt.x - activeLayer.transform.x;
        const ly = pt.y - activeLayer.transform.y;
        const newGrid = warpGrid.map(row => row.map(cell => ({ ...cell })));
        newGrid[draggingWarpPoint.r][draggingWarpPoint.c].x = lx;
        newGrid[draggingWarpPoint.r][draggingWarpPoint.c].y = ly;
        onWarpGridChange?.(newGrid);
      } else {
        const lx = pt.x - activeLayer.transform.x;
        const ly = pt.y - activeLayer.transform.y;
        const hitRadius = 14 / zoom;
        let foundHover: { r: number; c: number } | null = null;
        for (let r = 0; r < warpGrid.length; r++) {
          for (let c = 0; c < warpGrid[0].length; c++) {
            const gp = warpGrid[r][c];
            if (Math.hypot(gp.x - lx, gp.y - ly) <= hitRadius) {
              foundHover = { r, c };
              break;
            }
          }
          if (foundHover) break;
        }
        setHoverWarpPoint(foundHover);
      }
      return;
    }

    // Liquify tool deform drag
    if (activeTool === 'liquify' && activeLayer && isDrawing && lastPoint) {
      const lx = pt.x - activeLayer.transform.x;
      const ly = pt.y - activeLayer.transform.y;
      const dx = pt.x - lastPoint.x;
      const dy = pt.y - lastPoint.y;
      WarpEngine.applyLiquify(
        activeLayer.canvas,
        lx,
        ly,
        (settings.liquify?.size || 60) / 2,
        settings.liquify?.strength || 0.5,
        settings.liquify?.mode || 'push',
        dx,
        dy
      );
      setLastPoint(pt);
      activeLayer.thumbnailUrl = Renderer.generateThumbnail(activeLayer);
      redrawComposite();
      return;
    }

    if (!isDrawing || !lastPoint) return;

    if (activeTool === 'brush' || activeTool === 'eraser' || activeTool === 'clone') {
      if (!activeLayer) return;
      const ctx = activeLayer.canvas.getContext('2d');
      if (ctx) {
        if (activeTool === 'clone' && settings.clone.source) {
          const offset = { x: settings.clone.source.x - pt.x, y: settings.clone.source.y - pt.y };
          BrushEngine.cloneStampBetween(ctx, activeLayer.canvas, lastPoint, pt, offset, settings.clone);
        } else {
          BrushEngine.strokeBetween(ctx, lastPoint, pt, {
            color: foregroundColor,
            size: activeTool === 'eraser' ? settings.eraser.size : settings.brush.size,
            hardness: activeTool === 'eraser' ? settings.eraser.hardness : settings.brush.hardness,
            opacity: activeTool === 'eraser' ? settings.eraser.opacity : settings.brush.opacity,
            flow: activeTool === 'eraser' ? 1 : settings.brush.flow,
            isEraser: activeTool === 'eraser',
          });
        }
        redrawComposite();
      }
      setLastPoint(pt);
      return;
    }

    if (activeTool === 'move' && activeLayer) {
      const dx = pt.x - lastPoint.x;
      const dy = pt.y - lastPoint.y;
      onUpdateLayer(activeLayer.id, l => ({
        ...l,
        transform: { ...l.transform, x: l.transform.x + dx, y: l.transform.y + dy }
      }));
      setLastPoint(pt);
      redrawComposite();
      return;
    }

    // Dynamic selection rectangle preview
    if ((activeTool === 'marquee-rect' || activeTool === 'marquee-ellipse') && startPoint) {
      const overlay = overlayCanvasRef.current;
      if (overlay) {
        const ctx = overlay.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, doc.width, doc.height);
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          const rect = {
            x: Math.min(startPoint.x, pt.x),
            y: Math.min(startPoint.y, pt.y),
            width: Math.abs(pt.x - startPoint.x),
            height: Math.abs(pt.y - startPoint.y),
          };
          if (activeTool === 'marquee-rect') {
            ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
          } else {
            ctx.beginPath();
            ctx.ellipse(rect.x + rect.width / 2, rect.y + rect.height / 2, rect.width / 2, rect.height / 2, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }
    }
  };

  // Pointer Up
  const handlePointerUp = (e: React.PointerEvent) => {
    if (isPanning) {
      setIsPanning(false);
      setLastPoint(null);
      return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);

    if (activeTool === 'warp') {
      setDraggingWarpPoint(null);
      setStartPoint(null);
      setLastPoint(null);
      return;
    }

    if (activeTool === 'liquify') {
      if (activeLayer) {
        activeLayer.thumbnailUrl = Renderer.generateThumbnail(activeLayer);
      }
      onCommitHistory('Liquify');
      setStartPoint(null);
      setLastPoint(null);
      return;
    }

    const pt = clientToCanvas(e.clientX, e.clientY);

    // Commit Marquee selection
    if (startPoint && (activeTool === 'marquee-rect' || activeTool === 'marquee-ellipse')) {
      const rect = {
        x: Math.min(startPoint.x, pt.x),
        y: Math.min(startPoint.y, pt.y),
        width: Math.abs(pt.x - startPoint.x),
        height: Math.abs(pt.y - startPoint.y),
      };
      if (rect.width > 2 && rect.height > 2) {
        const mask = activeTool === 'marquee-rect'
          ? SelectionEngine.createRectSelection(doc.width, doc.height, rect, settings.marquee.feather)
          : SelectionEngine.createEllipseSelection(doc.width, doc.height, rect, settings.marquee.feather);
        onUpdateSelection({ active: true, mask, bounds: rect });
      }
    }

    // Commit Shape
    if (startPoint && activeTool === 'shape' && activeLayer) {
      const ctx = activeLayer.canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = foregroundColor;
        ctx.strokeStyle = backgroundColor;
        ctx.lineWidth = settings.shape.strokeWidth;
        const x = Math.min(startPoint.x, pt.x);
        const y = Math.min(startPoint.y, pt.y);
        const w = Math.abs(pt.x - startPoint.x);
        const h = Math.abs(pt.y - startPoint.y);

        if (settings.shape.type === 'rect') {
          ctx.fillRect(x, y, w, h);
          if (settings.shape.strokeWidth > 0) ctx.strokeRect(x, y, w, h);
        } else if (settings.shape.type === 'ellipse') {
          ctx.beginPath();
          ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
          ctx.fill();
          if (settings.shape.strokeWidth > 0) ctx.stroke();
        } else if (settings.shape.type === 'rounded-rect') {
          ctx.beginPath();
          ctx.roundRect(x, y, w, h, settings.shape.radius);
          ctx.fill();
          if (settings.shape.strokeWidth > 0) ctx.stroke();
        }
        activeLayer.thumbnailUrl = Renderer.generateThumbnail(activeLayer);
        redrawComposite();
      }
    }

    // Commit Type
    if (startPoint && activeTool === 'type' && activeLayer) {
      const text = prompt('Enter text:');
      if (text) {
        const ctx = activeLayer.canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = foregroundColor;
          ctx.font = `${settings.type.bold ? 'bold ' : ''}${settings.type.italic ? 'italic ' : ''}${settings.type.fontSize}px ${settings.type.fontFamily}`;
          ctx.fillText(text, pt.x, pt.y);
          activeLayer.thumbnailUrl = Renderer.generateThumbnail(activeLayer);
          redrawComposite();
        }
      }
    }

    if (activeLayer) {
      activeLayer.thumbnailUrl = Renderer.generateThumbnail(activeLayer);
    }
    onCommitHistory(activeTool);
    setStartPoint(null);
    setLastPoint(null);
  };

  return (
    <div
      ref={containerRef}
      className="studio-viewport"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => {
        setBrushCursor(null);
        setHoverWarpPoint(null);
      }}
      style={{
        cursor: spacePressed || isPanning || activeTool === 'hand'
          ? 'grab'
          : activeTool === 'brush' || activeTool === 'eraser'
          ? 'crosshair'
          : activeTool === 'eyedropper'
          ? 'cell'
          : 'default',
      }}
    >
      {/* Centered Document Wrapper */}
      <div
        className="canvas-checkerboard"
        style={{
          position: 'absolute',
          left: pan.x,
          top: pan.y,
          width: doc.width * zoom,
          height: doc.height * zoom,
          transformOrigin: 'top left',
        }}
      >
        {/* Layer Composite Canvas */}
        <canvas
          ref={compositeCanvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            imageRendering: zoom >= 2 ? 'pixelated' : 'auto',
          }}
        />

        {/* Selection & Drawing Overlay Canvas */}
        <canvas
          ref={overlayCanvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Canvas Rulers (Top & Left matching CanvasRulers.swift) */}
      {containerRef.current && (
        <CanvasRulers
          width={containerRef.current.clientWidth}
          height={containerRef.current.clientHeight}
          zoom={zoom}
          pan={pan}
        />
      )}
    </div>
  );
};
