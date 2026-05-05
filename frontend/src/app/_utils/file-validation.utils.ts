/** Supported file extensions for material upload */
export const ALLOWED_FILE_EXTENSIONS = [
  'pdf',
  'docx',
  'xlsx',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'txt',
  'pptx',
] as const;

export type AllowedExtension = (typeof ALLOWED_FILE_EXTENSIONS)[number];

/** Value for HTML input[accept] attribute, generated from ALLOWED_FILE_EXTENSIONS */
export const FILE_INPUT_ACCEPT = ALLOWED_FILE_EXTENSIONS.map(
  (ext) => `.${ext}`,
).join(',');

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function isFileExtensionAllowed(filename: string): boolean {
  const ext = getFileExtension(filename);
  return (ALLOWED_FILE_EXTENSIONS as readonly string[]).includes(ext);
}

export function getAllowedExtensionsLabel(): string {
  return ALLOWED_FILE_EXTENSIONS.join(', ');
}
