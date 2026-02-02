import { Component, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faSave } from '@fortawesome/pro-solid-svg-icons';
import { ClassiService } from '../../services/classi-service';
import { ClassSelector } from '../../components/class-selector/class-selector';
import { BackTo } from '../../components/back-to/back-to';
import { MaterialiSelector } from '../../components/materiali-selector/materiali-selector';

@Component({
  selector: 'app-create-edit-comunicazione',
  standalone: true,
  imports: [
    FontAwesomeModule,
    FormsModule,
    ReactiveFormsModule,
    ClassSelector,
    RouterModule,
    BackTo,
    MaterialiSelector,
  ],
  templateUrl: './create-edit-comunicazione.html',
  styleUrl: './create-edit-comunicazione.scss',
})
export class CreateEditComunicazione implements OnInit {
  SaveIcon = faSave;
  ArrowLeftIcon = faArrowLeft;

  comunicazioneForm: FormGroup = new FormGroup({
    title: new FormControl('', [Validators.required]),
    content: new FormControl('', [Validators.required]),
    classes: new FormControl([]),
  });
  comunicazioneId: string | null = null;

  get assignedClasses(): string[] {
    return this.comunicazioneForm.get('classes')?.value || [];
  }

  onClassesChange(classIds: string[]): void {
    this.comunicazioneForm.get('classes')?.setValue(classIds);
  }

  onDelete() {
    throw new Error('Method not implemented.');
  }

  onSave() {
    throw new Error('Method not implemented.');
  }

  constructor(
    private route: ActivatedRoute,
    public classiService: ClassiService,
  ) {}
  ngOnInit() {
    this.route.params.subscribe((params) => {
      console.log(params);
      this.comunicazioneId = params['comunicazioneId'];
    });
  }
}
