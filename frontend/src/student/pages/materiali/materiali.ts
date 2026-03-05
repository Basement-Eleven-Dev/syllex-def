import { Component, computed, effect, inject, signal } from '@angular/core';
import { Materia } from '../../../services/materia';
import { MaterialiService, MaterialInterface } from '../../../services/materiali-service';
import { MaterialeCard } from '../../../teacher/components/materiale-card/materiale-card';


@Component({
  selector: 'app-materiali',
  imports: [MaterialeCard],
  templateUrl: './materiali.html',
  styleUrl: './materiali.scss',
})
export class Materiali {
  private readonly ROOT_FOLDER_CONFIG = {
    _id: 'root',
    name: '/',
    type: 'folder' as const,
    createdAt: new Date(),
  };

  private readonly materiaService = inject(Materia);
  readonly materialiService = inject(MaterialiService);

  readonly Subjects = this.materiaService.allMaterie;

  readonly SelectedSubject = signal(
    this.materiaService.materiaSelected()?._id ?? '',
  );

  protected readonly rootFolder = computed(() => {
    const current = this.materialiService.currentFolder();
    return (
      current || {
        ...this.ROOT_FOLDER_CONFIG,
        content: this.materialiService.root(),
      }
    );
  });

  protected readonly currentPathArray = computed(() => {
    const folder = this.rootFolder();
    return this.materialiService.getCurrentPath(folder.name);
  });

  constructor() {
    // Quando materiaSelected si risolve (async) e SelectedSubject è ancora vuoto, lo imposta
    effect(() => {
      const materia = this.materiaService.materiaSelected();
      if (materia && !this.SelectedSubject()) {
        this.SelectedSubject.set(materia._id);
      }
    });

    // Ogni volta che cambia la materia selezionata, ricarica i materiali per lo studente
    effect(() => {
      const subjectId = this.SelectedSubject();
      if (subjectId) {
        this.materialiService.loadMaterialsForStudent(subjectId);
      }
    });
  }

  onSubjectChange(subjectId: string): void {
    this.SelectedSubject.set(subjectId);

    // Sincronizza il servizio globale Materia
    const subject = this.Subjects().find((s) => s._id === subjectId);
    if (subject) {
      this.materiaService.setSelectedSubject(subject);
    }
  }

  onOpenFolder(item: MaterialInterface): void {
    if (item.type === 'folder') {
      this.materialiService.currentFolder.set(item);
    }
  }

  onNavigateHome(): void {
    this.materialiService.currentFolder.set(null);
  }
}
