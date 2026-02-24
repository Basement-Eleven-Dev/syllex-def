import {
  faFile,
  faFileExcel,
  faFileImage,
  faFileLines,
  faFilePdf,
  faFilePowerpoint,
  faFileWord,
  faFolder,
  faFolderOpen,
  IconDefinition,
} from '@fortawesome/pro-solid-svg-icons';

export const TEXT_FILE_EXTENSIONS = [
  'txt',
  'md',
  'csv',
  'json',
  'xml',
  'doc',
  'docx',
  'pdf',
  'xls',
  'xlsx',
  'pptx',
  'rtf',
  'tex',
  'html',
  'js',
  'ts',
  'py',
  'java',
  'c',
  'cpp',
  'cs',
  'php',
  'go',
  'rb',
  'sh',
];

export function isTextFile(extension: string): boolean {
  return TEXT_FILE_EXTENSIONS.includes(extension.toLowerCase());
}

export function getFileIcon(extension: string): IconDefinition {
  if (!extension) return faFile; // Default icon for files without extension
  switch (extension.toLowerCase()) {
    case 'pdf':
      return faFilePdf;
    case 'docx':
    case 'doc':
      return faFileWord;
    case 'xlsx':
    case 'xls':
      return faFileExcel;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
      return faFileImage;
    case 'txt':
      return faFileLines;
    case 'pptx':
    case 'ppt':
      return faFilePowerpoint;
    default:
      return faFile;
  }
}

export function getIconColor(extension: string): string {
  if (!extension) return '#4A5568'; // Default color for files without extension
  switch (extension.toLowerCase()) {
    case 'pdf':
      return '#E53E3E'; // Red
    case 'docx':
    case 'doc':
      return '#3182CE'; // Blue
    case 'xlsx':
    case 'xls':
      return '#38A169'; // Green
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
      return '#D69E2E'; // Yellow
    case 'txt':
      return '#718096'; // Gray
    case 'pptx':
    case 'ppt':
      return '#D04423'; // PowerPoint Red/Orange
    default:
      return '#4A5568'; // Default gray
  }
}

export function getFolderIcon(isOpen: boolean): IconDefinition {
  return isOpen ? faFolderOpen : faFolder;
}
