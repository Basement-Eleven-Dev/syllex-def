import {
  Injectable,
  inject,
  signal,
  computed,
  effect,
  untracked,
} from '@angular/core';
import { Observable, map, tap, switchMap } from 'rxjs';

import { FilesService } from '../files-service';
import { getFileExtension } from '../../app/_utils/file-validation.utils';
import { MaterialInterface, MaterialiService } from './materiali-service';
import { MaterialeSearchService } from './materiale-search.service';
import { MaterialeSelectionService } from './materiale-selection.service';
import { Materia } from '../materia';

/**
 * Facade that coordinates MaterialiService, SearchService, SelectionService
 * and FilesService. Centralises search state, navigation logic and
 * file-upload orchestration so the component stays thin.
 */
@Injectable({ providedIn: 'root' })
export class MaterialiFacadeService {
  private readonly materialiService = inject(MaterialiService);
  private readonly searchService = inject(MaterialeSearchService);
  private readonly selectionService = inject(MaterialeSelectionService);
  private readonly fileService = inject(FilesService);

  private static readonly ROOT_FOLDER: Readonly<
    Pick<MaterialInterface, '_id' | 'name' | 'type' | 'createdAt'>
  > = {
    _id: 'root',
    name: '/',
    type: 'folder',
    createdAt: new Date(),
  };

  // ── Public Signals ────────────────────────────────────────────────

  readonly searchTerm = signal('');
  readonly highlightedItemId = signal<string | null>(null);
  readonly isLoading = this.materialiService.isLoading;
  readonly isStorageFull = this.materialiService.isStorageFull;
  readonly selectedCount = computed(
    () => this.selectionService.selectedIds().size,
  );
  readonly suggestedTopics = signal<string[]>([]);
  private readonly materiaService = inject(Materia);

  readonly rootFolder = computed<MaterialInterface>(() => {
    const current = this.materialiService.currentFolder();
    return (
      current || {
        ...MaterialiFacadeService.ROOT_FOLDER,
        content: this.materialiService.root(),
      }
    );
  });

  readonly currentPathArray = computed(() =>
    this.materialiService.getCurrentPath(this.rootFolder().name),
  );

  // ── Private Search State ──────────────────────────────────────────

  private folderBeforeSearch: MaterialInterface | null = null;
  private isSearchActive = false;

  constructor() {
    effect(() => {
      const term = this.searchTerm().trim();

      if (term.length >= 2) {
        if (!this.isSearchActive) {
          // Save current folder BEFORE navigating — use untracked to avoid
          // creating an unwanted reactive dependency on rootFolder.
          this.folderBeforeSearch = untracked(() => ({
            ...this.rootFolder(),
          }));
          this.isSearchActive = true;
        }
        untracked(() => this.performSearch(term));
      } else if (term.length === 0 && this.isSearchActive) {
        untracked(() => this.restorePreSearchState());
      }
    });
  }

  // ── Navigation ────────────────────────────────────────────────────

  openItem(item: MaterialInterface | string): void {
    this.resetSearchState();

    if (item === 'Home') {
      this.materialiService.currentFolder.set(null);
      return;
    }

    if (typeof item === 'string') {
      const folder = this.materialiService.getFolderFromName(item);
      if (folder) this.materialiService.currentFolder.set(folder);
      return;
    }

    if (item.type === 'folder') {
      this.materialiService.currentFolder.set(item);
    }
  }

  // ── File Upload ───────────────────────────────────────────────────

  uploadFile(file: File): Observable<MaterialInterface> {
    return this.fileService.uploadFile(file.name, file).pipe(
      switchMap((url) => {
        const material: MaterialInterface = {
          _id: `temp-id-${Date.now()}`,
          name: file.name,
          type: 'file',
          url,
          extension: getFileExtension(file.name),
          createdAt: new Date(),
          byteSize: file.size,
        };
        return this.materialiService.createMaterial(
          material,
          this.rootFolder(),
        );
      }),
      tap((response) => {
        if (response.suggestedTopics && response.suggestedTopics.length > 0) {
          this.suggestedTopics.update((current) => {
            const newTopics = response.suggestedTopics!.filter(
              (t) => !current.includes(t),
            );
            return [...current, ...newTopics];
          });
        }
      }),
      map((response) => response.material),
    );
  }

  addSuggestedTopic(topic: string): Observable<any> {
    const subjectId = this.materiaService.materiaSelected()?._id;
    if (!subjectId) throw new Error('Nessuna materia selezionata');

    return this.materiaService.addTopic(subjectId, topic).pipe(
      tap(() => {
        // Rimuovi il topic dai suggerimenti dopo averlo aggiunto
        this.suggestedTopics.update((current) =>
          current.filter((t) => t !== topic),
        );
      }),
    );
  }

  dismissSuggestedTopic(topic: string): void {
    this.suggestedTopics.update((current) =>
      current.filter((t) => t !== topic),
    );
  }

  reload(): void {
    this.materialiService.loadMaterials();
  }

  // ── CRUD ──────────────────────────────────────────────────────────

  createFolder(): Observable<MaterialInterface> {
    const folder: MaterialInterface = {
      _id: `temp-id-${Date.now()}`,
      name: 'Nuova Cartella',
      type: 'folder',
      content: [],
    };
    return this.materialiService
      .createMaterial(folder, this.rootFolder())
      .pipe(map((response) => response.material));
  }

  deleteItem(itemId: string) {
    return this.materialiService
      .deleteItem(itemId)
      .pipe(tap(() => this.selectionService.clear()));
  }

  deleteSelectedItems() {
    const ids = Array.from(this.selectionService.selectedIds());
    return this.materialiService
      .deleteItems(ids)
      .pipe(tap(() => this.selectionService.clear()));
  }

  renameItem(itemId: string, newName: string) {
    return this.materialiService.renameItem(itemId, newName);
  }

  // ── Selection ─────────────────────────────────────────────────────

  selectItem(itemId: string, isMultiSelect: boolean): void {
    this.selectionService.toggle(itemId, isMultiSelect);
  }

  isItemSelected(itemId: string): boolean {
    return this.selectionService.isSelected(itemId);
  }

  isAllSelected(): boolean {
    const items = this.rootFolder().content || [];
    return (
      items.length > 0 &&
      items.every((item) => this.selectionService.isSelected(item._id!))
    );
  }

  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.selectionService.clear();
    } else {
      const items = this.rootFolder().content || [];
      const selected = this.selectionService.selectedIds();
      items.forEach((item) => {
        if (!selected.has(item._id!)) {
          this.selectionService.toggle(item._id!, true);
        }
      });
    }
  }

  deselectAll(): void {
    this.selectionService.clear();
  }

  getSelection(): Set<string> {
    return this.selectionService.getSelection();
  }

  // ── Search ────────────────────────────────────────────────────────

  clearSearch(): void {
    // Reset state BEFORE clearing the term so the effect's condition
    // (isSearchActive) is already false when it fires.
    this.restorePreSearchState();
    this.searchTerm.set('');
  }

  // ── Private Helpers ───────────────────────────────────────────────

  private performSearch(term: string): void {
    const result = this.searchService.search(
      term,
      this.materialiService.root(),
    );

    if (result) {
      if (result.parentPath.length > 0) {
        this.materialiService.currentFolder.set(result.parentPath.at(-1)!);
      } else {
        this.materialiService.currentFolder.set(null);
      }
      this.highlightedItemId.set(result.item._id!);
    } else {
      this.highlightedItemId.set(null);
    }
  }

  private restorePreSearchState(): void {
    if (this.folderBeforeSearch) {
      this.materialiService.currentFolder.set(this.folderBeforeSearch);
      this.folderBeforeSearch = null;
    }
    this.isSearchActive = false;
    this.highlightedItemId.set(null);
  }

  private resetSearchState(): void {
    this.folderBeforeSearch = null;
    this.isSearchActive = false;
  }
}
