import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ClienteService } from '../cliente.service';
import { AddressRequest, AddressResponse } from '../../../core/models/customer.model';
import { ApiError } from '../../../core/models/api-error.model';
import { SiteHeaderComponent } from '../../../shared/ui/site-header/site-header.component';
import { BackLinkComponent } from '../../../shared/ui/back-link/back-link.component';
import { AddressFormComponent } from '../../../shared/ui/address-form/address-form.component';

@Component({
  selector: 'app-addresses',
  standalone: true,
  imports: [SiteHeaderComponent, BackLinkComponent, AddressFormComponent],
  templateUrl: './addresses.component.html',
})
export class AddressesComponent implements OnInit {
  private readonly clienteService = inject(ClienteService);

  readonly addresses = signal<AddressResponse[]>([]);
  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly deletingId = signal<string | null>(null);
  readonly showForm = signal(false);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.clienteService.listAddresses().subscribe((addresses) => {
      this.addresses.set(addresses);
      this.loading.set(false);
    });
  }

  toggleForm(): void {
    this.showForm.update((current) => !current);
  }

  submitNewAddress(request: AddressRequest): void {
    this.submitting.set(true);
    this.errorMessage.set(null);
    this.clienteService.createAddress(request).subscribe({
      next: (address) => {
        this.submitting.set(false);
        this.addresses.update((current) => [...current, address]);
        this.showForm.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        const apiError = err.error as ApiError | undefined;
        this.errorMessage.set(apiError?.message ?? 'Não foi possível salvar o endereço.');
      },
    });
  }

  deleteAddress(address: AddressResponse): void {
    if (!confirm('Remover este endereço?')) return;
    this.deletingId.set(address.id);
    this.clienteService.deleteAddress(address.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.addresses.update((current) => current.filter((a) => a.id !== address.id));
      },
      error: (err: HttpErrorResponse) => {
        this.deletingId.set(null);
        const apiError = err.error as ApiError | undefined;
        this.errorMessage.set(apiError?.message ?? 'Não foi possível excluir o endereço.');
      },
    });
  }
}
