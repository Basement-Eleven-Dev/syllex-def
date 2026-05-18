import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgClass, TitleCasePipe } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
interface SyllexButtonProps {
  label: string;
  variant: 'primary' | 'secondary' | 'outline' | 'underline' | 'text';
  size: 'small' | 'medium' | 'large';
  color?: 'primary' | 'white' | 'dark' | 'danger' | 'celestine' | 'black';
  shape?: 'circle';
  leftIcon?: IconDefinition;
  rightIcon?: IconDefinition;
  animation?: 'spin';
  disabled?: boolean;
  onClick?: () => void;
  link?: string;
}
@Component({
  selector: 'app-syllex-button',
  imports: [
    NgClass,
    RouterLink,
    RouterModule,
    FontAwesomeModule,
    TitleCasePipe,
  ],
  templateUrl: './syllex-button.html',
  styleUrl: './syllex-button.scss',
})
export class SyllexButton {
  @Input() props!: SyllexButtonProps;
  @Output() clicked = new EventEmitter<void>();

  handleClick() {
    this.clicked.emit();
    if (this.props.onClick) {
      this.props.onClick();
    }
  }

  get buttonClasses() {
    return {
      'btn-primary':
        this.props.variant === 'primary' &&
        this.props.color !== 'danger' &&
        this.props.color !== 'black',
      'btn-secondary': this.props.variant === 'secondary',
      'btn-black':
        this.props.variant === 'primary' && this.props.color === 'black',
      'btn-outline':
        this.props.variant === 'outline' &&
        this.props.color !== 'white' &&
        this.props.color !== 'dark' &&
        this.props.color !== 'danger' &&
        this.props.color !== 'black',
      'btn-outline-white':
        this.props.variant === 'outline' && this.props.color === 'white',
      'btn-outline-dark':
        this.props.variant === 'outline' && this.props.color === 'dark',
      'btn-outline-danger':
        this.props.variant === 'outline' && this.props.color === 'danger',
      'btn-solid-danger':
        this.props.variant === 'primary' && this.props.color === 'danger',
      'btn-celestine':
        this.props.variant === 'primary' && this.props.color === 'celestine',
      'btn-underline':
        this.props.variant === 'underline' && this.props.color !== 'white',
      'btn-underline-white':
        this.props.variant === 'underline' && this.props.color === 'white',
      'btn-text': this.props.variant === 'text',
      'btn-sm': this.props.size === 'small',
      'btn-md fw-medium': this.props.size === 'medium',
      'btn-lg': this.props.size === 'large',
      'px-4': this.props.size === 'small' || this.props.size === 'medium',
      'py-1': this.props.size === 'small',
      'py-2': this.props.size === 'medium',
      'px-5': this.props.size === 'large',
      'py-3': this.props.size === 'large',
      'icon-only': !this.props.label,
      'rounded-circle': this.props.shape === 'circle',
    };
  }
}
