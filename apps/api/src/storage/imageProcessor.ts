import sharp from 'sharp';

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export function isAllowedMimeType(mime: string): mime is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mime);
}

/**
 * Sniffs the MIME type from initial buffer magic numbers to prevent MIME spoofing.
 */
export function sniffMimeType(buffer: Buffer): AllowedMimeType | null {
  if (buffer.length < 4) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'image/png';
  }

  // PDF: 25 50 44 46 (%PDF)
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return 'application/pdf';
  }

  // WEBP: RIFF....WEBP (52 49 46 46 .... 57 45 42 50)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
}

export interface SanitizedImage {
  buffer: Buffer;
  mimeType: AllowedMimeType;
  width?: number | undefined;
  height?: number | undefined;
}

/**
 * BR-16: Strips all EXIF, GPS, camera, and device metadata from images.
 * Re-encodes the image server-side so no farm identity or location can be leaked.
 */
export async function stripExifAndGps(inputBuffer: Buffer): Promise<SanitizedImage> {
  const image = sharp(inputBuffer).rotate();
  const metadata = await image.metadata();

  const format = metadata.format;
  let outputBuffer: Buffer;
  let mimeType: AllowedMimeType = 'image/jpeg';

  if (format === 'png') {
    outputBuffer = await image.png().toBuffer();
    mimeType = 'image/png';
  } else if (format === 'webp') {
    outputBuffer = await image.webp().toBuffer();
    mimeType = 'image/webp';
  } else {
    // Default to JPEG with quality 85, stripped of all metadata
    outputBuffer = await image.jpeg({ quality: 85 }).toBuffer();
    mimeType = 'image/jpeg';
  }

  return {
    buffer: outputBuffer,
    mimeType,
    width: metadata.width,
    height: metadata.height,
  };
}
