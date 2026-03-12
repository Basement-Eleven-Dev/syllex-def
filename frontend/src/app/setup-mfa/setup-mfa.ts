import { Component, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Auth } from '../../services/auth';
import QRCode from 'qrcode';

@Component({
  selector: 'app-setup-mfa',
  imports: [ReactiveFormsModule],
  templateUrl: './setup-mfa.html',
  styleUrl: './setup-mfa.scss',
})
export class SetupMfa {
  step = signal<'intro' | 'qrcode' | 'verify' | 'success'>('intro');
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  qrCodeDataUrl = signal<string | null>(null);
  secretKey = signal<string | null>(null);

  verifyForm = new FormGroup({
    code: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
      Validators.maxLength(6),
      Validators.pattern(/^\d{6}$/),
    ]),
  });

  constructor(
    public activeModal: NgbActiveModal,
    private authService: Auth,
  ) {}

  async onStartSetup(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const uri = await this.authService.initiateMfaSetup();

      if (!uri) {
        this.errorMessage.set('Impossibile avviare la configurazione. Riprova.');
        this.isLoading.set(false);
        return;
      }

      // Extract secret from OTPAuth URI for manual entry fallback
      const secretMatch = uri.match(/secret=([A-Z2-7]+)/i);
      if (secretMatch) {
        this.secretKey.set(secretMatch[1]);
      }

      // Generate QR code as Data URL
      const dataUrl = await QRCode.toDataURL(uri, {
        width: 220,
        margin: 2,
        color: { dark: '#132149', light: '#ffffff' },
      });
      this.qrCodeDataUrl.set(dataUrl);
      this.step.set('qrcode');
    } catch (err) {
      this.errorMessage.set('Errore durante la generazione del QR code.');
    }

    this.isLoading.set(false);
  }

  onGoToVerify(): void {
    this.verifyForm.reset();
    this.errorMessage.set(null);
    this.step.set('verify');
  }

  async onVerify(): Promise<void> {
    if (this.verifyForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const code = this.verifyForm.value.code!;
    const result = await this.authService.finalizeMfa(code);

    this.isLoading.set(false);

    if (result.success) {
      this.step.set('success');
    } else {
      this.errorMessage.set(result.message);
    }
  }

  onClose(): void {
    this.activeModal.close(this.step() === 'success' ? 'enabled' : 'dismissed');
  }

  onCancel(): void {
    this.activeModal.dismiss('cancel');
  }
}
