import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Custom Validators
export function hasSpecialCharValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    return hasSpecial ? null : { hasSpecialChar: true };
  };
}

export function hasNumberValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    const hasNumber = /\d/.test(value);
    return hasNumber ? null : { hasNumber: true };
  };
}

export function passwordMatchValidator(
  passwordField: string,
  confirmField: string,
): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const password = formGroup.get(passwordField)?.value;
    const confirm = formGroup.get(confirmField)?.value;
    if (!password || !confirm) return null;
    return password === confirm ? null : { passwordsMatch: true };
  };
}

export function hasMinLenghthValidator(minLength: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    return value.length >= minLength
      ? null
      : {
          hasMinLength: {
            requiredLength: minLength,
            actualLength: value.length,
          },
        };
  };
}
