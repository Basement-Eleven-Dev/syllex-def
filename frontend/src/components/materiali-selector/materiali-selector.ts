import {
  Component,
  computed,
  effect,
  input,
  output,
  signal,
  ViewChild,
  ElementRef,
  Input,
} from '@angular/core';
import {
  MaterialInterface,
  MaterialiService,
} from '../../services/materiali-service';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faUpload,
  faCheckCircle,
  IconDefinition,
} from '@fortawesome/pro-solid-svg-icons';
import {
  getFileIcon,
  getIconColor,
  isTextFile,
} from '../../app/_utils/file-icons';
import { MaterialiItemComponent } from './materiali-item.component';

export interface MaterialeWithPath extends MaterialInterface {
  path: string;
}

@Component({
  selector: 'app-materiali-selector',
  imports: [FormsModule, FontAwesomeModule, MaterialiItemComponent],
  templateUrl: './materiali-selector.html',
  styleUrl: './materiali-selector.scss',
})
export class MaterialiSelector {
  FolderIcon = getFileIcon('folder');
  UploadIcon = faUpload;
  TimesIcon = getFileIcon('times');
  CheckIcon = faCheckCircle;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @Input() embeddingCreationMode: boolean = false;

  initialMaterialIds = input<string[]>([]);
  selectionChange = output<MaterialInterface[]>();

  getIconColor(item: MaterialInterface): string {
    return getIconColor(item.extension || '');
  }

  expandedFolders = signal<Set<string>>(new Set());
  selectedMaterialIds = signal<Set<string>>(new Set());
  searchQuery = signal<string>('');
  isUploading = signal<boolean>(false);

  materialsTree = computed(() => this.materialiService.root());
  allMaterials = computed(() => this.flattenTree(this.materialsTree()));

  // Filtraggi file testuali caricati dalle utility

  processedMaterials = computed(() => {
    const all = this.allMaterials();
    if (!this.embeddingCreationMode) return [];
    return all.filter((m) => {
      if (m.type === 'folder' || (m as any).content?.length > 0) return false;
      return m.isVectorized && isTextFile(m.extension || '');
    });
  });

  filteredMaterials = computed(() => {
    const all = this.allMaterials();
    if (!this.embeddingCreationMode) return all;
    return all.filter((m) => {
      // Escludi cartelle (che hanno content) e filtra solo file testuali NON processati
      if (m.type === 'folder' || (m as any).content?.length > 0) return false;
      return isTextFile(m.extension || '') && !m.isVectorized;
    });
  });

  selectedMaterials = computed(() => {
    const ids = this.selectedMaterialIds();
    return this.filteredMaterials().filter((m) => ids.has(m._id));
  });

  searchResults = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return [];
    // Applica filtro anche ai risultati di ricerca se in embedding mode
    const all = this.flattenTreeWithPath(this.materialsTree());
    const filtered = this.embeddingCreationMode
      ? all.filter((m) => {
          // Escludi cartelle (che hanno content) e filtra solo file testuali NON processati
          if (m.type === 'folder' || (m as any).content?.length > 0)
            return false;
          return isTextFile(m.extension || '') && !m.isVectorized;
        })
      : all;
    return filtered.filter((m) => m.name.toLowerCase().includes(query));
  });

  isSearching = computed(() => this.searchQuery().trim().length > 0);

  constructor(public materialiService: MaterialiService) {
    effect(() => {
      const ids = this.initialMaterialIds();
      if (ids.length > 0) {
        this.selectedMaterialIds.set(new Set(ids));
        this.selectionChange.emit(this.selectedMaterials());
      }
    });
  }

  toggleFolder(folderId: string): void {
    this.expandedFolders.update((set) => {
      const newSet = new Set(set);
      newSet.has(folderId) ? newSet.delete(folderId) : newSet.add(folderId);
      return newSet;
    });
  }

  selectMaterial(material: MaterialInterface): void {
    this.selectedMaterialIds.update((set) => {
      const newSet = new Set(set);
      newSet.has(material._id)
        ? newSet.delete(material._id)
        : newSet.add(material._id);
      return newSet;
    });
    this.selectionChange.emit(this.selectedMaterials());
  }

  updateSearch(query: string): void {
    this.searchQuery.set(query);
  }

  deselectAll(): void {
    this.selectedMaterialIds.set(new Set());
    this.selectionChange.emit([]);
  }

  getFileIcon(extension: string): IconDefinition {
    return getFileIcon(extension);
  }

  triggerFileUpload(): void {
    this.fileInput.nativeElement.click();
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.isUploading.set(true);

    try {
      await this.simulateUpload(file);

      const newMaterial: MaterialInterface = {
        _id: `file-${Date.now()}`,
        name: file.name,
        url: `/materials/${file.name}`,
        extension: file.name.split('.').pop() || '',
        createdAt: new Date(),
      };

      this.materialiService.root.update((current) => [...current, newMaterial]);
      this.selectMaterial(newMaterial);

      input.value = '';
    } catch (error) {
      console.error("Errore durante l'upload:", error);
    } finally {
      this.isUploading.set(false);
    }
  }

  private simulateUpload(file: File): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 1000));
  }

  private flattenTree(items: MaterialInterface[]): MaterialInterface[] {
    return items.flatMap((item) =>
      item.content?.length ? this.flattenTree(item.content) : [item],
    );
  }

  private flattenTreeWithPath(
    items: MaterialInterface[],
    currentPath = '',
  ): MaterialeWithPath[] {
    return items.flatMap((item) => {
      if (item.content?.length) {
        const newPath = currentPath
          ? `${currentPath} / ${item.name}`
          : item.name;
        return this.flattenTreeWithPath(item.content, newPath);
      }
      return [{ ...item, path: currentPath }];
    });
  }
}
