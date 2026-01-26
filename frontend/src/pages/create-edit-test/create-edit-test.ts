import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faInfinity, faKey } from '@fortawesome/pro-solid-svg-icons';

interface ClassOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-create-edit-test',
  imports: [FormsModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './create-edit-test.html',
  styleUrl: './create-edit-test.scss',
})
export class CreateEditTest {
  InfinityIcon = faInfinity;
  GenPasswordIcon = faKey;

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
    { id: '1A', name: '1A' },
    { id: '2B', name: '2B' },
    { id: '3C', name: '3C' },
    { id: '4D', name: '4D' },
    { id: '5E', name: '5E' },
  ];

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
}
