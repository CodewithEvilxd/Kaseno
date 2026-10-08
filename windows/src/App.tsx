import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  KasenoDocument, Layer, ToolType, ToolSettings, SelectionArea, 
  AdjustmentType, LayerAdjustment, BlendMode, LayerEffects
} from './types/kaseno';
import { TitleBar } from './components/TitleBar';
import { ToolHeader } from './components/ToolHeader';
import { ToolBar } from './components/ToolBar';
import { CanvasViewport } from './components/CanvasViewport';
import { LayersPanel } from './components/LayersPanel';
import { AdjustmentsPanel } from './components/AdjustmentsPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { ColorPickerModal } from './components/ColorPickerModal';
import { NewCanvasModal } from './components/NewCanvasModal';
import { AdjustmentModal } from './components/AdjustmentModal';
import { LayerEffectsModal } from './components/LayerEffectsModal';
import { ExportModal } from './components/ExportModal';
import { StatusBar } from './components/StatusBar';
import { Renderer } from './engine/Renderer';
import { ProjectIO } from './engine/ProjectIO';
import { BackgroundRemovalEngine } from './engine/BackgroundRemovalEngine';
import { WarpEngine, WarpGridPoint } from './engine/WarpEngine';

const DEFAULT_TOOL_SETTINGS: ToolSettings = {
  brush: { size: 30, hardness: 0.8, opacity: 1.0, flow: 1.0, spacing: 0.1 },
  eraser: { size: 40, hardness: 0.8, opacity: 1.0 },
  wand: { tolerance: 32, contiguous: true },
  marquee: { feather: 0, mode: 'new' },
  gradient: { type: 'linear' },
  type: {
    fontFamily: 'Segoe UI, sans-serif',
    fontSize: 48,
    color: '#f4f4f5',
    align: 'left',
    bold: false,
    italic: false,
  },
  shape: {
    type: 'rect',
    fillColor: '#06b6d4',
    strokeColor: '#ffffff',
    strokeWidth: 2,
    radius: 8,
  },
  clone: { size: 30, hardness: 0.8, opacity: 1.0, source: null },
  crop: { aspectRatio: 'free' },
  warp: { gridDivisions: 3, divisions: 3 },
  liquify: { size: 60, strength: 0.5, mode: 'push' },
};

function createInitialDocument(): KasenoDocument {
  const width = 1920;
  const height = 1080;

  // Background layer with subtle sample studio artwork
  const bgCanvas = document.createElement('canvas');
  bgCanvas.width = width;
  bgCanvas.height = height;
  const ctx = bgCanvas.getContext('2d');
  if (ctx) {
    // Elegant dark studio gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#12131a');
    grad.addColorStop(0.5, '#181b26');
    grad.addColorStop(1, '#0c0d12');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Subtle glow accent
    const glow = ctx.createRadialGradient(width * 0.5, height * 0.45, 50, width * 0.5, height * 0.45, 600);
    glow.addColorStop(0, 'rgba(6, 182, 212, 0.12)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }

  const bgLayer: Layer = {
    id: crypto.randomUUID(),
    name: 'Background',
    isVisible: true,
    isLocked: true,
    opacity: 1,
    blendMode: 'normal',
    transform: { x: 0, y: 0, width, height, rotation: 0, flipX: false, flipY: false },
    canvas: bgCanvas,
  };
  bgLayer.thumbnailUrl = Renderer.generateThumbnail(bgLayer);

  // New paintable layer on top
  const paintCanvas = document.createElement('canvas');
  paintCanvas.width = width;
  paintCanvas.height = height;

  const paintLayer: Layer = {
    id: crypto.randomUUID(),
    name: 'Layer 1',
    isVisible: true,
    opacity: 1,
    blendMode: 'normal',
    transform: { x: 0, y: 0, width, height, rotation: 0, flipX: false, flipY: false },
    canvas: paintCanvas,
  };
  paintLayer.thumbnailUrl = Renderer.generateThumbnail(paintLayer);

  const doc: KasenoDocument = {
    id: crypto.randomUUID(),
    name: 'Kaseno Studio-1',
    width,
    height,
    resolution: 72,
    layers: [bgLayer, paintLayer],
    activeLayerID: paintLayer.id,
    guides: [],
    history: [
      {
        actionName: 'Initial Canvas',
        layersSnapshot: [
          {
            id: bgLayer.id,
            name: bgLayer.name,
            isVisible: true,
            isLocked: true,
            opacity: 1,
            blendMode: 'normal',
            transform: { ...bgLayer.transform },
            dataUrl: bgCanvas.toDataURL(),
          },
          {
            id: paintLayer.id,
            name: paintLayer.name,
            isVisible: true,
            opacity: 1,
            blendMode: 'normal',
            transform: { ...paintLayer.transform },
            dataUrl: paintCanvas.toDataURL(),
          },
        ],
        width,
        height,
      },
    ],
    historyIndex: 0,
  };

  return doc;
}

export const App: React.FC = () => {
  const [documents, setDocuments] = useState<KasenoDocument[]>([createInitialDocument()]);
  const [activeDocIndex, setActiveDocIndex] = useState<number>(0);
  const [activeTool, setActiveTool] = useState<ToolType>('brush');
  const [toolSettings, setToolSettings] = useState<ToolSettings>(DEFAULT_TOOL_SETTINGS);
  const [foregroundColor, setForegroundColor] = useState<string>('#06b6d4');
  const [backgroundColor, setBackgroundColor] = useState<string>('#ffffff');
  const [zoom, setZoom] = useState<number>(0.7);
  const [selection, setSelection] = useState<SelectionArea>({ active: false, mask: null });
  const [layersPanelWidth, setLayersPanelWidth] = useState<number>(252);

  // Modals
  const [isNewCanvasModalOpen, setIsNewCanvasModalOpen] = useState(false);
  const [colorPickerState, setColorPickerState] = useState<{ isOpen: boolean; type: 'fg' | 'bg' }>({
    isOpen: false,
    type: 'fg',
  });
  const [adjustmentModalState, setAdjustmentModalState] = useState<{
    isOpen: boolean;
    kind: AdjustmentType;
    isEditingActive?: boolean;
  }>({
    isOpen: false,
    kind: 'brightness-contrast',
  });
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [layerEffectsModalState, setLayerEffectsModalState] = useState<{
    isOpen: boolean;
    layerID: string | null;
  }>({
    isOpen: false,
    layerID: null,
  });
  const [warpGrid, setWarpGrid] = useState<WarpGridPoint[][] | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeDoc = documents[activeDocIndex] || documents[0];
  const activeLayer = activeDoc?.layers.find(l => l.id === activeDoc.activeLayerID) || null;

  // Update active document helper
  const updateActiveDoc = useCallback((updater: (prev: KasenoDocument) => KasenoDocument) => {
    setDocuments(prevDocs => {
      const next = [...prevDocs];
      if (next[activeDocIndex]) {
        next[activeDocIndex] = updater(next[activeDocIndex]);
      }
      return next;
    });
  }, [activeDocIndex]);

  // Layer Updater
  const handleUpdateLayer = useCallback((layerID: string, updater: (l: Layer) => Layer) => {
    updateActiveDoc(doc => {
      const newLayers = doc.layers.map(layer => {
        if (layer.id === layerID) {
          const updated = updater(layer);
          updated.thumbnailUrl = Renderer.generateThumbnail(updated);
          return updated;
        }
        return layer;
      });
      return { ...doc, layers: newLayers };
    });
  }, [updateActiveDoc]);

  // Commit history state
  const handleCommitHistory = useCallback((actionName: string) => {
    updateActiveDoc(doc => {
      const snapshot = doc.layers.map(l => ({
        id: l.id,
        name: l.name,
        isVisible: l.isVisible,
        isLocked: l.isLocked,
        opacity: l.opacity,
        blendMode: l.blendMode,
        transform: { ...l.transform },
        dataUrl: l.canvas.toDataURL(),
        maskDataUrl: l.maskCanvas?.toDataURL(),
        maskEnabled: l.maskEnabled,
        maskLinked: l.maskLinked,
        isClippingMask: l.isClippingMask,
        adjustment: l.adjustment ? JSON.parse(JSON.stringify(l.adjustment)) : null,
        effects: l.effects ? JSON.parse(JSON.stringify(l.effects)) : undefined,
        isSmartObject: l.isSmartObject,
        smartObjectDoc: l.smartObjectDoc ? JSON.parse(JSON.stringify(l.smartObjectDoc)) : undefined,
        text: l.text ? { ...l.text } : undefined,
        shape: l.shape ? { ...l.shape } : undefined,
      }));

      const newHistory = doc.history.slice(0, doc.historyIndex + 1);
      newHistory.push({
        actionName,
        layersSnapshot: snapshot,
        width: doc.width,
        height: doc.height,
      });

      // Keep max 50 history steps
      if (newHistory.length > 50) newHistory.shift();

      return {
        ...doc,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, [updateActiveDoc]);

  // Restore state from snapshot
  const restoreSnapshot = useCallback(async (stateIndex: number) => {
    const state = activeDoc.history[stateIndex];
    if (!state) return;

    const restoredLayers: Layer[] = [];
    for (const snap of state.layersSnapshot) {
      const img = new Image();
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.src = snap.dataUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = snap.transform.width;
      canvas.height = snap.transform.height;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(img, 0, 0);

      let maskCanvas: HTMLCanvasElement | null = null;
      if (snap.maskDataUrl) {
        const maskImg = new Image();
        await new Promise<void>((resolve) => {
          maskImg.onload = () => resolve();
          maskImg.src = snap.maskDataUrl!;
        });
        maskCanvas = document.createElement('canvas');
        maskCanvas.width = canvas.width;
        maskCanvas.height = canvas.height;
        const mctx = maskCanvas.getContext('2d');
        if (mctx) mctx.drawImage(maskImg, 0, 0);
      }

      const layer: Layer = {
        id: snap.id,
        name: snap.name,
        isVisible: snap.isVisible,
        isLocked: snap.isLocked,
        opacity: snap.opacity,
        blendMode: snap.blendMode,
        transform: snap.transform,
        canvas,
        maskCanvas,
        maskEnabled: snap.maskEnabled,
        maskLinked: snap.maskLinked,
        isClippingMask: snap.isClippingMask,
        adjustment: snap.adjustment,
        effects: snap.effects,
        isSmartObject: snap.isSmartObject,
        smartObjectDoc: snap.smartObjectDoc,
        text: snap.text,
        shape: snap.shape,
      };
      layer.thumbnailUrl = Renderer.generateThumbnail(layer);
      restoredLayers.push(layer);
    }

    updateActiveDoc(doc => ({
      ...doc,
      layers: restoredLayers,
      historyIndex: stateIndex,
      activeLayerID: restoredLayers.some(l => l.id === doc.activeLayerID)
        ? doc.activeLayerID
        : restoredLayers[restoredLayers.length - 1]?.id || null,
    }));
  }, [activeDoc, updateActiveDoc]);

  const handleUndo = useCallback(() => {
    if (activeDoc && activeDoc.historyIndex > 0) {
      restoreSnapshot(activeDoc.historyIndex - 1);
    }
  }, [activeDoc, restoreSnapshot]);

  const handleRedo = useCallback(() => {
    if (activeDoc && activeDoc.historyIndex < activeDoc.history.length - 1) {
      restoreSnapshot(activeDoc.historyIndex + 1);
    }
  }, [activeDoc, restoreSnapshot]);

  const handleFitCanvas = useCallback(() => {
    if (activeDoc) {
      const margin = 80;
      const availW = window.innerWidth - 56 - layersPanelWidth - margin;
      const availH = window.innerHeight - 38 - 42 - 30 - margin;
      const scale = Math.min(availW / activeDoc.width, availH / activeDoc.height);
      setZoom(Math.max(0.05, Math.min(5, scale)));
    }
  }, [activeDoc, layersPanelWidth]);

  const handleActualPixels = useCallback(() => {
    setZoom(1.0);
  }, []);

  // Layer Operations
  const handleSelectLayer = (layerID: string) => {
    updateActiveDoc(doc => ({ ...doc, activeLayerID: layerID }));
  };

  const handleNewLayer = () => {
    const newCanvas = document.createElement('canvas');
    newCanvas.width = activeDoc.width;
    newCanvas.height = activeDoc.height;

    const newLayer: Layer = {
      id: crypto.randomUUID(),
      name: `Layer ${activeDoc.layers.length + 1}`,
      isVisible: true,
      opacity: 1,
      blendMode: 'normal',
      transform: { x: 0, y: 0, width: activeDoc.width, height: activeDoc.height, rotation: 0, flipX: false, flipY: false },
      canvas: newCanvas,
    };
    newLayer.thumbnailUrl = Renderer.generateThumbnail(newLayer);

    updateActiveDoc(doc => ({
      ...doc,
      layers: [...doc.layers, newLayer],
      activeLayerID: newLayer.id,
    }));
    handleCommitHistory(`New Layer (${newLayer.name})`);
  };

  const handleDuplicateLayer = (layerID: string) => {
    const target = activeDoc.layers.find(l => l.id === layerID);
    if (!target) return;

    const cloned = Renderer.cloneLayer(target, true);
    const targetIdx = activeDoc.layers.findIndex(l => l.id === layerID);
    const newLayers = [...activeDoc.layers];
    newLayers.splice(targetIdx + 1, 0, cloned);

    updateActiveDoc(doc => ({
      ...doc,
      layers: newLayers,
      activeLayerID: cloned.id,
    }));
    handleCommitHistory(`Duplicate ${target.name}`);
  };

  const handleDeleteLayer = (layerID: string) => {
    if (activeDoc.layers.length <= 1) return;
    const remaining = activeDoc.layers.filter(l => l.id !== layerID);
    updateActiveDoc(doc => ({
      ...doc,
      layers: remaining,
      activeLayerID: remaining[remaining.length - 1].id,
    }));
    handleCommitHistory('Delete Layer');
  };

  const handleReorderLayers = (sourceIndex: number, targetIndex: number) => {
    updateActiveDoc(doc => {
      const copy = [...doc.layers];
      const [moved] = copy.splice(sourceIndex, 1);
      copy.splice(targetIndex, 0, moved);
      return { ...doc, layers: copy };
    });
    handleCommitHistory('Reorder Layers');
  };

  const handleAddMask = (layerID: string) => {
    const target = activeDoc.layers.find(l => l.id === layerID);
    if (!target) return;

    if (target.maskCanvas) {
      // Toggle or remove
      handleUpdateLayer(layerID, l => ({ ...l, maskEnabled: !l.maskEnabled }));
    } else {
      // Create fresh white mask
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = target.canvas.width;
      maskCanvas.height = target.canvas.height;
      const mctx = maskCanvas.getContext('2d');
      if (mctx) {
        mctx.fillStyle = '#ffffff';
        mctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
      }
      handleUpdateLayer(layerID, l => ({
        ...l,
        maskCanvas,
        maskEnabled: true,
        maskLinked: true,
      }));
      handleCommitHistory('Add Layer Mask');
    }
  };

  // Adjustments launcher
  const handleOpenAdjustment = (kind: AdjustmentType) => {
    setAdjustmentModalState({
      isOpen: true,
      kind,
      isEditingActive: false,
    });
  };

  const handleEditActiveAdjustment = () => {
    if (activeLayer?.adjustment) {
      setAdjustmentModalState({
        isOpen: true,
        kind: activeLayer.adjustment.kind,
        isEditingActive: true,
      });
    }
  };

  const handleConfirmAdjustment = (adj: LayerAdjustment) => {
    if (adjustmentModalState.isEditingActive && activeLayer) {
      // Update active layer's adjustment directly
      handleUpdateLayer(activeLayer.id, l => ({ ...l, adjustment: adj }));
      handleCommitHistory(`Edit ${adj.kind}`);
    } else {
      // Create new adjustment layer
      const adjCanvas = document.createElement('canvas');
      adjCanvas.width = activeDoc.width;
      adjCanvas.height = activeDoc.height;

      const adjLayer: Layer = {
        id: crypto.randomUUID(),
        name: `${adj.kind.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())} 1`,
        isVisible: true,
        opacity: 1,
        blendMode: 'normal',
        transform: { x: 0, y: 0, width: activeDoc.width, height: activeDoc.height, rotation: 0, flipX: false, flipY: false },
        canvas: adjCanvas,
        adjustment: adj,
      };
      adjLayer.thumbnailUrl = Renderer.generateThumbnail(adjLayer);

      updateActiveDoc(doc => ({
        ...doc,
        layers: [...doc.layers, adjLayer],
        activeLayerID: adjLayer.id,
      }));
      handleCommitHistory(`Add ${adj.kind} Adjustment`);
    }
  };

  // Synchronize warp grid when tool or active layer changes
  useEffect(() => {
    if (activeTool === 'warp' && activeLayer) {
      const divs = (toolSettings.warp?.divisions || toolSettings.warp?.gridDivisions || 3) as 3 | 4 | 5;
      if (!warpGrid || warpGrid.length !== divs + 1) {
        setWarpGrid(WarpEngine.createGrid(activeLayer.transform.width, activeLayer.transform.height, divs));
      }
    } else if (activeTool !== 'warp' && warpGrid) {
      setWarpGrid(null);
    }
  }, [activeTool, activeLayer?.id, toolSettings.warp?.divisions, toolSettings.warp?.gridDivisions]);

  // Layer Effects launcher & confirmation
  const handleOpenEffects = useCallback((layerID?: string) => {
    setLayerEffectsModalState({
      isOpen: true,
      layerID: layerID || activeDoc?.activeLayerID || null,
    });
  }, [activeDoc?.activeLayerID]);

  const handleConfirmLayerEffects = useCallback((effects: LayerEffects) => {
    const targetID = layerEffectsModalState.layerID || activeDoc?.activeLayerID;
    if (!targetID) return;
    handleUpdateLayer(targetID, l => ({
      ...l,
      effects,
    }));
    handleCommitHistory('Layer Styles (fx)');
    setLayerEffectsModalState({ isOpen: false, layerID: null });
  }, [layerEffectsModalState.layerID, activeDoc?.activeLayerID, handleUpdateLayer, handleCommitHistory]);

  // AI & Smart Background Removal
  const handleRemoveBackground = useCallback(async (layerID?: string) => {
    const targetID = layerID || activeDoc?.activeLayerID;
    const target = activeDoc.layers.find(l => l.id === targetID);
    if (!target) return;
    const mask = await BackgroundRemovalEngine.removeBackground(target.canvas);
    handleUpdateLayer(target.id, l => ({
      ...l,
      maskCanvas: mask,
      maskEnabled: true,
      maskLinked: true,
    }));
    handleCommitHistory('Remove Background (AI)');
  }, [activeDoc, handleUpdateLayer, handleCommitHistory]);

  // AI Smart Select Subject
  const handleSelectSubject = useCallback(async () => {
    if (!activeLayer) return;
    const maskCanvas = await BackgroundRemovalEngine.removeBackground(activeLayer.canvas);
    const mctx = maskCanvas.getContext('2d');
    if (!mctx) return;
    const imgData = mctx.getImageData(0, 0, activeDoc.width, activeDoc.height).data;
    const uint8Mask = new Uint8Array(activeDoc.width * activeDoc.height);
    for (let i = 0; i < uint8Mask.length; i++) {
      uint8Mask[i] = imgData[i * 4];
    }
    setSelection({
      active: true,
      mask: uint8Mask,
      bounds: { x: 0, y: 0, width: activeDoc.width, height: activeDoc.height },
    });
  }, [activeLayer, activeDoc.width, activeDoc.height]);

  // Smart Pre-Compositions / Nested Smart Objects
  const handleConvertToSmartObject = useCallback((layerID: string) => {
    const target = activeDoc.layers.find(l => l.id === layerID);
    if (!target || target.isSmartObject) return;

    const clonedCanvas = document.createElement('canvas');
    clonedCanvas.width = target.canvas.width;
    clonedCanvas.height = target.canvas.height;
    const cCtx = clonedCanvas.getContext('2d');
    if (cCtx) cCtx.drawImage(target.canvas, 0, 0);

    const subLayer: Layer = {
      id: crypto.randomUUID(),
      name: target.name,
      isVisible: true,
      opacity: 1,
      blendMode: 'normal',
      transform: { x: 0, y: 0, width: target.transform.width, height: target.transform.height, rotation: 0, flipX: false, flipY: false },
      canvas: clonedCanvas,
    };
    subLayer.thumbnailUrl = Renderer.generateThumbnail(subLayer);

    const smartObjectDoc: KasenoDocument = {
      id: crypto.randomUUID(),
      name: `${target.name} [Smart Object]`,
      width: target.transform.width,
      height: target.transform.height,
      resolution: activeDoc.resolution,
      layers: [subLayer],
      activeLayerID: subLayer.id,
      guides: [],
      history: [{
        actionName: 'Initial State',
        layersSnapshot: [{
          id: subLayer.id,
          name: subLayer.name,
          isVisible: true,
          opacity: 1,
          blendMode: 'normal',
          transform: { ...subLayer.transform },
          dataUrl: clonedCanvas.toDataURL(),
        }],
        width: subLayer.transform.width,
        height: subLayer.transform.height,
      }],
      historyIndex: 0,
    };

    handleUpdateLayer(target.id, l => ({
      ...l,
      name: `${l.name} (Smart Object)`,
      isSmartObject: true,
      smartObjectDoc,
    }));
    handleCommitHistory('Convert to Smart Object');
  }, [activeDoc, handleUpdateLayer, handleCommitHistory]);

  const handleOpenSmartObject = useCallback((layerID: string) => {
    const target = activeDoc.layers.find(l => l.id === layerID);
    if (!target || !target.isSmartObject || !target.smartObjectDoc) return;
    const existingIndex = documents.findIndex(d => d.id === target.smartObjectDoc!.id);
    if (existingIndex >= 0) {
      setActiveDocIndex(existingIndex);
    } else {
      setDocuments(prev => [...prev, target.smartObjectDoc!]);
      setActiveDocIndex(documents.length);
    }
  }, [activeDoc.layers, documents]);

  // Mesh Warp Apply & Reset
  const handleApplyWarp = useCallback(() => {
    if (warpGrid && activeLayer) {
      const warped = WarpEngine.renderMeshWarp(activeLayer.canvas, warpGrid);
      handleUpdateLayer(activeLayer.id, l => {
        const ctx = l.canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, l.canvas.width, l.canvas.height);
          ctx.drawImage(warped, 0, 0);
        }
        return l;
      });
      handleCommitHistory('Mesh Warp');
      const divs = (toolSettings.warp?.divisions || toolSettings.warp?.gridDivisions || 3) as 3 | 4 | 5;
      setWarpGrid(WarpEngine.createGrid(activeLayer.transform.width, activeLayer.transform.height, divs));
    }
  }, [warpGrid, activeLayer, handleUpdateLayer, handleCommitHistory, toolSettings.warp]);

  const handleResetWarp = useCallback(() => {
    if (activeLayer) {
      const divs = (toolSettings.warp?.divisions || toolSettings.warp?.gridDivisions || 3) as 3 | 4 | 5;
      setWarpGrid(WarpEngine.createGrid(activeLayer.transform.width, activeLayer.transform.height, divs));
    }
  }, [activeLayer, toolSettings.warp]);

  // Document Operations
  const handleNewCanvas = (config: {
    name: string;
    width: number;
    height: number;
    resolution: number;
    background: 'white' | 'black' | 'transparent';
  }) => {
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = config.width;
    bgCanvas.height = config.height;
    const ctx = bgCanvas.getContext('2d');
    if (ctx && config.background !== 'transparent') {
      ctx.fillStyle = config.background;
      ctx.fillRect(0, 0, config.width, config.height);
    }

    const bgLayer: Layer = {
      id: crypto.randomUUID(),
      name: 'Background',
      isVisible: true,
      opacity: 1,
      blendMode: 'normal',
      transform: { x: 0, y: 0, width: config.width, height: config.height, rotation: 0, flipX: false, flipY: false },
      canvas: bgCanvas,
    };
    bgLayer.thumbnailUrl = Renderer.generateThumbnail(bgLayer);

    const newDoc: KasenoDocument = {
      id: crypto.randomUUID(),
      name: config.name,
      width: config.width,
      height: config.height,
      resolution: config.resolution,
      layers: [bgLayer],
      activeLayerID: bgLayer.id,
      guides: [],
      history: [
        {
          actionName: 'Initial Canvas',
          layersSnapshot: [
            {
              id: bgLayer.id,
              name: bgLayer.name,
              isVisible: true,
              opacity: 1,
              blendMode: 'normal',
              transform: { ...bgLayer.transform },
              dataUrl: bgCanvas.toDataURL(),
            },
          ],
          width: config.width,
          height: config.height,
        },
      ],
      historyIndex: 0,
    };

    setDocuments(prev => [...prev, newDoc]);
    setActiveDocIndex(documents.length);
  };

  const handleOpenFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    await processImportFile(file);
    e.target.value = '';
  };

  const processImportFile = async (file: File) => {
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'kaseno' || ext === 'comp' || file.name.endsWith('.kaseno') || file.name.endsWith('.comp')) {
        const loaded = await ProjectIO.loadProject(file);
        setDocuments(prev => [...prev, loaded]);
        setActiveDocIndex(documents.length);
      } else if (ext === 'psd') {
        const buffer = await file.arrayBuffer();
        const loaded = await ProjectIO.importPSD(buffer, file.name);
        setDocuments(prev => [...prev, loaded]);
        setActiveDocIndex(documents.length);
      } else {
        // Standard image file: import as layer into current document or new doc
        const newLayer = await ProjectIO.importImageAsLayer(file);
        if (documents.length > 0) {
          updateActiveDoc(doc => ({
            ...doc,
            layers: [...doc.layers, newLayer],
            activeLayerID: newLayer.id,
          }));
          handleCommitHistory(`Import ${file.name}`);
        } else {
          // Open as new document
          const newDoc: KasenoDocument = {
            id: crypto.randomUUID(),
            name: file.name,
            width: newLayer.canvas.width,
            height: newLayer.canvas.height,
            resolution: 72,
            layers: [newLayer],
            activeLayerID: newLayer.id,
            guides: [],
            history: [],
            historyIndex: -1,
          };
          setDocuments([newDoc]);
          setActiveDocIndex(0);
        }
      }
    } catch (err: any) {
      alert(`Could not open file: ${err.message || err}`);
    }
  };

  const handleSaveProject = async () => {
    if (!activeDoc) return;
    try {
      const blob = await ProjectIO.saveProject(activeDoc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeDoc.name.replace(/\.[^/.]+$/, '')}.kaseno`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Save failed: ${err.message || err}`);
    }
  };

  // Keyboard Shortcuts (Photoshop / Kaseno Standard)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input/textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if (ctrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (ctrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveProject();
      } else if (ctrl && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleOpenFileClick();
      } else if (ctrl && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsNewCanvasModalOpen(true);
      } else if (ctrl && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setIsExportModalOpen(true);
      } else if (ctrl && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setSelection({ active: false, mask: null });
      } else if (e.key === 'v' || e.key === 'V') {
        setActiveTool('move');
      } else if (e.key === 'm' || e.key === 'M') {
        setActiveTool(e.shiftKey ? 'marquee-ellipse' : 'marquee-rect');
      } else if (e.key === 'l' || e.key === 'L') {
        setActiveTool('lasso');
      } else if (e.key === 'w' || e.key === 'W') {
        setActiveTool('wand');
      } else if (e.key === 'c' || e.key === 'C') {
        setActiveTool('crop');
      } else if (e.key === 'i' || e.key === 'I') {
        setActiveTool('eyedropper');
      } else if (e.key === 'b' || e.key === 'B') {
        setActiveTool('brush');
      } else if (e.key === 's' || e.key === 'S') {
        setActiveTool('clone');
      } else if (e.key === 'e' || e.key === 'E') {
        setActiveTool('eraser');
      } else if (e.key === 't' || e.key === 'T') {
        setActiveTool('type');
      } else if (e.key === 'u' || e.key === 'U') {
        setActiveTool('shape');
      } else if (e.key === 'h' || e.key === 'H') {
        setActiveTool('hand');
      } else if (e.key === 'z' || e.key === 'Z') {
        setActiveTool('zoom');
      } else if (e.key === 'x' || e.key === 'X') {
        // Swap foreground/background
        const temp = foregroundColor;
        setForegroundColor(backgroundColor);
        setBackgroundColor(temp);
      } else if (e.key === 'd' || e.key === 'D') {
        // Reset colors
        setForegroundColor('#06b6d4');
        setBackgroundColor('#ffffff');
      } else if (ctrl && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        setZoom(z => Math.min(10, z * 1.25));
      } else if (ctrl && e.key === '-') {
        e.preventDefault();
        setZoom(z => Math.max(0.1, z / 1.25));
      } else if (ctrl && e.key === '0') {
        e.preventDefault();
        setZoom(1.0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, foregroundColor, backgroundColor, activeDoc]);

  // Global Drag and Drop
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => e.preventDefault();
    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        await processImportFile(e.dataTransfer.files[0]);
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);
    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [documents, activeDocIndex]);

  return (
    <div className="studio-root">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".kaseno,.comp,.psd,.png,.jpg,.jpeg,.webp"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />

      {/* Top Application Bar */}
      <TitleBar
        documents={documents}
        activeDocIndex={activeDocIndex}
        onSelectDoc={setActiveDocIndex}
        onCloseDoc={(idx) => {
          if (documents.length > 1) {
            setDocuments(prev => prev.filter((_, i) => i !== idx));
            if (activeDocIndex >= idx && activeDocIndex > 0) {
              setActiveDocIndex(activeDocIndex - 1);
            }
          }
        }}
        onNewCanvas={() => setIsNewCanvasModalOpen(true)}
        onOpenFile={handleOpenFileClick}
        onSaveProject={handleSaveProject}
        onExport={() => setIsExportModalOpen(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoom={zoom}
        onZoomChange={setZoom}
        onFitCanvas={handleFitCanvas}
        onActualPixels={handleActualPixels}
        onOpenAdjustment={(kind) => handleOpenAdjustment(kind as AdjustmentType)}
      />

      {/* Contextual Options Header (42px) */}
      <ToolHeader
        activeTool={activeTool}
        settings={toolSettings}
        onUpdateSettings={setToolSettings}
        onSelectTool={setActiveTool}
        onApplyWarp={handleApplyWarp}
        onResetWarp={handleResetWarp}
        onRemoveBackground={() => handleRemoveBackground()}
        onSelectSubject={handleSelectSubject}
      />

      {/* Studio Workspace */}
      <div className="studio-main">
        {/* Left Tool Rail (56px) */}
        <ToolBar
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          foregroundColor={foregroundColor}
          backgroundColor={backgroundColor}
          onOpenColorPicker={(type) => setColorPickerState({ isOpen: true, type })}
          onSwapColors={() => {
            const temp = foregroundColor;
            setForegroundColor(backgroundColor);
            setBackgroundColor(temp);
          }}
          onResetColors={() => {
            setForegroundColor('#06b6d4');
            setBackgroundColor('#ffffff');
          }}
        />

        {/* Center Interactive Canvas Viewport */}
        {activeDoc && (
          <CanvasViewport
            doc={activeDoc}
            activeTool={activeTool}
            settings={toolSettings}
            foregroundColor={foregroundColor}
            backgroundColor={backgroundColor}
            zoom={zoom}
            onZoomChange={setZoom}
            selection={selection}
            onUpdateSelection={setSelection}
            onUpdateLayer={handleUpdateLayer}
            onCommitHistory={handleCommitHistory}
            onPickColor={(col) => setForegroundColor(col)}
            warpGrid={warpGrid}
            onWarpGridChange={setWarpGrid}
          />
        )}

        {/* Right Sidebar Panels (with draggable resize handle) */}
        <div className="studio-right-sidebar" style={{ width: layersPanelWidth }}>
          {/* Resize edge handle matching PanelResizeEdge in ContentView.swift */}
          <div
            className="sidebar-resize-handle"
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startW = layersPanelWidth;
              const handleMove = (ev: MouseEvent) => {
                const delta = startX - ev.clientX;
                const newW = Math.max(202, Math.min(380, startW + delta));
                setLayersPanelWidth(newW);
              };
              const handleUp = () => {
                window.removeEventListener('mousemove', handleMove);
                window.removeEventListener('mouseup', handleUp);
              };
              window.addEventListener('mousemove', handleMove);
              window.addEventListener('mouseup', handleUp);
            }}
          />

          {/* Quick Adjustments launcher */}
          <AdjustmentsPanel
            activeLayer={activeLayer}
            onApplyAdjustment={handleOpenAdjustment}
            onEditActiveAdjustment={handleEditActiveAdjustment}
          />

          {/* History state navigator */}
          {activeDoc && (
            <HistoryPanel
              history={activeDoc.history}
              currentIndex={activeDoc.historyIndex}
              onJumpToState={restoreSnapshot}
              onUndo={handleUndo}
              onRedo={handleRedo}
            />
          )}

          {/* Layers Stack Manager */}
          {activeDoc && (
            <LayersPanel
              doc={activeDoc}
              width={layersPanelWidth}
              onSelectLayer={handleSelectLayer}
              onUpdateLayer={handleUpdateLayer}
              onReorderLayers={handleReorderLayers}
              onNewLayer={handleNewLayer}
              onDuplicateLayer={handleDuplicateLayer}
              onDeleteLayer={handleDeleteLayer}
              onAddMask={handleAddMask}
              onOpenAdjustment={handleOpenAdjustment}
              onOpenEffects={handleOpenEffects}
              onConvertToSmartObject={handleConvertToSmartObject}
              onOpenSmartObject={handleOpenSmartObject}
              onRemoveBackground={handleRemoveBackground}
            />
          )}
        </div>
      </div>

      {/* Bottom Status Bar (30px matching statusBar in ContentView.swift) */}
      <StatusBar
        doc={activeDoc}
        zoom={zoom}
        activeTool={activeTool}
      />

      {/* Modals */}
      <NewCanvasModal
        isOpen={isNewCanvasModalOpen}
        onClose={() => setIsNewCanvasModalOpen(false)}
        onCreate={handleNewCanvas}
        onOpenProject={handleOpenFileClick}
        onImportImage={handleOpenFileClick}
      />

      <ColorPickerModal
        isOpen={colorPickerState.isOpen}
        initialColor={colorPickerState.type === 'fg' ? foregroundColor : backgroundColor}
        title={colorPickerState.type === 'fg' ? 'Foreground Color' : 'Background Color'}
        onConfirm={(hex) => {
          if (colorPickerState.type === 'fg') setForegroundColor(hex);
          else setBackgroundColor(hex);
        }}
        onClose={() => setColorPickerState(prev => ({ ...prev, isOpen: false }))}
      />

      <AdjustmentModal
        isOpen={adjustmentModalState.isOpen}
        kind={adjustmentModalState.kind}
        initialValues={adjustmentModalState.isEditingActive ? activeLayer?.adjustment : null}
        sourceCanvas={activeLayer?.canvas}
        onConfirm={handleConfirmAdjustment}
        onClose={() => setAdjustmentModalState(prev => ({ ...prev, isOpen: false }))}
      />

      <LayerEffectsModal
        isOpen={layerEffectsModalState.isOpen}
        initialEffects={activeDoc?.layers.find(l => l.id === layerEffectsModalState.layerID)?.effects}
        onConfirm={handleConfirmLayerEffects}
        onClose={() => setLayerEffectsModalState({ isOpen: false, layerID: null })}
      />

      {activeDoc && (
        <ExportModal
          isOpen={isExportModalOpen}
          doc={activeDoc}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
