import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'app-syllex-search-input',
  standalone: true,
  imports: [FontAwesomeModule],
  templateUrl: './syllex-search-input.html',
  host: { style: 'display: block' },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SyllexSearchInput),
      multi: true,
    },
  ],
})
export class SyllexSearchInput implements ControlValueAccessor {
  @Input() placeholder: string = 'Cerca...';
  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();

  protected readonly SearchIcon = faMagnifyingGlass;

  private onChange = (_: string) => {};
  private onTouched = () => {};

  writeValue(value: string) {
    this.value = value ?? '';
  }
  registerOnChange(fn: (_: string) => void) {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void) {
    this.onTouched = fn;
  }

  handleInput(v: string) {
    this.value = v;
    this.onChange(v);
    this.valueChange.emit(v);
  }
}
