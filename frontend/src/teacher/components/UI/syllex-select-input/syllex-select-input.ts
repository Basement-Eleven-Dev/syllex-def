import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';

export interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-syllex-select-input',
  standalone: true,
  imports: [FormsModule],
  template: `
    <select
      class="form-select bg-light border-0 shadow-none py-3"
      [ngModel]="value"
      (ngModelChange)="handleChange($event)"
      (blur)="onTouched()"
    >
      @if (placeholder) {
        <option value="">{{ placeholder }}</option>
      }
      @for (opt of options; track opt.value) {
        <option [value]="opt.value">{{ opt.label }}</option>
      }
    </select>
  `,
  host: { style: 'display: block' },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SyllexSelectInput),
      multi: true,
    },
  ],
})
export class SyllexSelectInput implements ControlValueAccessor {
  @Input() value: string = '';
  @Input() options: SelectOption[] = [];
  @Input() placeholder: string = '';
  @Output() valueChange = new EventEmitter<string>();

  onTouched = () => {};
  private onChange = (_: string) => {};

  writeValue(value: string) {
    this.value = value ?? '';
  }
  registerOnChange(fn: (_: string) => void) {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void) {
    this.onTouched = fn;
  }

  handleChange(v: string) {
    this.value = v;
    this.onChange(v);
    this.valueChange.emit(v);
  }
}
