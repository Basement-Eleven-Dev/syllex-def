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

interface ClassOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-create-edit-test',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    SearchQuestions,
    QuestionsDroppableList,
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

  availableClasses: ClassOption[] = [
    { id: '1', name: '1A' },
    { id: '2', name: '2B' },
    { id: '3', name: '3C' },
    { id: '4', name: '4D' },
    { id: '5', name: '5E' },
  ];

  constructor(private route: ActivatedRoute) {}

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

  onToggleAssignedClass(classId: string) {
    const currentClasses = this.assignedClasses;
    const updatedClasses = currentClasses.includes(classId)
      ? currentClasses.filter((id: string) => id !== classId)
      : [...currentClasses, classId];
    this.testForm.get('classes')?.setValue(updatedClasses);

    console.log('Assigned Classes:', updatedClasses);
  }

  isClassSelected(classId: string): boolean {
    return this.assignedClasses.includes(classId);
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
