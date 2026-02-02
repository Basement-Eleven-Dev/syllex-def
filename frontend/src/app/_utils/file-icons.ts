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

export function getFolderIcon(isOpen: boolean): IconDefinition {
  return isOpen ? faFolderOpen : faFolder;
}
