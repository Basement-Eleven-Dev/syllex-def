import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface SyllexStepItem {
  n: number;
  label: string;
}

@Component({
  selector: 'app-syllex-stepper',
  standalone: true,
  templateUrl: './syllex-stepper.html',
  styleUrl: './syllex-stepper.scss',
})
export class SyllexStepper {
  @Input({ required: true }) steps: ReadonlyArray<SyllexStepItem> = [];
  @Input({ required: true }) currentStep = 1;
  @Input() clickable = false;
  @Input() maxClickableStep: number | null = null;

  @Output() stepSelected = new EventEmitter<number>();

  isStepClickable(stepNumber: number): boolean {
    if (!this.clickable) return false;
    if (this.maxClickableStep === null) return true;
    return stepNumber <= this.maxClickableStep;
  }

  onStepClick(stepNumber: number): void {
    if (!this.isStepClickable(stepNumber)) return;
    this.stepSelected.emit(stepNumber);
  }
}
