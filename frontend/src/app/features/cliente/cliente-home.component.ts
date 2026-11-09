import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { ClienteService } from './cliente.service';
import { CustomerResponse } from '../../core/models/customer.model';
import { ApiError } from '../../core/models/api-error.model';
import { SiteHeaderComponent } from '../../shared/ui/site-header/site-header.component';
import { MaskDirective } from '../../shared/directives/mask.directive';

const PHONE_PATTERN = /^\(?\d{2}\)?[\s-]?9?\d{4}-?\d{4}$/;

@Component({
  selector: 'app-cliente-home',
  standalone: true,
  imports: [SiteHeaderComponent, RouterLink, ReactiveFormsModule, MaskDirective],
  templateUrl: './cliente-home.component.html',
})
export class ClienteHomeComponent implements OnInit {
  private readonly clienteService = inject(ClienteService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly customer = signal<CustomerResponse | null>(null);
  readonly loading = signal(true);
  readonly editing = signal(false);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly editForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
  });

  ngOnInit(): void {
    this.clienteService.getMe().subscribe((customer) => {
      this.customer.set(customer);
      this.loading.set(false);
    });
  }

  startEditing(): void {
    const c = this.customer();
    if (!c) return;
    this.editForm.setValue({
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
    });
    this.errorMessage.set(null);
    this.editing.set(true);
  }

  cancelEditing(): void {
    this.editing.set(false);
  }

  saveProfile(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.errorMessage.set(null);
    this.clienteService.updateProfile(this.editForm.getRawValue()).subscribe({
      next: (customer) => {
        this.submitting.set(false);
        this.customer.set(customer);
        this.editing.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        const apiError = err.error as ApiError | undefined;
        this.errorMessage.set(apiError?.message ?? 'Não foi possível salvar as alterações.');
      },
    });
  }

  logout(): void {
    this.authService.logout().subscribe(() => this.router.navigateByUrl('/'));
  }
}
