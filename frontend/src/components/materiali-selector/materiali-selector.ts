import {
  Component,
  computed,
  output,
  signal,
  ViewChild,
  ElementRef,
} from '@angular/core';
import {
  Folder,
  Materiale,
  MaterialiService,
} from '../../services/materiali-service';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/pro-solid-svg-icons';
import { getFileIcon } from '../../app/_utils/file-icons';
import { MaterialiItemComponent } from './materiali-item.component';

export interface MaterialeWithPath extends Materiale {
  path: string;
}

@Component({
  selector: 'app-materiali-selector',
  imports: [FormsModule, FontAwesomeModule, MaterialiItemComponent],
  templateUrl: './materiali-selector.html',
  styleUrl: './materiali-selector.scss',
})
export class MaterialiSelector {
  // State
  FolderIcon = getFileIcon('folder');
  UploadIcon = getFileIcon('upload');
  TimesIcon = getFileIcon('times');
  expandedFolders = signal<Set<string>>(new Set());
  selectedMaterialIds = signal<Set<string>>(new Set());
  searchQuery = signal<string>('');
  isUploading = signal<boolean>(false);

  // ViewChild per l'input file
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // Output dei materiali selezionati
  selectionChange = output<Materiale[]>();

  constructor(private materialiService: MaterialiService) {}

  get tree(): (Folder | Materiale)[] {
    return this.materialiService.root;
  }

  // Computed: materiali selezionati come array
  selectedMaterials = computed(() => {
    const ids = this.selectedMaterialIds();
    return this.flattenMaterials(this.tree).filter((m) => ids.has(m.id));
  });

  // Computed: risultati di ricerca (lista piatta filtrata)
  searchResults = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return [];
    const materialsWithPath = this.flattenMaterialsWithPath(this.tree);
    return materialsWithPath.filter((m) =>
      m.name.toLowerCase().includes(query),
    );
  });

  // Flag per sapere se stiamo cercando
  isSearching = computed(() => this.searchQuery().trim().length > 0);

  toggleFolder(folderId: string): void {
    this.expandedFolders.update((set) => {
      const newSet = new Set(set);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  }

  selectMaterial(material: Materiale): void {
    this.selectedMaterialIds.update((set) => {
      const newSet = new Set(set);
      if (newSet.has(material.id)) {
        newSet.delete(material.id);
      } else {
        newSet.add(material.id);
      }
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
      // Simula upload (in produzione qui andrà la chiamata API)
      await this.simulateUpload(file);

      // Estrae estensione dal nome file
      const extension = file.name.split('.').pop() || '';

      // Crea il nuovo materiale
      const newMaterial: Materiale = {
        id: `file-${Date.now()}`,
        name: file.name,
        url: `/materials/${file.name}`, // URL temporaneo
        extension: extension,
        createdAt: new Date(),
      };

      // Aggiunge alla root del tree
      this.materialiService.root.push(newMaterial);

      // Seleziona automaticamente il materiale appena caricato
      this.selectMaterial(newMaterial);

      // Reset input
      input.value = '';
    } catch (error) {
      console.error("Errore durante l'upload:", error);
      // TODO: Gestire errore con notifica utente
    } finally {
      this.isUploading.set(false);
    }
  }

  private simulateUpload(file: File): Promise<void> {
    // Simula un delay di upload
    return new Promise((resolve) => setTimeout(resolve, 1000));
  }

  private flattenMaterials(items: (Folder | Materiale)[]): Materiale[] {
    const result: Materiale[] = [];
    for (const item of items) {
      if ('content' in item) {
        result.push(...this.flattenMaterials(item.content));
      } else {
        result.push(item);
      }
    }
    return result;
  }

  private flattenMaterialsWithPath(
    items: (Folder | Materiale)[],
    currentPath: string = '',
  ): MaterialeWithPath[] {
    const result: MaterialeWithPath[] = [];
    for (const item of items) {
      if ('content' in item) {
        const newPath = currentPath
          ? `${currentPath} / ${item.name}`
          : item.name;
        result.push(...this.flattenMaterialsWithPath(item.content, newPath));
      } else {
        result.push({ ...item, path: currentPath });
      }
    }
    return result;
  }
}
