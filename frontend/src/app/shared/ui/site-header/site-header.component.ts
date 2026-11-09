import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../features/auth/auth.service';
import { CartService } from '../../../features/cart/cart.service';
import { ClienteService } from '../../../features/cliente/cliente.service';

@Component({
  selector: 'app-site-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './site-header.component.html',
})
export class SiteHeaderComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly cartService = inject(CartService);
  private readonly clienteService = inject(ClienteService);
  private readonly router = inject(Router);

  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly itemCount = this.cartService.itemCount;
  readonly firstName = signal<string | null>(null);
  readonly searchTerm = signal('');

  submitSearch(event: Event): void {
    event.preventDefault();
    const q = this.searchTerm().trim();
    this.router.navigate(['/catalogo'], q ? { queryParams: { q } } : {});
  }

  ngOnInit(): void {
    if (this.isAuthenticated()) {
      this.cartService.loadCart().subscribe();
      // Saudação pelo nome: só o cliente tem /me; admin na loja fica com "Minha conta".
      if (this.authService.role() === 'CLIENTE') {
        this.clienteService.getMe().subscribe((me) => this.firstName.set(me.firstName));
      }
    }
  }
}
