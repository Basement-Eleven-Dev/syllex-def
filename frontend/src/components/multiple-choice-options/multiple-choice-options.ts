import { Component, Output, EventEmitter, Input } from '@angular/core';
import { AnswerOption } from '../../pages/create-edit-question/create-edit-question';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCheck, faPlus, faTrashAlt } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'app-multiple-choice-options',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './multiple-choice-options.html',
  styleUrl: './multiple-choice-options.scss',
})
export class MultipleChoiceOptions {
  RemoveIcon = faTrashAlt;
  AddIcon = faPlus;
  CheckIcon = faCheck;

  @Input() options: AnswerOption[] = [];
  @Output() optionsChange = new EventEmitter<AnswerOption[]>();

  onOptionsChange(): void {
    this.optionsChange.emit(this.options);
  }

  onAddOption(): void {
    this.options.push({
      label: `Opzione ${this.options.length + 1}`,
      isCorrect: false,
    });
  }

  onRemoveOption(index: number): void {
    this.options.splice(index, 1);
  }

  onSetCorrectOption(index: number): void {
    this.options = this.options.map((option, i) => ({
      ...option,
      isCorrect: i === index,
    }));
    this.onOptionsChange();
  }

  getOptionLabel(index: number): string {
    return String.fromCharCode(64 + index); // Convert 1 to 'A', 2 to 'B', etc.
  }
}
