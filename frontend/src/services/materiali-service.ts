import { HttpClient } from '@angular/common/http';
import { Injectable, effect, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Materia } from './materia';

export interface MaterialInterface {
  _id: string;
  name: string;
  type?: 'file' | 'folder';
  url?: string;
  extension?: string;
  content?: MaterialInterface[];
  createdAt?: Date;
  aiGenerated?: boolean;
  teacherId?: string;
  subjectId?: string;
  classIds?: string[];
  isVectorized?: boolean;
  isMap?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class MaterialiService {
  root = signal<MaterialInterface[]>([]);
  currentFolder = signal<MaterialInterface | null>(null);
  isLoading = signal<boolean>(false);

  constructor(
    private httpClient: HttpClient,
    private materiaService: Materia,
  ) {
    // Reagisci ai cambiamenti della materia selezionata
    effect(() => {
      const selectedSubject = this.materiaService.materiaSelected();
      if (selectedSubject) {
        console.log('Materia selezionata:', selectedSubject);
        this.loadMaterials();
      }
    });
  }

  loadMaterials(): void {
    const subjectId = this.materiaService.materiaSelected()?._id;
    if (!subjectId) return;

    this.isLoading.set(true);
    this.httpClient
      .get<{
        success: boolean;
        materials: MaterialInterface[];
      }>('materials/subject')
      .subscribe({
        next: (response) => {
          this.currentFolder.set(null);
          this.root.set(this.buildTree(response.materials));
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Errore durante il caricamento dei materiali:', err);
          this.isLoading.set(false);
        },
      });
  }

  loadMaterialsForStudent(subjectId: string): void {
    if (!subjectId) return;

    // Aggiorna il localStorage così l'interceptor invia il Subject-Id corretto
    localStorage.setItem('selectedSubjectId', subjectId);
    this.isLoading.set(true);
    this.currentFolder.set(null);

    this.httpClient
      .get<{
        success: boolean;
        materials: MaterialInterface[];
      }>('students/me/materials')
      .subscribe({
        next: (response) => {
          this.root.set(this.buildTree(response.materials));
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Errore durante il caricamento dei materiali studente:', err);
          this.isLoading.set(false);
        },
      });
  }

  get filesCount(): number {
    const countFiles = (items: MaterialInterface[]): number => {
      return items.reduce((count, item) => {
        if (item.type === 'file') {
          return count + 1;
        } else if (item.type === 'folder' && item.content) {
          return count + countFiles(item.content);
        }
        return count;
      }, 0);
    };
    return countFiles(this.root());
  }

  countFiles(): number {
    return this.filesCount;
  }

  private buildTree(materials: MaterialInterface[]): MaterialInterface[] {
    const itemMap = new Map<string, MaterialInterface>();
    const childrenMap = new Map<string, Set<string>>();

    // Crea mappa items e mappa relazioni parent-child
    materials.forEach((material) => {
      itemMap.set(material._id, {
        ...material,
        content: material.type === 'folder' ? [] : undefined,
      });

      if (material.type === 'folder' && material.content) {
        const childIds = material.content.map((child) =>
          typeof child === 'string' ? child : child._id,
        );
        childIds.forEach((childId) => {
          if (!childrenMap.has(childId)) {
            childrenMap.set(childId, new Set());
          }
          childrenMap.get(childId)!.add(material._id);
        });
      }
    });

    // Costruisci albero e identifica root items
    const rootItems: MaterialInterface[] = [];
    materials.forEach((material) => {
      const item = itemMap.get(material._id)!;
      const parentIds = childrenMap.get(material._id);

      if (parentIds && parentIds.size > 0) {
        parentIds.forEach((parentId) => {
          const parent = itemMap.get(parentId);
          if (parent?.content) {
            parent.content.push(item);
          }
        });
      } else {
        rootItems.push(item);
      }
    });

    return rootItems;
  }

  getCurrentPath(folderName: string): string[] {
    const path: string[] = ['Home'];
    const folder = this.findItem(
      (item) => item.type === 'folder' && item.name === folderName,
    );

    if (!folder) return path;

    const buildPath = (
      items: MaterialInterface[],
      currentPath: string[],
    ): string[] | null => {
      for (const item of items) {
        if (item._id === folder._id) {
          return [...currentPath, item.name];
        }
        if (item.type === 'folder' && item.content) {
          const result = buildPath(item.content, [...currentPath, item.name]);
          if (result) return result;
        }
      }
      return null;
    };

    return buildPath(this.root(), path) || path;
  }

  getFolderFromName(folderName: string): MaterialInterface | null {
    return this.findItem(
      (item) => item.type === 'folder' && item.name === folderName,
    );
  }

  getFolderById(folderId: string): MaterialInterface | null {
    return this.findItem(
      (item) => item._id === folderId && item.type === 'folder',
    );
  }

  private findItem(
    predicate: (item: MaterialInterface) => boolean,
  ): MaterialInterface | null {
    const search = (items: MaterialInterface[]): MaterialInterface | null => {
      for (const item of items) {
        if (predicate(item)) return item;
        if (item.type === 'folder' && item.content) {
          const result = search(item.content);
          if (result) return result;
        }
      }
      return null;
    };
    return search(this.root());
  }

  uploadMaterial(
    file: File,
    targetFolder: MaterialInterface,
  ): MaterialInterface {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const newMaterial: MaterialInterface = {
      _id: `file-${Date.now()}`,
      name: file.name,
      url: `/materials/${file.name}`,
      extension: extension,
      createdAt: new Date(),
    };

    // TODO: Chiamata HTTP al backend per caricare il file
    if (targetFolder.name === '/') {
      this.root.update((current) => [...current, newMaterial]);
    } else {
      targetFolder.content!.push(newMaterial);
    }

    return newMaterial;
  }

  moveItem(
    itemId: string,
    targetFolderId: string,
  ): Observable<{
    success: boolean;
    moved: boolean;
    removedFromParents: number;
  }> {
    return this.moveItems([itemId], targetFolderId).pipe(
      map((result) => ({
        success: result.success,
        moved: result.moved,
        removedFromParents: result.removedFromParents,
      })),
    );
  }

  moveItems(
    itemIds: string[],
    targetFolderId: string,
  ): Observable<{
    success: boolean;
    moved: boolean;
    movedCount: number;
    removedFromParents: number;
  }> {
    // Invia null al backend se il target è root
    const backendParentId = targetFolderId === 'root' ? null : targetFolderId;

    return this.httpClient
      .post<{
        success: boolean;
        moved: boolean;
        movedCount: number;
        removedFromParents: number;
      }>('materials/move-batch', {
        materialIds: itemIds,
        newParentId: backendParentId,
      })
      .pipe(
        tap(() => {
          // Trova tutti gli item da spostare
          const items = itemIds
            .map((id) => this.findItemById(id))
            .filter((item): item is MaterialInterface => item !== null);

          // Rimuovi tutti gli item dalle posizioni correnti
          itemIds.forEach((id) => this.removeItemFromAllParents(id));

          // Aggiungi tutti gli item alla nuova posizione
          if (targetFolderId === 'root') {
            // Aggiungi al root array
            const newItems = items.filter(
              (item) => !this.root().find((i) => i._id === item._id),
            );
            if (newItems.length > 0) {
              this.root.update((current) => [...current, ...newItems]);
            }
          } else {
            // Aggiungi alla cartella target
            const targetFolder = this.getFolderById(targetFolderId);
            if (targetFolder?.content) {
              const newItems = items.filter(
                (item) =>
                  !targetFolder.content!.find((i) => i._id === item._id),
              );
              targetFolder.content.push(...newItems);
            }
          }
        }),
      );
  }

  deleteItem(itemId: string): Observable<{
    success: boolean;
    deleted: boolean;
    removedFromParents: number;
  }> {
    return this.httpClient
      .delete<{
        success: boolean;
        deleted: boolean;
        removedFromParents: number;
      }>(`materials/${itemId}`)
      .pipe(tap(() => this.removeItemFromAllParents(itemId)));
  }

  renameItem(
    itemId: string,
    newName: string,
  ): Observable<{ success: boolean; renamed: boolean }> {
    return this.httpClient
      .put<{
        success: boolean;
        renamed: boolean;
      }>(`materials/${itemId}/rename`, { newName })
      .pipe(
        tap(() => {
          const item = this.findItemById(itemId);
          if (item) {
            item.name = newName;
          }
        }),
      );
  }

  createMaterial(
    material: MaterialInterface,
    parent: MaterialInterface,
  ): Observable<{ success: boolean; material: MaterialInterface }> {
    console.log('Creating material under parent:', parent);

    return this.httpClient
      .post<{
        success: boolean;
        material: MaterialInterface;
      }>('materials', {
        material,
        parentId: parent._id === 'root' ? null : parent._id,
      })
      .pipe(
        tap((response) => {
          if (parent._id === 'root') {
            this.root.update((current) => [...current, response.material]);
          } else if (parent.content) {
            parent.content.push(response.material);
          }
        }),
      );
  }

  private findItemById(itemId: string): MaterialInterface | null {
    return this.findItem((item) => item._id === itemId);
  }

  private removeItemFromAllParents(itemId: string): void {
    const removeFromArray = (items: MaterialInterface[]): void => {
      const index = items.findIndex((i) => i._id === itemId);
      if (index !== -1) {
        items.splice(index, 1);
        return;
      }
      items.forEach((item) => {
        if (item.type === 'folder' && item.content) {
          removeFromArray(item.content);
        }
      });
    };
    removeFromArray(this.root());
  }

  getMaterialById(id: string): MaterialInterface | undefined {
    return this.findItem((item) => item._id === id) || undefined;
  }

  updateClassIds(
    materialId: string,
    classIds: string[],
  ): Observable<{ success: boolean; material: MaterialInterface }> {
    return this.httpClient.put<{
      success: boolean;
      material: MaterialInterface;
    }>(`materials/${materialId}/classes`, { classIds });
  }
}
