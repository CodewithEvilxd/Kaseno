import JSZip from 'jszip';
import { readPsd } from 'ag-psd';
import { KasenoDocument, Layer, BlendMode } from '../types/kaseno';
import { Renderer } from './Renderer';

export class ProjectIO {
  /**
   * Saves Kaseno project as .kaseno bundle (ZIP format matching Kaseno package format).
   */
  public static async saveProject(doc: KasenoDocument): Promise<Blob> {
    const zip = new JSZip();

    const layerRecords: any[] = [];
    const imagesFolder = zip.folder('images');

    for (const layer of doc.layers) {
      let imageFilename: string | null = null;
      let maskFilename: string | null = null;

      if (layer.canvas) {
        imageFilename = `${layer.id}.png`;
        const blob = await this.canvasToBlob(layer.canvas, 'image/png');
        imagesFolder?.file(imageFilename, blob);
      }

      if (layer.maskCanvas && layer.maskEnabled) {
        maskFilename = `${layer.id}.mask.png`;
        const maskBlob = await this.canvasToBlob(layer.maskCanvas, 'image/png');
        imagesFolder?.file(maskFilename, maskBlob);
      }

      layerRecords.push({
        id: layer.id,
        name: layer.name,
        isVisible: layer.isVisible,
        opacity: layer.opacity,
        blendMode: layer.blendMode,
        transform: layer.transform,
        imageFile: imageFilename,
        maskFile: maskFilename,
        maskEnabled: layer.maskEnabled,
        maskLinked: layer.maskLinked,
        isGroup: layer.isGroup,
        parentID: layer.parentID,
        isClippingMask: layer.isClippingMask,
        adjustment: layer.adjustment,
        text: layer.text,
        shape: layer.shape,
      });
    }

    const manifest = {
      format: 'com.kaseno.project',
      version: 11,
      colorSpace: 'sRGB',
      resolution: doc.resolution || 72,
      documentID: doc.id,
      width: doc.width,
      height: doc.height,
      activeLayerID: doc.activeLayerID,
      layers: layerRecords,
      guides: doc.guides || [],
    };

    zip.file('manifest.json', JSON.stringify(manifest, null, 2));

    return await zip.generateAsync({ type: 'blob' });
  }

  /**
   * Opens .kaseno or .comp bundle package.
   */
  public static async loadProject(file: File | Blob): Promise<KasenoDocument> {
    const zip = await JSZip.loadAsync(file);
    const manifestFile = zip.file('manifest.json');
    if (!manifestFile) throw new Error('Invalid project: manifest.json missing.');

    const manifestText = await manifestFile.async('text');
    const manifest = JSON.parse(manifestText);

    if (manifest.format !== 'com.kaseno.project' && manifest.format !== 'com.compositor.project') {
      throw new Error(`Unsupported format: ${manifest.format}`);
    }

    const layers: Layer[] = [];

    for (const record of manifest.layers) {
      let canvas: HTMLCanvasElement;
      if (record.imageFile) {
        const imgFile = zip.file(`images/${record.imageFile}`);
        if (imgFile) {
          const blob = await imgFile.async('blob');
          canvas = await this.blobToCanvas(blob);
        } else {
          canvas = this.createEmptyCanvas(record.transform?.width || manifest.width, record.transform?.height || manifest.height);
        }
      } else {
        canvas = this.createEmptyCanvas(record.transform?.width || manifest.width, record.transform?.height || manifest.height);
      }

      let maskCanvas: HTMLCanvasElement | null = null;
      if (record.maskFile) {
        const maskFile = zip.file(`images/${record.maskFile}`);
        if (maskFile) {
          const maskBlob = await maskFile.async('blob');
          maskCanvas = await this.blobToCanvas(maskBlob);
        }
      }

      const layer: Layer = {
        id: record.id,
        name: record.name,
        isVisible: record.isVisible ?? true,
        opacity: record.opacity ?? 1,
        blendMode: record.blendMode || 'normal',
        transform: record.transform || {
          x: 0,
          y: 0,
          width: canvas.width,
          height: canvas.height,
          rotation: 0,
          flipX: false,
          flipY: false,
        },
        canvas,
        maskCanvas,
        maskEnabled: record.maskEnabled,
        maskLinked: record.maskLinked,
        isGroup: record.isGroup,
        parentID: record.parentID,
        isClippingMask: record.isClippingMask,
        adjustment: record.adjustment,
        text: record.text,
        shape: record.shape,
      };
      layer.thumbnailUrl = Renderer.generateThumbnail(layer);
      layers.push(layer);
    }

    return {
      id: manifest.documentID || crypto.randomUUID(),
      name: (file as File).name?.replace(/\.(kaseno|comp)$/i, '') || 'Untitled Project',
      width: manifest.width,
      height: manifest.height,
      resolution: manifest.resolution || 72,
      layers,
      activeLayerID: manifest.activeLayerID || (layers.length > 0 ? layers[layers.length - 1].id : null),
      guides: manifest.guides || [],
      history: [],
      historyIndex: -1,
    };
  }

  /**
   * Imports PSD file using ag-psd and creates a KasenoDocument.
   */
  public static async importPSD(buffer: ArrayBuffer, filename: string): Promise<KasenoDocument> {
    const psd = readPsd(buffer);
    const width = psd.width;
    const height = psd.height;
    const layers: Layer[] = [];

    if (psd.children && psd.children.length > 0) {
      for (const child of (psd.children as any[])) {
        const layerCanvas = document.createElement('canvas');
        layerCanvas.width = child.width || width;
        layerCanvas.height = child.height || height;
        const ctx = layerCanvas.getContext('2d');

        if (child.canvas && ctx) {
          ctx.drawImage(child.canvas, 0, 0);
        }

        const layer: Layer = {
          id: crypto.randomUUID(),
          name: child.name || 'PSD Layer',
          isVisible: !child.hidden,
          opacity: (child.opacity ?? 255) / 255,
          blendMode: (child.blendMode as BlendMode) || 'normal',
          transform: {
            x: child.left || 0,
            y: child.top || 0,
            width: layerCanvas.width,
            height: layerCanvas.height,
            rotation: 0,
            flipX: false,
            flipY: false,
          },
          canvas: layerCanvas,
          isClippingMask: child.clipping,
        };
        layer.thumbnailUrl = Renderer.generateThumbnail(layer);
        layers.push(layer);
      }
    } else if (psd.canvas) {
      // Flattened PSD fallback
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(psd.canvas, 0, 0);

      const layer: Layer = {
        id: crypto.randomUUID(),
        name: 'Background',
        isVisible: true,
        opacity: 1,
        blendMode: 'normal',
        transform: { x: 0, y: 0, width, height, rotation: 0, flipX: false, flipY: false },
        canvas,
      };
      layer.thumbnailUrl = Renderer.generateThumbnail(layer);
      layers.push(layer);
    }

    return {
      id: crypto.randomUUID(),
      name: filename.replace(/\.psd$/i, ''),
      width,
      height,
      resolution: 72,
      layers,
      activeLayerID: layers.length > 0 ? layers[layers.length - 1].id : null,
      guides: [],
      history: [],
      historyIndex: -1,
    };
  }

  /**
   * Imports standard image file (PNG, JPG, WebP, SVG) and returns a Layer.
   */
  public static async importImageAsLayer(file: File | Blob): Promise<Layer> {
    const canvas = await this.blobToCanvas(file);
    const layer: Layer = {
      id: crypto.randomUUID(),
      name: (file as File).name || 'Imported Image',
      isVisible: true,
      opacity: 1,
      blendMode: 'normal',
      transform: {
        x: 0,
        y: 0,
        width: canvas.width,
        height: canvas.height,
        rotation: 0,
        flipX: false,
        flipY: false,
      },
      canvas,
    };
    layer.thumbnailUrl = Renderer.generateThumbnail(layer);
    return layer;
  }

  /**
   * Flattens and exports the current document to an image Blob.
   */
  public static exportImage(doc: KasenoDocument, format: 'png' | 'jpeg' | 'webp', quality: number = 0.92): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = doc.width;
    canvas.height = doc.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context error');

    if (format === 'jpeg') {
      // JPEG requires solid background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, doc.width, doc.height);
    }

    Renderer.renderDocument(ctx, doc.width, doc.height, doc.layers);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Export failed'));
        },
        `image/${format}`,
        quality
      );
    });
  }

  /**
   * Triggers download of a flattened canvas image with filename and format.
   */
  public static exportFlattenedImage(
    canvas: HTMLCanvasElement,
    filename: string,
    format: 'png' | 'jpeg' | 'webp' = 'png',
    quality: number = 0.92
  ) {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }, `image/${format}`, quality);
  }

  public static canvasToBlob(canvas: HTMLCanvasElement, mime: string = 'image/png'): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas to Blob failed'));
      }, mime);
    });
  }

  public static blobToCanvas(blob: Blob): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas);
        } else {
          reject(new Error('Failed to get canvas context'));
        }
        URL.revokeObjectURL(img.src);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(blob);
    });
  }

  public static createEmptyCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, width);
    canvas.height = Math.max(1, height);
    return canvas;
  }
}
