import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Valida CPF de verdade (dígitos verificadores), igual ao @CPF do backend.
 * Deixa o erro aparecer no formulário antes de enviar, em vez de só no 400 da API.
 * Campo vazio não é tratado aqui (fica a cargo do Validators.required).
 */
export function cpfValidator(control: AbstractControl): ValidationErrors | null {
  const cpf = String(control.value ?? '').replace(/\D/g, '');
  if (!cpf) return null;
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return { cpf: true };

  const checkDigit = (len: number): number => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  if (checkDigit(9) !== Number(cpf[9]) || checkDigit(10) !== Number(cpf[10])) {
    return { cpf: true };
  }
  return null;
}
