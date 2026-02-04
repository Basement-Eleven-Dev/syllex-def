import {
  faFile,
  faFileExcel,
  faFileImage,
  faFileLines,
  faFilePdf,
  faFileWord,
  faFolder,
  faFolderOpen,
  IconDefinition,
} from '@fortawesome/pro-solid-svg-icons';

export function getFileIcon(extension: string): IconDefinition {
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
    default:
      return faFile;
  }
}

export function getIconColor(extension: string): string {
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
    default:
      return '#4A5568'; // Default gray
  }
}

export function getFolderIcon(isOpen: boolean): IconDefinition {
  return isOpen ? faFolderOpen : faFolder;
}
