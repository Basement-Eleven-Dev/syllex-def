import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faFile,
  faPlus,
  faSave,
  faXmark,
} from '@fortawesome/pro-regular-svg-icons';
import { getFileIcon, getIconColor } from '../../app/_utils/file-icons';
import { FileViewer } from '../file-viewer/file-viewer';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-agent-settings-form',
  imports: [FormsModule, ReactiveFormsModule, FontAwesomeModule, FileViewer],
  templateUrl: './agent-settings-form.html',
  styleUrl: './agent-settings-form.scss',
})
export class AgentSettingsForm {
  onSave() {
    throw new Error('Method not implemented.');
  }
  FileIcon = faFile;
  XmarkIcon = faXmark;
  SaveIcon = faSave;
  PlusIcon = faPlus;

  agentSettingsForm: FormGroup = new FormGroup({
    name: new FormControl('', [Validators.required]),
    description: new FormControl(''),
    tone: new FormControl('friendly', [Validators.required]),
    voice: new FormControl(''),
  });

  tone: 'friendly' | 'formal' | 'concise' | 'detailed' = 'friendly';
  name: string = '';
  description: string = '';
  files: File[] = [];

  getFileIcon(fileName: string) {
    console.log('Getting icon for file:', fileName);
    let extension = fileName.split('.').pop()?.toLowerCase() || '';
    return getFileIcon(extension);
  }

  getFileIconColor(fileName: string) {
    let extension = fileName.split('.').pop()?.toLowerCase() || '';
    return getIconColor(extension);
  }

  constructor(private modalService: NgbModal) {}

  onFileSelected(event: any) {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      const newFiles: File[] = Array.from(selectedFiles);
      this.files.push(...newFiles);
      event.target.value = '';
    }
  }

  removeFile(index: number) {
    this.files.splice(index, 1);
  }

  onRequestViewFile(file: File) {
    const fileURL = URL.createObjectURL(file);
    this.modalService.open(FileViewer, {
      size: 'lg',
      centered: true,
      scrollable: true,
    }).componentInstance.docUrl = fileURL;
  }

  onSubmit() {
    if (this.agentSettingsForm.valid) {
      const formData = this.agentSettingsForm.value;
      console.log('Form submitted with data:', formData);
      // Here you can handle the form submission, e.g., send the data to a server
    } else {
      console.log('Form is invalid');
    }
  }
}
