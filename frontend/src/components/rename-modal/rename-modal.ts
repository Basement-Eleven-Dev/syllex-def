import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-rename-modal',
  imports: [FormsModule],
  templateUrl: './rename-modal.html',
  styleUrl: './rename-modal.scss',
  standalone: true,
})
export class RenameModal {
  @Input() currentName: string = '';
  newName: string = '';

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit() {
    this.newName = this.currentName;
  }

  onSave() {
    if (this.newName.trim() && this.newName !== this.currentName) {
      this.activeModal.close(this.newName.trim());
    }
  }

  onCancel() {
    this.activeModal.dismiss();
  }
}
