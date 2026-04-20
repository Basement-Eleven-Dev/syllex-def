import { Component, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FILE_INPUT_ACCEPT, getAllowedExtensionsLabel, isFileExtensionAllowed } from '../../../_utils/file-validation.utils';
import { KnowledgeAdminSource, KnowledgeDocumentInterface } from '../../service/knowledge-admin-source';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { 
  faCloudArrowUp, 
  faBookOpen, 
  faEye, 
  faTrash, 
  faUsers, 
  faUserTie, 
  faUserGraduate, 
  faCheckCircle, 
  faHourglassHalf,
  faPencil
} from '@fortawesome/pro-regular-svg-icons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-knowledge-source-admin',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, FormsModule],
  templateUrl: './knowledge-source-admin.html',
  styleUrl: './knowledge-source-admin.scss',
})
export class KnowledgeSourceAdmin implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  protected readonly acceptedExtensions = FILE_INPUT_ACCEPT;
  protected readonly isUploading = signal(false);
  protected readonly isLoading = signal(true);
  protected readonly isSavingEdit = signal(false);
  protected readonly knowledgeDocuments = signal<KnowledgeDocumentInterface[]>([]);
  
  protected editingDoc: KnowledgeDocumentInterface | null = null;

  protected readonly icons = {
    faCloudArrowUp,
    faBookOpen,
    faEye,
    faTrash,
    faUsers,
    faUserTie,
    faUserGraduate,
    faCheckCircle,
    faHourglassHalf,
    faPencil
  };
  
  protected selectedRole: 'student' | 'teacher' | 'both' = 'both';
  
  private readonly knowledgeSourceService = inject(KnowledgeAdminSource);
  private readonly modalService = inject(NgbModal);

  ngOnInit(): void {
    this.fetchDocuments();
  }

  fetchDocuments(): void {
    this.isLoading.set(true);
    this.knowledgeSourceService.getKnowledgeDocuments().subscribe({
      next: (docs) => {
        this.knowledgeDocuments.set(docs);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Errore durante il recupero dei documenti:', err);
        this.isLoading.set(false);
      }
    });
  }

  onRequestUpload(): void {
    this.fileInput.nativeElement.click();
  }

  onRoleChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedRole = select.value as any;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!isFileExtensionAllowed(file.name)) {
      alert(
        `Formato file non supportato. Estensioni consentite: ${getAllowedExtensionsLabel()}`,
      );
      input.value = '';
      return;
    }

    this.isUploading.set(true);
    this.knowledgeSourceService.uploadKnowledgeDocument(file, this.selectedRole).subscribe({
      next: (newDoc) => {
        input.value = '';
        this.isUploading.set(false);
        this.knowledgeDocuments.update(docs => [newDoc, ...docs]);
      },
      error: (err) => {
        console.error('Errore durante il caricamento:', err);
        this.isUploading.set(false);
        alert('Errore durante il caricamento del documento.');
      },
    });
  }

  onDeleteDocument(doc: KnowledgeDocumentInterface): void {
    if (!confirm(`Sei sicuro di voler eliminare il documento "${doc.name}"?`)) return;

    this.knowledgeSourceService.deleteDoc(doc._id).subscribe({
      next: () => {
        this.knowledgeDocuments.update(docs => docs.filter(d => d._id !== doc._id));
      },
      error: (err) => {
        console.error('Errore durante l\'eliminazione:', err);
        alert('Errore durante l\'eliminazione del documento.');
      }
    });
  }

  onEditDocument(doc: KnowledgeDocumentInterface, content: any): void {
    this.editingDoc = { ...doc }; // Create a clone to edit
    this.modalService.open(content, { centered: true }).result.then(
      (result) => {
        if (result === 'save') {
           this.onSaveEdit();
        }
      },
      () => {
        this.editingDoc = null;
      }
    );
  }

  onSaveEdit(): void {
    if (!this.editingDoc) return;
    
    this.isSavingEdit.set(true);
    const { _id, name, role } = this.editingDoc;
    
    this.knowledgeSourceService.updateDoc(_id, { name, role }).subscribe({
      next: (updatedDoc) => {
        this.knowledgeDocuments.update(docs => 
          docs.map(d => d._id === updatedDoc._id ? updatedDoc : d)
        );
        this.isSavingEdit.set(false);
        this.editingDoc = null;
      },
      error: (err) => {
        console.error('Errore durante l\'aggiornamento:', err);
        this.isSavingEdit.set(false);
        alert('Errore durante l\'aggiornamento del documento.');
      }
    });
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
