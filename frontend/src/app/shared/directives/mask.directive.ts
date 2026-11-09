import { Directive, HostListener, Input, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

type MaskKind = 'cpf' | 'phone' | 'cep';

/**
 * Máscara de digitação para CPF, telefone e CEP. Mantém o FormControl em sincronia
 * com o valor formatado, no formato que o backend aceita (CPF 000.000.000-00,
 * telefone (11) 91234-5678, CEP 00000-000).
 *
 * shortcut: formata sempre a partir do fim (append), não preserva a posição do cursor
 * ao editar no meio do texto. Trocar por ngx-mask se precisar de edição no meio.
 */
@Directive({ selector: '[appMask]', standalone: true })
export class MaskDirective {
  @Input('appMask') kind: MaskKind = 'cpf';
  private readonly ngControl = inject(NgControl);

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = this.format(input.value);
    input.value = formatted;
    this.ngControl.control?.setValue(formatted, { emitEvent: false });
  }

  private format(value: string): string {
    const digits = value.replace(/\D/g, '');
    if (this.kind === 'cpf') return this.cpf(digits);
    if (this.kind === 'cep') return this.cep(digits);
    return this.phone(digits);
  }

  private cpf(d: string): string {
    d = d.slice(0, 11);
    let out = d.slice(0, 3);
    if (d.length > 3) out += '.' + d.slice(3, 6);
    if (d.length > 6) out += '.' + d.slice(6, 9);
    if (d.length > 9) out += '-' + d.slice(9, 11);
    return out;
  }

  private phone(d: string): string {
    d = d.slice(0, 11);
    if (d.length === 0) return '';
    let out = '(' + d.slice(0, 2);
    if (d.length >= 2) out += ') ';
    const rest = d.slice(2);
    const firstLen = rest.length > 8 ? 5 : 4; // celular (9 díg) vs fixo
    out += rest.slice(0, firstLen);
    if (rest.length > firstLen) out += '-' + rest.slice(firstLen);
    return out;
  }

  private cep(d: string): string {
    d = d.slice(0, 8);
    return d.length > 5 ? d.slice(0, 5) + '-' + d.slice(5) : d;
  }
}
