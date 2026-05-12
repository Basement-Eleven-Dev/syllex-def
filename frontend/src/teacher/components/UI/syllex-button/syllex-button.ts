import { Component, Input } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
interface SyllexButtonProps {
  label: string;
  variant: 'primary' | 'secondary' | 'outline' | 'text';
  size: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick?: () => void;
  link?: string;
}
@Component({
  selector: 'app-syllex-button',
  imports: [RouterLink, RouterModule],
  templateUrl: './syllex-button.html',
  styleUrl: './syllex-button.scss',
})
export class SyllexButton {
  @Input() props!: SyllexButtonProps;

  get buttonClasses() {
    return {
      'btn-primary': this.props.variant === 'primary',
      'btn-secondary': this.props.variant === 'secondary',
      'btn-outline': this.props.variant === 'outline',
      'btn-text': this.props.variant === 'text',
      'btn-sm': this.props.size === 'small',
      'btn-md': this.props.size === 'medium',
      'btn-lg': this.props.size === 'large',
    };
  }
}
