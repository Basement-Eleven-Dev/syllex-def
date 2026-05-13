import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
interface SyllexButtonProps {
  label: string;
  variant: 'primary' | 'secondary' | 'outline' | 'underline' | 'text';
  size: 'small' | 'medium' | 'large';
  color?: 'primary' | 'white';
  leftIcon?: IconDefinition;
  rightIcon?: IconDefinition;
  disabled?: boolean;
  onClick?: () => void;
  link?: string;
}
@Component({
  selector: 'app-syllex-button',
  imports: [NgClass, RouterLink, RouterModule, FontAwesomeModule],
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
      'btn-primary': this.props.variant === 'primary',
      'btn-secondary': this.props.variant === 'secondary',
      'btn-outline':
        this.props.variant === 'outline' && this.props.color !== 'white',
      'btn-outline-white':
        this.props.variant === 'outline' && this.props.color === 'white',
      'btn-underline':
        this.props.variant === 'underline' && this.props.color !== 'white',
      'btn-underline-white':
        this.props.variant === 'underline' && this.props.color === 'white',
      'btn-text': this.props.variant === 'text',
      'btn-sm': this.props.size === 'small',
      'btn-lg': this.props.size === 'large',
      'px-3': this.props.size === 'small',
      'py-1': this.props.size === 'small',
      'px-4': this.props.size === 'medium',
      'py-2': this.props.size === 'medium',
      'px-5': this.props.size === 'large',
      'py-3': this.props.size === 'large',
    };
  }
}
