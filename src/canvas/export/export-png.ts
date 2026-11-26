/**
 * SiteStack Architecture Intelligence - High-Resolution Raster PNG Exporter
 * Location: src/canvas/export/export-png.ts
 *
 * Converts standalone vector SVG documents into high-resolution PNG raster images
 * (default 2x scale multiplier for Retina/presentation readiness) using pure browser
 * HTML5 Canvas APIs with clean memory lifecycle management.
 */

import { ArchitectureGraph } from '../../engine/architecture/graph/types';
import { CanvasGraphLayoutResult } from '../types';
import { ArchitectureExportOptions, ExportResult } from './export-types';
import { generateArchitectureSvg } from './export-svg';
import { triggerBlobDownload, generateArchitectureExportFilename } from './download';

export interface PngExportResult extends ExportResult {
  readonly blob?: Blob;
  readonly width: number;
  readonly height: number;
  readonly scale: number;
}

export const MAX_CANVAS_DIMENSION = 16384;
export const MAX_CANVAS_PIXEL_AREA = 67108864; // 64 Megapixels (e.g. 8192 x 8192)

/**
 * Converts an SVG string into a high-resolution PNG Blob via HTML5 Canvas.
 */
export async function convertSvgToPngBlob(
  svgString: string,
  width: number,
  height: number,
  scale: number = 2
): Promise<Blob> {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    throw new Error('PNG rasterization requires a browser document environment');
  }

  if (width <= 0 || height <= 0 || !Number.isFinite(width) || !Number.isFinite(height)) {
    return Promise.reject(new Error(`Invalid export dimensions: ${width}x${height}`));
  }

  const scaledWidth = Math.round(width * scale);
  const scaledHeight = Math.round(height * scale);
  const totalPixels = scaledWidth * scaledHeight;

  if (scaledWidth > MAX_CANVAS_DIMENSION || scaledHeight > MAX_CANVAS_DIMENSION) {
    return Promise.reject(
      new Error(
        `Requested PNG dimensions (${scaledWidth}x${scaledHeight}) exceed maximum canvas limits (${MAX_CANVAS_DIMENSION}px)`
      )
    );
  }

  if (totalPixels > MAX_CANVAS_PIXEL_AREA) {
    return Promise.reject(
      new Error(
        `Requested PNG total pixel area (${totalPixels.toLocaleString()} px) exceeds maximum safe canvas allocation limit (${MAX_CANVAS_PIXEL_AREA.toLocaleString()} px)`
      )
    );
  }

  return new Promise<Blob>((resolve, reject) => {
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const objectUrl = URL.createObjectURL(svgBlob);

    const img = new Image();

    const cleanup = () => {
      clearTimeout(timeoutId);
      URL.revokeObjectURL(objectUrl);
      img.onload = null;
      img.onerror = null;
      img.src = '';
    };

    // Timeout guard (10 seconds)
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('PNG rasterization timed out after 10000ms'));
    }, 10000);

    img.onload = () => {
      clearTimeout(timeoutId);

      try {
        const canvas = document.createElement('canvas');
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          reject(new Error('Failed to obtain HTML5 2D canvas rendering context'));
          return;
        }

        // Draw solid dark background matching canvas theme
        ctx.fillStyle = '#07090e';
        ctx.fillRect(0, 0, scaledWidth, scaledHeight);

        // Draw scaled vector SVG image
        ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

        // Clean up SVG object URL immediately
        cleanup();

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas toBlob conversion returned null'));
            }
          },
          'image/png'
        );
      } catch (err) {
        cleanup();
        reject(err instanceof Error ? err : new Error('Canvas rasterization failed'));
      }
    };

    img.onerror = (_e) => {
      cleanup();
      reject(new Error('Failed to load vector SVG image into raster rendering pipeline'));
    };

    img.src = objectUrl;
  });
}

/**
 * Generates and downloads a high-resolution PNG of the Architecture Canvas.
 */
export async function exportArchitectureToPng(
  graph: ArchitectureGraph,
  layout: CanvasGraphLayoutResult,
  options?: Partial<ArchitectureExportOptions>
): Promise<PngExportResult> {
  const scale = options?.scale ?? 2;
  const domain = graph.domain || 'unknown_host';
  const timestamp = graph.timestamp || Date.now();
  const filename = generateArchitectureExportFilename(domain, 'png', timestamp);

  try {
    // 1. Generate standalone vector SVG
    const svgResult = generateArchitectureSvg(graph, layout, options);

    // 2. Convert to high-resolution PNG Blob
    const pngBlob = await convertSvgToPngBlob(
      svgResult.svgString,
      svgResult.width,
      svgResult.height,
      scale
    );

    // 3. Trigger native download
    triggerBlobDownload(pngBlob, filename);

    return {
      success: true,
      filename,
      format: 'png',
      blob: pngBlob,
      byteSize: pngBlob.size,
      width: Math.round(svgResult.width * scale),
      height: Math.round(svgResult.height * scale),
      scale,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown PNG export failure';
    return {
      success: false,
      filename,
      format: 'png',
      error: errorMsg,
      width: 0,
      height: 0,
      scale,
    };
  }
}
