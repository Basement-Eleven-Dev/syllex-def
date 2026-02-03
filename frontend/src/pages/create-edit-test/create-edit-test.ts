import { Component, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faInfinity,
  faKey,
  faPenRuler,
  faSave,
} from '@fortawesome/pro-solid-svg-icons';
import { QuestionsDroppableList } from '../../components/questions-droppable-list/questions-droppable-list';
import { SearchQuestions } from '../../components/search-questions/search-questions';
import { ClassSelector } from '../../components/class-selector/class-selector';
import { ClassiService } from '../../services/classi-service';
import { BackTo } from '../../components/back-to/back-to';

@Component({
  selector: 'app-create-edit-test',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    SearchQuestions,
    QuestionsDroppableList,
    ClassSelector,
    BackTo,
  ],
  templateUrl: './create-edit-test.html',
  styleUrl: './create-edit-test.scss',
})
export class CreateEditTest implements OnInit {
  InfinityIcon = faInfinity;
  GenPasswordIcon = faKey;
  DraftIcon = faPenRuler;
  SaveIcon = faSave;

  testForm: FormGroup = new FormGroup({
    title: new FormControl(''),
    availableFrom: new FormControl(''),
    availableTo: new FormControl(''),
    classes: new FormControl(''),
    password: new FormControl(''),
    requiredScore: new FormControl(0),
    time: new FormControl(0),
  });

  constructor(
    private route: ActivatedRoute,
    public classiService: ClassiService,
  ) {}

  ngOnInit() {
    // Pre-seleziona la classe dal query param 'assign'
    this.route.queryParams.subscribe((params) => {
      const assignClassId = params['assign'];
      if (assignClassId) {
        this.testForm.get('classes')?.setValue([assignClassId]);
      }
    });
  }

  get assignedClasses() {
    return this.testForm.get('classes')?.value || [];
  }

  get time() {
    return this.testForm.get('time')?.value;
  }

  onClassesChange(classIds: string[]): void {
    this.testForm.get('classes')?.setValue(classIds);
  }

  onGeneratePassword() {
    this.testForm.patchValue({
      password: Math.random().toString(36).slice(-8),
    });
  }

  onToggleUnlimitedTime() {
    const timeControl = this.testForm.get('time');
    if (this.time !== null) {
      timeControl?.setValue(null);
      timeControl?.disable();
    } else {
      timeControl?.setValue(0);
      timeControl?.enable();
    }
  }

  onSaveTest(asDraft: boolean = false) {
    const testData = this.testForm.value;
    if (asDraft) {
      console.log('Saving test as draft:', testData);
    } else {
      console.log('Saving test:', testData);
    }
  }
}
