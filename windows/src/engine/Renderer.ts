import { BlendMode, Layer, KasenoDocument } from '../types/kaseno';
import { AdjustmentEngine } from './AdjustmentEngine';
import { LayerEffectsEngine } from './LayerEffectsEngine';

export class Renderer {
  public static mapBlendMode(blendMode: BlendMode): GlobalCompositeOperation {
    switch (blendMode) {
      case 'normal': return 'source-over';
      case 'multiply': return 'multiply';
      case 'screen': return 'screen';
      case 'overlay': return 'overlay';
      case 'darken': return 'darken';
      case 'lighten': return 'lighten';
      case 'color-dodge': return 'color-dodge';
      case 'color-burn': return 'color-burn';
      case 'hard-light': return 'hard-light';
      case 'soft-light': return 'soft-light';
      case 'difference': return 'difference';
      case 'exclusion': return 'exclusion';
      case 'hue': return 'hue';
      case 'saturation': return 'saturation';
      case 'color': return 'color';
      case 'luminosity': return 'luminosity';
      default: return 'source-over';
    }
  }

  /**
   * Composites the entire document onto targetCtx at width x height.
   */
  public static renderDocument(
    targetCtx: CanvasRenderingContext2D,
    width: number,
    height: number,
    layers: Layer[]
  ) {
    targetCtx.clearRect(0, 0, width, height);

    // Render layers bottom-to-top
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      if (!layer.isVisible) continue;

      if (layer.adjustment) {
        // Non-destructive adjustment layer: applies to the composite below it
        const currentData = targetCtx.getImageData(0, 0, width, height);
        const adjustedData = AdjustmentEngine.applyAdjustment(currentData, layer.adjustment);
        targetCtx.putImageData(adjustedData, 0, 0);
        continue;
      }

      this.renderSingleLayer(targetCtx, layer, width, height);
    }
  }

  public static renderSingleLayer(
    targetCtx: CanvasRenderingContext2D,
    layer: Layer,
    docWidth: number,
    docHeight: number
  ) {
    if (!layer.canvas) return;

    targetCtx.save();
    targetCtx.globalAlpha = layer.opacity;
    targetCtx.globalCompositeOperation = this.mapBlendMode(layer.blendMode);

    const { x, y, width, height, rotation, flipX, flipY } = layer.transform;

    // Apply layer transform matrix
    targetCtx.translate(x + width / 2, y + height / 2);
    if (rotation !== 0) {
      targetCtx.rotate((rotation * Math.PI) / 180);
    }
    targetCtx.scale(flipX ? -1 : 1, flipY ? -1 : 1);

    const destX = -width / 2;
    const destY = -height / 2;

    // Render Smart Object contents if present
    if (layer.isSmartObject && layer.smartObjectDoc) {
      const sDoc = layer.smartObjectDoc;
      const sCtx = layer.canvas.getContext('2d');
      if (sCtx) {
        Renderer.renderDocument(sCtx, sDoc.width, sDoc.height, sDoc.layers);
      }
    }

    // Render with Layer Effects (Shadow, Stroke, Glow, Color Overlay)
    const effectiveCanvas = layer.effects
      ? LayerEffectsEngine.renderWithEffects(layer.canvas, layer.effects)
      : layer.canvas;

    if (layer.maskCanvas && layer.maskEnabled) {
      // Create temporary buffer for masked rendering
      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = effectiveCanvas.width;
      tmpCanvas.height = effectiveCanvas.height;
      const tmpCtx = tmpCanvas.getContext('2d');
      if (tmpCtx) {
        tmpCtx.drawImage(effectiveCanvas, 0, 0);
        tmpCtx.globalCompositeOperation = 'destination-in';
        tmpCtx.drawImage(layer.maskCanvas, 0, 0);
        targetCtx.drawImage(tmpCanvas, destX, destY, width, height);
      }
    } else {
      targetCtx.drawImage(effectiveCanvas, destX, destY, width, height);
    }

    targetCtx.restore();
  }

  /**
   * Generates a 96x96 thumbnail for a layer.
   */
  public static generateThumbnail(layer: Layer): string {
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 64;
    thumbCanvas.height = 64;
    const ctx = thumbCanvas.getContext('2d');
    if (!ctx) return '';

    if (layer.adjustment) {
      // Draw icon background for adjustment layers
      ctx.fillStyle = '#27272a';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#06b6d4';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(layer.adjustment.kind.toUpperCase().slice(0, 6), 32, 36);
    } else if (layer.canvas) {
      // Checkerboard background for transparency
      ctx.fillStyle = '#1c1c1f';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#2c2c30';
      for (let y = 0; y < 64; y += 8) {
        for (let x = 0; x < 64; x += 8) {
          if ((x / 8 + y / 8) % 2 === 0) ctx.fillRect(x, y, 8, 8);
        }
      }
      // Aspect ratio fit
      const scale = Math.min(64 / layer.canvas.width, 64 / layer.canvas.height);
      const dw = layer.canvas.width * scale;
      const dh = layer.canvas.height * scale;
      ctx.drawImage(layer.canvas, (64 - dw) / 2, (64 - dh) / 2, dw, dh);
    }
    return thumbCanvas.toDataURL('image/png');
  }

  /**
   * Creates a flattened composite HTMLCanvasElement of a document.
   */
  public static compositeDocument(doc: KasenoDocument): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = doc.width;
    canvas.height = doc.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      this.renderDocument(ctx, doc.width, doc.height, doc.layers);
    }
    return canvas;
  }

  /**
   * Deep clones a layer with its pixel data for non-destructive history snapshots.
   */
  public static cloneLayer(layer: Layer, newID: boolean = false): Layer {
    const newCanvas = document.createElement('canvas');
    newCanvas.width = layer.canvas.width;
    newCanvas.height = layer.canvas.height;
    const ctx = newCanvas.getContext('2d');
    if (ctx) ctx.drawImage(layer.canvas, 0, 0);

    let maskCanvas: HTMLCanvasElement | null = null;
    if (layer.maskCanvas) {
      maskCanvas = document.createElement('canvas');
      maskCanvas.width = layer.maskCanvas.width;
      maskCanvas.height = layer.maskCanvas.height;
      const mctx = maskCanvas.getContext('2d');
      if (mctx) mctx.drawImage(layer.maskCanvas, 0, 0);
    }

    return {
      ...layer,
      id: newID ? crypto.randomUUID() : layer.id,
      name: newID ? `${layer.name} Copy` : layer.name,
      transform: { ...layer.transform },
      adjustment: layer.adjustment ? JSON.parse(JSON.stringify(layer.adjustment)) : null,
      text: layer.text ? { ...layer.text } : undefined,
      shape: layer.shape ? { ...layer.shape } : undefined,
      canvas: newCanvas,
      maskCanvas,
      thumbnailUrl: layer.thumbnailUrl,
    };
  }
}

