import { Injectable } from '@angular/core';

export interface Materiale {
  id: string;
  name: string;
  url: string;
  extension: string;
  createdAt: Date;
}

export interface Folder {
  id: string;
  name: string;
  content: (Materiale | Folder)[];
  createdAt: Date;
}

@Injectable({
  providedIn: 'root',
})
export class MaterialiService {
  root: (Folder | Materiale)[] = [
    {
      id: 'folder-1',
      name: 'Pdf Lezioni',
      createdAt: new Date('2023-01-15'),
      content: [
        {
          id: 'file-1',
          name: 'Lezione_1.pdf',
          url: '/materials/Lezione_1.pdf',
          extension: 'pdf',
          createdAt: new Date('2023-01-15'),
        },
        {
          id: 'file-2',
          name: 'Lezione_2.pdf',
          url: '/materials/Lezione_2.pdf',
          extension: 'pdf',
          createdAt: new Date('2023-01-15'),
        },
        {
          id: 'file-3',
          name: 'Lezione_3.pdf',
          url: '/materials/Lezione_3.pdf',
          extension: 'pdf',
          createdAt: new Date('2023-01-15'),
        },
        {
          id: 'folder-2',
          name: 'Lezioni vecchie',
          createdAt: new Date('2023-01-15'),
          content: [
            {
              id: 'file-4',
              name: 'Lezione_vecchia-1.pdf',
              url: '/materials/Lezione_vecchia-1.pdf',
              extension: 'pdf',
              createdAt: new Date('2023-01-15'),
            },
            {
              id: 'file-5',
              name: 'Lezione_vecchia-2.pdf',
              url: '/materials/Lezione_vecchia-2.pdf',
              extension: 'pdf',
              createdAt: new Date('2023-01-15'),
            },
          ],
        },
      ],
    },
    {
      id: 'folder-3',
      name: 'Matematica',
      createdAt: new Date('2023-01-15'),
      content: [
        {
          id: 'folder-4',
          name: 'Algebra',
          createdAt: new Date('2023-01-15'),
          content: [
            {
              id: 'file-6',
              name: 'Equazioni.pdf',
              url: '/materials/Equazioni.pdf',
              extension: 'pdf',
              createdAt: new Date('2023-01-15'),
            },
            {
              id: 'file-7',
              name: 'Esercizi_Algebra.xlsx',
              url: '/materials/Esercizi_Algebra.xlsx',
              extension: 'xlsx',
              createdAt: new Date('2023-01-15'),
            },
            {
              id: 'file-8',
              name: 'Soluzioni.docx',
              url: '/materials/Soluzioni.docx',
              extension: 'docx',
              createdAt: new Date('2023-01-15'),
            },
          ],
        },
        {
          id: 'folder-5',
          name: 'Geometria',
          createdAt: new Date('2023-01-15'),
          content: [
            {
              id: 'file-9',
              name: 'Teoremi.pdf',
              url: '/materials/Teoremi.pdf',
              extension: 'pdf',
              createdAt: new Date('2023-01-15'),
            },
            {
              id: 'file-10',
              name: 'Figure_Piane.pptx',
              url: '/materials/Figure_Piane.pptx',
              extension: 'pptx',
              createdAt: new Date('2023-01-15'),
            },
          ],
        },
        {
          id: 'file-11',
          name: 'Programma_Annuale.pdf',
          url: '/materials/Programma_Annuale.pdf',
          extension: 'pdf',
          createdAt: new Date('2023-01-15'),
        },
      ],
    },
    {
      id: 'folder-6',
      name: 'Storia',
      createdAt: new Date('2023-01-15'),
      content: [
        {
          id: 'file-12',
          name: 'Rivoluzione_Francese.pdf',
          url: '/materials/Rivoluzione_Francese.pdf',
          extension: 'pdf',
          createdAt: new Date('2023-01-15'),
        },
        {
          id: 'file-13',
          name: 'Napoleone.docx',
          url: '/materials/Napoleone.docx',
          extension: 'docx',
          createdAt: new Date('2023-01-15'),
        },
        {
          id: 'folder-7',
          name: 'Documenti storici',
          createdAt: new Date('2023-01-15'),
          content: [
            {
              id: 'file-14',
              name: 'Costituzione_1789.pdf',
              url: '/materials/Costituzione_1789.pdf',
              extension: 'pdf',
              createdAt: new Date('2023-01-15'),
            },
            {
              id: 'file-15',
              name: 'Lettere_Epoca.txt',
              url: '/materials/Lettere_Epoca.txt',
              extension: 'txt',
              createdAt: new Date('2023-01-15'),
            },
          ],
        },
      ],
    },
    {
      id: 'folder-8',
      name: 'Scienze',
      createdAt: new Date('2023-01-15'),
      content: [
        {
          id: 'file-16',
          name: 'Biologia_Cellulare.pdf',
          url: '/materials/Biologia_Cellulare.pdf',
          extension: 'pdf',
          createdAt: new Date('2023-01-15'),
        },
        {
          id: 'file-17',
          name: 'Esperimenti_Lab.xlsx',
          url: '/materials/Esperimenti_Lab.xlsx',
          extension: 'xlsx',
          createdAt: new Date('2023-01-15'),
        },
        {
          id: 'file-18',
          name: 'Video_Microscopia.mp4',
          url: '/materials/Video_Microscopia.mp4',
          extension: 'mp4',
          createdAt: new Date('2023-01-15'),
        },
      ],
    },
    {
      id: 'file-19',
      name: 'Appunti_Vacanze.docx',
      url: '/materials/Appunti_Vacanze.docx',
      extension: 'docx',
      createdAt: new Date('2023-01-15'),
    },
    {
      id: 'file-20',
      name: 'Calendario_Scolastico.pdf',
      url: '/materials/Calendario_Scolastico.pdf',
      extension: 'pdf',
      createdAt: new Date('2023-01-15'),
    },
    {
      id: 'file-21',
      name: 'Regolamento.pdf',
      url: '/materials/Regolamento.pdf',
      extension: 'pdf',
      createdAt: new Date('2023-01-15'),
    },
  ];

  getCurrentPath(folderName: string): string[] {
    const path: string[] = ['Home'];

    const findPath = (
      items: (Folder | Materiale)[],
      currentPath: string[],
    ): string[] | null => {
      for (const item of items) {
        if ('content' in item) {
          if (item.name === folderName) {
            return [...currentPath, item.name];
          }
          const result = findPath(item.content, [...currentPath, item.name]);
          if (result) return result;
        }
      }
      return null;
    };

    const foundPath = findPath(this.root, path);
    return foundPath || path;
  }

  getFolderFromName(folderName: string): Folder | null {
    const findFolder = (items: (Folder | Materiale)[]): Folder | null => {
      for (const item of items) {
        if ('content' in item) {
          if (item.name === folderName) {
            return item as Folder;
          }
          const result = findFolder(item.content);
          if (result) return result;
        }
      }
      return null;
    };
    return findFolder(this.root);
  }

  // Backend operations
  createNewFolder(parentFolder: Folder): Folder {
    const newFolder: Folder = {
      id: `folder-${Date.now()}`,
      name: 'Nuova Cartella',
      content: [],
      createdAt: new Date(),
    };

    // TODO: Chiamata HTTP al backend per creare la cartella
    if (parentFolder.name === '/') {
      this.root.push(newFolder);
    } else {
      parentFolder.content.push(newFolder);
    }

    return newFolder;
  }

  uploadMaterial(file: File, targetFolder: Folder): Materiale {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const newMaterial: Materiale = {
      id: `file-${Date.now()}`,
      name: file.name,
      url: `/materials/${file.name}`,
      extension: extension,
      createdAt: new Date(),
    };

    // TODO: Chiamata HTTP al backend per caricare il file
    if (targetFolder.name === '/') {
      this.root.push(newMaterial);
    } else {
      targetFolder.content.push(newMaterial);
    }

    return newMaterial;
  }

  moveItem(
    itemId: string,
    targetFolderId: string,
    currentFolderId: string,
  ): boolean {
    // TODO: Chiamata HTTP al backend per spostare l'elemento
    // Per ora return true per simulare successo
    return true;
  }

  deleteItem(itemId: string): boolean {
    // TODO: Chiamata HTTP al backend per eliminare l'elemento

    const removeFromArray = (items: (Folder | Materiale)[]): boolean => {
      const index = items.findIndex((i) => i.id === itemId);
      if (index !== -1) {
        items.splice(index, 1);
        return true;
      }

      for (const item of items) {
        if ('content' in item) {
          if (removeFromArray(item.content)) {
            return true;
          }
        }
      }
      return false;
    };

    return removeFromArray(this.root);
  }

  renameItem(itemId: string, newName: string): boolean {
    const findAndRename = (items: (Folder | Materiale)[]): boolean => {
      for (const item of items) {
        if (item.id === itemId) {
          item.name = newName;
          return true;
        }
        if ('content' in item) {
          if (findAndRename((item as Folder).content)) {
            return true;
          }
        }
      }
      return false;
    };

    return findAndRename(this.root);
  }

  constructor() {}
}
