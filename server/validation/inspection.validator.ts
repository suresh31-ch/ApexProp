/**
 * ApexProp AI — Request Validation Logic
 */

export interface InspectionValidationResult {
  valid: boolean;
  error?: string;
  cleanBase64?: string;
  detectedMimeType?: string;
}

export function validateInspectionPayload(body: any): InspectionValidationResult {
  if (!body) {
    return { valid: false, error: 'Request body is empty.' };
  }

  const { imageBase64, mimeType } = body;

  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return { valid: false, error: 'Missing inspection image data. Please upload a valid image file.' };
  }

  // Strip possible data URI prefix
  const matches = imageBase64.match(/^data:([a-zA-Z0-9.+/-]+);base64,(.+)$/);
  let cleanBase64 = imageBase64;
  let detectedMime = mimeType || 'image/jpeg';

  if (matches && matches.length === 3) {
    detectedMime = matches[1];
    cleanBase64 = matches[2];
  }

  // Validate allowed mime types
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/svg+xml'];
  if (!allowedMimeTypes.includes(detectedMime.toLowerCase())) {
    return {
      valid: false,
      error: `Unsupported image MIME type: ${detectedMime}. Supported formats: JPEG, PNG, WEBP, SVG.`
    };
  }

  // Approximate byte size check (base64 length * 0.75)
  const approxBytes = cleanBase64.length * 0.75;
  const maxBytes = 25 * 1024 * 1024; // 25MB limit
  if (approxBytes > maxBytes) {
    return {
      valid: false,
      error: `Image exceeds maximum permitted payload size of 25MB (Current: ${(approxBytes / (1024 * 1024)).toFixed(1)}MB).`
    };
  }

  return {
    valid: true,
    cleanBase64,
    detectedMimeType: detectedMime
  };
}
