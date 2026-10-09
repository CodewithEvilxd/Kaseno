import { LayerAdjustment } from '../types/kaseno';
import { LutEngine } from './LutEngine';

export class AdjustmentEngine {
  /**
   * Applies non-destructive adjustments to an ImageData pixel buffer.
   */
  public static applyAdjustment(imageData: ImageData, adjustment: LayerAdjustment): ImageData {
    switch (adjustment.kind) {
      case 'brightness-contrast':
        return this.applyBrightnessContrast(imageData, adjustment.brightness ?? 0, adjustment.contrast ?? 0);
      case 'levels':
        return this.applyLevels(imageData, adjustment.levels);
      case 'curves':
        return this.applyCurves(imageData, adjustment.curves);
      case 'hue-saturation':
        return this.applyHueSaturation(
          imageData,
          adjustment.hue ?? 0,
          adjustment.saturation ?? 0,
          adjustment.lightness ?? 0,
          adjustment.colorize ?? false
        );
      case 'color-balance':
        return this.applyColorBalance(imageData, adjustment.colorBalance);
      case 'exposure':
        return this.applyExposure(imageData, adjustment.exposure ?? 0, adjustment.gamma ?? 1);
      case 'black-white':
        return this.applyBlackWhite(imageData);
      case 'invert':
        return this.applyInvert(imageData);
      case 'gaussian-blur':
        return this.applyGaussianBlur(imageData, adjustment.blurRadius ?? 5);
      case 'noise':
        return this.applyNoise(imageData, adjustment.noiseAmount ?? 10);
      case 'lut':
        if (adjustment.lut) {
          LutEngine.applyLut(imageData.data, adjustment.lut.preset, adjustment.lut.intensity, adjustment.lut.cubeData);
        }
        return imageData;
      default:
        return imageData;
    }
  }

  public static applyBrightnessContrast(imageData: ImageData, brightness: number, contrast: number): ImageData {
    const data = imageData.data;
    const b = (brightness / 100) * 255;
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    for (let i = 0; i < data.length; i += 4) {
      // Contrast then Brightness
      data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128 + b));
      data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128 + b));
      data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128 + b));
    }
    return imageData;
  }

  public static applyLevels(imageData: ImageData, levels?: LayerAdjustment['levels']): ImageData {
    if (!levels) return imageData;
    const { inBlack = 0, inMid = 1.0, inWhite = 255, outBlack = 0, outWhite = 255 } = levels;
    const lut = new Uint8ClampedArray(256);

    for (let i = 0; i < 256; i++) {
      let v = (i - inBlack) / Math.max(1, inWhite - inBlack);
      v = Math.max(0, Math.min(1, v));
      // Gamma correction for midtone
      v = Math.pow(v, 1 / Math.max(0.1, inMid));
      v = v * (outWhite - outBlack) + outBlack;
      lut[i] = Math.max(0, Math.min(255, Math.round(v)));
    }

    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = lut[data[i]];
      data[i + 1] = lut[data[i + 1]];
      data[i + 2] = lut[data[i + 2]];
    }
    return imageData;
  }

  public static applyCurves(imageData: ImageData, curves?: LayerAdjustment['curves']): ImageData {
    if (!curves || !curves.rgb) return imageData;
    const lut = this.createCurvesLUT(curves.rgb);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = lut[data[i]];
      data[i + 1] = lut[data[i + 1]];
      data[i + 2] = lut[data[i + 2]];
    }
    return imageData;
  }

  private static createCurvesLUT(points: { x: number; y: number }[]): Uint8ClampedArray {
    const lut = new Uint8ClampedArray(256);
    const sorted = [...points].sort((a, b) => a.x - b.x);

    for (let i = 0; i < 256; i++) {
      const xNorm = i / 255;
      let yNorm = xNorm;

      if (sorted.length < 2) {
        yNorm = xNorm;
      } else if (xNorm <= sorted[0].x) {
        yNorm = sorted[0].y;
      } else if (xNorm >= sorted[sorted.length - 1].x) {
        yNorm = sorted[sorted.length - 1].y;
      } else {
        // Piecewise linear interpolation between curve control points
        for (let p = 0; p < sorted.length - 1; p++) {
          const p1 = sorted[p];
          const p2 = sorted[p + 1];
          if (xNorm >= p1.x && xNorm <= p2.x) {
            const t = (xNorm - p1.x) / (p2.x - p1.x);
            yNorm = p1.y + t * (p2.y - p1.y);
            break;
          }
        }
      }
      lut[i] = Math.max(0, Math.min(255, Math.round(yNorm * 255)));
    }
    return lut;
  }

  public static applyHueSaturation(
    imageData: ImageData,
    hue: number,
    saturation: number,
    lightness: number,
    colorize: boolean
  ): ImageData {
    const data = imageData.data;
    const satMul = (saturation + 100) / 100;
    const lightMul = lightness / 100;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i] / 255;
      let g = data[i + 1] / 255;
      let b = data[i + 2] / 255;

      let [h, s, l] = this.rgbToHsl(r, g, b);

      if (colorize) {
        h = ((hue % 360) + 360) % 360 / 360;
        s = Math.max(0, Math.min(1, satMul * 0.5));
      } else {
        h = (((h * 360 + hue) % 360) + 360) % 360 / 360;
        s = Math.max(0, Math.min(1, s * satMul));
      }

      if (lightMul > 0) {
        l = l + (1 - l) * lightMul;
      } else {
        l = l + l * lightMul;
      }
      l = Math.max(0, Math.min(1, l));

      const [newR, newG, newB] = this.hslToRgb(h, s, l);
      data[i] = Math.round(newR * 255);
      data[i + 1] = Math.round(newG * 255);
      data[i + 2] = Math.round(newB * 255);
    }
    return imageData;
  }

  public static applyColorBalance(imageData: ImageData, balance?: LayerAdjustment['colorBalance']): ImageData {
    if (!balance) return imageData;
    const data = imageData.data;
    const [cShadow, mShadow, yShadow] = balance.shadows;
    const [cMid, mMid, yMid] = balance.midtones;
    const [cHigh, mHigh, yHigh] = balance.highlights;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

      // Weightings
      const wShadow = Math.max(0, 1 - lum * 2);
      const wHigh = Math.max(0, (lum - 0.5) * 2);
      const wMid = 1 - wShadow - wHigh;

      const deltaR = (cShadow * wShadow + cMid * wMid + cHigh * wHigh) * 0.5;
      const deltaG = (mShadow * wShadow + mMid * wMid + mHigh * wHigh) * 0.5;
      const deltaB = (yShadow * wShadow + yMid * wMid + yHigh * wHigh) * 0.5;

      data[i] = Math.max(0, Math.min(255, r + deltaR));
      data[i + 1] = Math.max(0, Math.min(255, g + deltaG));
      data[i + 2] = Math.max(0, Math.min(255, b + deltaB));
    }
    return imageData;
  }

  public static applyExposure(imageData: ImageData, exposure: number, gamma: number): ImageData {
    const data = imageData.data;
    const expFactor = Math.pow(2, exposure);

    for (let i = 0; i < data.length; i += 4) {
      let r = (data[i] / 255) * expFactor;
      let g = (data[i + 1] / 255) * expFactor;
      let b = (data[i + 2] / 255) * expFactor;

      r = Math.pow(Math.max(0, r), 1 / gamma);
      g = Math.pow(Math.max(0, g), 1 / gamma);
      b = Math.pow(Math.max(0, b), 1 / gamma);

      data[i] = Math.max(0, Math.min(255, Math.round(r * 255)));
      data[i + 1] = Math.max(0, Math.min(255, Math.round(g * 255)));
      data[i + 2] = Math.max(0, Math.min(255, Math.round(b * 255)));
    }
    return imageData;
  }

  public static applyBlackWhite(imageData: ImageData): ImageData {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }
    return imageData;
  }

  public static applyInvert(imageData: ImageData): ImageData {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }
    return imageData;
  }

  public static applyGaussianBlur(imageData: ImageData, radius: number): ImageData {
    // Fast separable box blur approximation for preview
    const r = Math.max(1, Math.min(50, Math.round(radius)));
    const w = imageData.width;
    const h = imageData.height;
    const src = new Uint32Array(imageData.data.buffer);
    const dst = new Uint32Array(src.length);

    // Horizontal pass then vertical pass
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let rSum = 0, gSum = 0, bSum = 0, aSum = 0, count = 0;
        for (let k = -r; k <= r; k += 2) {
          const nx = Math.min(w - 1, Math.max(0, x + k));
          const p = src[y * w + nx];
          rSum += p & 0xff;
          gSum += (p >> 8) & 0xff;
          bSum += (p >> 16) & 0xff;
          aSum += (p >> 24) & 0xff;
          count++;
        }
        dst[y * w + x] =
          (Math.round(rSum / count)) |
          (Math.round(gSum / count) << 8) |
          (Math.round(bSum / count) << 16) |
          (Math.round(aSum / count) << 24);
      }
    }
    new Uint32Array(imageData.data.buffer).set(dst);
    return imageData;
  }

  public static applyNoise(imageData: ImageData, amount: number): ImageData {
    const data = imageData.data;
    const factor = amount * 2.55;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * factor;
      data[i] = Math.max(0, Math.min(255, data[i] + n));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n));
    }
    return imageData;
  }

  public static computeHistogram(imageData: ImageData): { r: number[]; g: number[]; b: number[]; l: number[] } {
    const r = new Array(256).fill(0);
    const g = new Array(256).fill(0);
    const b = new Array(256).fill(0);
    const l = new Array(256).fill(0);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue;
      const red = data[i];
      const green = data[i + 1];
      const blue = data[i + 2];
      const lum = Math.round(0.299 * red + 0.587 * green + 0.114 * blue);

      r[red]++;
      g[green]++;
      b[blue]++;
      l[lum]++;
    }
    return { r, g, b, l };
  }

  private static rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return [h, s, l];
  }

  private static hslToRgb(h: number, s: number, l: number): [number, number, number] {
    let r: number, g: number, b: number;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return [r, g, b];
  }
}
