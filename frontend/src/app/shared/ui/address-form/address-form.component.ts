import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AddressRequest } from '../../../core/models/customer.model';
import { MaskDirective } from '../../directives/mask.directive';

const PHONE_PATTERN = /^\(?\d{2}\)?[\s-]?9?\d{4}-?\d{4}$/;
const ZIP_PATTERN = /^\d{5}-?\d{3}$/;

interface ViaCepResponse {
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

@Component({
  selector: 'app-address-form',
  standalone: true,
  imports: [ReactiveFormsModule, MaskDirective],
  templateUrl: './address-form.component.html',
})
export class AddressFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);

  @Input() submitting = false;
  @Input() showCancel = false;
  @Output() save = new EventEmitter<AddressRequest>();
  @Output() cancel = new EventEmitter<void>();

  readonly cepLoading = signal(false);
  readonly cepError = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    label: ['', [Validators.required, Validators.maxLength(50)]],
    recipientName: ['', [Validators.required, Validators.maxLength(100)]],
    recipientPhone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    zipCode: ['', [Validators.required, Validators.pattern(ZIP_PATTERN)]],
    street: ['', [Validators.required]],
    number: ['', [Validators.required]],
    complement: [''],
    neighborhood: ['', [Validators.required]],
    city: ['', [Validators.required]],
    state: ['', [Validators.required, Validators.maxLength(2)]],
    isDefault: [false],
  });

  // A máscara não dispara valueChanges, então o preenchimento pelo CEP vem do input direto.
  onZipInput(event: Event): void {
    const digits = (event.target as HTMLInputElement).value.replace(/\D/g, '');
    this.cepError.set(null);
    if (digits.length === 8) {
      this.lookupCep(digits);
    }
  }

  private lookupCep(cep: string): void {
    this.cepLoading.set(true);
    this.http.get<ViaCepResponse>(`https://viacep.com.br/ws/${cep}/json/`).subscribe({
      next: (res) => {
        this.cepLoading.set(false);
        if (res.erro) {
          this.cepError.set('CEP não encontrado.');
          return;
        }
        this.form.patchValue({
          street: res.logradouro ?? '',
          neighborhood: res.bairro ?? '',
          city: res.localidade ?? '',
          state: res.uf ?? '',
        });
      },
      error: () => {
        this.cepLoading.set(false);
        this.cepError.set('Não foi possível buscar o CEP agora. Preencha manualmente.');
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    // backend exige CEP só com 8 dígitos (sem traço)
    this.save.emit({ ...value, zipCode: value.zipCode.replace(/\D/g, '') });
  }

  resetForm(): void {
    this.form.reset({ isDefault: false });
    this.cepError.set(null);
  }
}
