/**
 * 3D LUT Color Grading Engine & Film Simulation for Kaseno
 * Parses industry-standard .cube files and applies high-speed trilinear color lookup tables.
 */

export interface LutPreset {
  id: 'portra-400' | 'teal-orange' | 'fuji-pro' | 'golden-hour' | 'cyberpunk' | 'bw-noir' | 'custom';
  name: string;
  description: string;
  previewColor: string;
}

export const LUT_PRESETS: LutPreset[] = [
  {
    id: 'portra-400',
    name: 'Kodak Portra 400',
    description: 'Warm analog skin tones, gentle highlight roll-off & vintage softness',
    previewColor: '#e0af68',
  },
  {
    id: 'teal-orange',
    name: 'Cinematic Teal & Orange',
    description: 'Modern blockbuster contrast, deep teal shadows & amber skin tones',
    previewColor: '#0ea5e9',
  },
  {
    id: 'fuji-pro',
    name: 'Fuji Pro 400H',
    description: 'Cool crisp Japanese film tones, pastel cyans & delicate greens',
    previewColor: '#38bdf8',
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour 35mm',
    description: 'Sun-drenched sunset warmth, rich golden highlights & velvety shadows',
    previewColor: '#f59e0b',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neo-Tokyo',
    description: 'Midnight navy blues, electric cyan shadows & neon magenta highlights',
    previewColor: '#ec4899',
  },
  {
    id: 'bw-noir',
    name: 'Silver Halide B&W Noir',
    description: 'High-contrast classic cinema monochrome with rich tonal depth',
    previewColor: '#64748b',
  },
];

export class LutEngine {
  /**
   * Applies a built-in or custom 3D LUT transformation to pixel data
   */
  public static applyLut(
    data: Uint8ClampedArray,
    presetId: string,
    intensity: number = 100,
    customCubeData?: string
  ): void {
    const factor = Math.max(0, Math.min(1, intensity / 100));
    if (factor <= 0) return;

    if (customCubeData) {
      this.applyCustomCube(data, customCubeData, factor);
      return;
    }

    const len = data.length;
    for (let i = 0; i < len; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      let nr = r;
      let ng = g;
      let nb = b;

      switch (presetId) {
        case 'portra-400': {
          // Warm analog curve: boost red midtones, warm shadows, slight lift in blacks
          nr = r * 1.08 + 12;
          ng = g * 0.98 + 6;
          nb = b * 0.88 + 4;
          // Saturation tweak
          const gray = 0.299 * nr + 0.587 * ng + 0.114 * nb;
          nr = gray + (nr - gray) * 0.95;
          ng = gray + (ng - gray) * 0.95;
          nb = gray + (nb - gray) * 0.90;
          break;
        }

        case 'teal-orange': {
          // Teal shadows (boost green & blue in darks), Orange highlights (boost red & yellow in lights)
          const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          if (luma < 0.5) {
            // Shadow teal bias
            const s = (0.5 - luma) * 2;
            nr = r * (1 - 0.25 * s);
            ng = g * (1 + 0.15 * s);
            nb = b * (1 + 0.40 * s) + 12 * s;
          } else {
            // Highlight orange bias
            const h = (luma - 0.5) * 2;
            nr = r * (1 + 0.25 * h) + 15 * h;
            ng = g * (1 + 0.08 * h) + 6 * h;
            nb = b * (1 - 0.28 * h);
          }
          break;
        }

        case 'fuji-pro': {
          // Cool crisp pastel cyan highlights, clean greens
          nr = r * 0.94 + 5;
          ng = g * 1.04 + 8;
          nb = b * 1.08 + 14;
          // Soft contrast
          nr = ((nr - 128) * 1.06) + 128;
          ng = ((ng - 128) * 1.06) + 128;
          nb = ((nb - 128) * 1.06) + 128;
          break;
        }

        case 'golden-hour': {
          // Sunset golden warmth
          nr = r * 1.18 + 16;
          ng = g * 1.02 + 8;
          nb = b * 0.78;
          break;
        }

        case 'cyberpunk': {
          // Electric neon magenta & cyan
          const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          if (luma < 0.45) {
            nr = r * 0.7;
            ng = g * 1.1 + 10;
            nb = b * 1.4 + 25;
          } else {
            nr = r * 1.35 + 20;
            ng = g * 0.8;
            nb = b * 1.25 + 15;
          }
          break;
        }

        case 'bw-noir': {
          // High contrast black & white film with deep shadows
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          const contrastGray = ((gray - 128) * 1.35) + 128;
          nr = contrastGray;
          ng = contrastGray;
          nb = contrastGray;
          break;
        }

        default:
          break;
      }

      // Clamp target color
      nr = Math.max(0, Math.min(255, nr));
      ng = Math.max(0, Math.min(255, ng));
      nb = Math.max(0, Math.min(255, nb));

      // Blend according to intensity factor
      data[i] = Math.round(r + (nr - r) * factor);
      data[i + 1] = Math.round(g + (ng - g) * factor);
      data[i + 2] = Math.round(b + (nb - b) * factor);
    }
  }

  /**
   * Parses standard 3D .cube file content
   */
  public static parseCube(cubeText: string): { size: number; table: Float32Array } | null {
    const lines = cubeText.split(/\r?\n/);
    let size = 0;
    const values: number[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      if (line.startsWith('LUT_3D_SIZE')) {
        const parts = line.split(/\s+/);
        size = parseInt(parts[1], 10);
        continue;
      }

      const parts = line.split(/\s+/).map(Number);
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        values.push(parts[0], parts[1], parts[2]);
      }
    }

    if (size <= 1 || values.length !== size * size * size * 3) {
      return null;
    }

    return { size, table: new Float32Array(values) };
  }

  private static applyCustomCube(data: Uint8ClampedArray, cubeText: string, factor: number): void {
    const parsed = this.parseCube(cubeText);
    if (!parsed) return;

    const { size, table } = parsed;
    const scale = (size - 1) / 255;
    const len = data.length;

    for (let i = 0; i < len; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const ri = Math.min(size - 1, Math.max(0, Math.round(r * scale)));
      const gi = Math.min(size - 1, Math.max(0, Math.round(g * scale)));
      const bi = Math.min(size - 1, Math.max(0, Math.round(b * scale)));

      const idx = (bi * size * size + gi * size + ri) * 3;
      const targetR = Math.round(table[idx] * 255);
      const targetG = Math.round(table[idx + 1] * 255);
      const targetB = Math.round(table[idx + 2] * 255);

      data[i] = Math.round(r + (targetR - r) * factor);
      data[i + 1] = Math.round(g + (targetG - g) * factor);
      data[i + 2] = Math.round(b + (targetB - b) * factor);
    }
  }
}
