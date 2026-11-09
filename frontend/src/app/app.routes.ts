import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role.guard';
import { secureChannelGuard } from './core/guards/secure-channel.guard';

export const routes: Routes = [
  {
    path: 'politica-de-seguranca',
    loadComponent: () =>
      import('./features/institucional/politica-seguranca.component').then((m) => m.PoliticaSegurancaComponent),
  },
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/catalog/catalog-list/catalog-list.component').then((m) => m.CatalogListComponent),
  },
  {
    path: 'catalogo',
    loadComponent: () =>
      import('./features/catalog/catalog-browse/catalog-browse.component').then((m) => m.CatalogBrowseComponent),
  },
  {
    path: 'pecas/:id',
    loadComponent: () =>
      import('./features/catalog/piece-detail/piece-detail.component').then((m) => m.PieceDetailComponent),
  },
  {
    path: 'conjuntos/:id',
    loadComponent: () =>
      import('./features/catalog/set-detail/set-detail.component').then((m) => m.SetDetailComponent),
  },
  {
    path: 'login',
    canActivate: [secureChannelGuard],
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'signup',
    canActivate: [secureChannelGuard],
    loadComponent: () => import('./features/auth/signup/signup.component').then((m) => m.SignupComponent),
  },
  {
    path: 'carrinho',
    canActivate: [secureChannelGuard],
    canMatch: [roleGuard('CLIENTE')],
    loadComponent: () => import('./features/cart/cart-page/cart-page.component').then((m) => m.CartPageComponent),
  },
  {
    path: 'checkout',
    canActivate: [secureChannelGuard],
    canMatch: [roleGuard('CLIENTE')],
    loadComponent: () =>
      import('./features/checkout/checkout-page/checkout-page.component').then((m) => m.CheckoutPageComponent),
  },
  {
    path: 'checkout/:orderId',
    canActivate: [secureChannelGuard],
    canMatch: [roleGuard('CLIENTE')],
    loadComponent: () =>
      import('./features/checkout/checkout-page/checkout-page.component').then((m) => m.CheckoutPageComponent),
  },
  {
    path: 'pedidos',
    canActivate: [secureChannelGuard],
    canMatch: [roleGuard('CLIENTE')],
    loadComponent: () => import('./features/orders/order-list/order-list.component').then((m) => m.OrderListComponent),
  },
  {
    path: 'pedidos/:id',
    canActivate: [secureChannelGuard],
    canMatch: [roleGuard('CLIENTE')],
    loadComponent: () =>
      import('./features/orders/order-detail/order-detail.component').then((m) => m.OrderDetailComponent),
  },
  {
    path: 'cliente',
    canActivate: [secureChannelGuard],
    canMatch: [roleGuard('CLIENTE')],
    loadComponent: () =>
      import('./features/cliente/cliente-home.component').then((m) => m.ClienteHomeComponent),
  },
  {
    path: 'cliente/enderecos',
    canActivate: [secureChannelGuard],
    canMatch: [roleGuard('CLIENTE')],
    loadComponent: () => import('./features/cliente/addresses/addresses.component').then((m) => m.AddressesComponent),
  },
  {
    path: 'cliente/cartoes',
    canActivate: [secureChannelGuard],
    canMatch: [roleGuard('CLIENTE')],
    loadComponent: () =>
      import('./features/cliente/payment-methods/payment-methods.component').then((m) => m.PaymentMethodsComponent),
  },
  {
    path: 'admin',
    canActivate: [secureChannelGuard],
    canMatch: [roleGuard('ADMIN')],
    loadComponent: () => import('./features/admin/shell/admin-shell.component').then((m) => m.AdminShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/admin/dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
      },
      { path: 'dashboard', redirectTo: '', pathMatch: 'full' },
      {
        path: 'pedidos',
        loadComponent: () =>
        import('./features/admin/orders/order-list/admin-order-list.component').then(
          (m) => m.AdminOrderListComponent
        ),
      },
      {
        path: 'pedidos/:id',
        loadComponent: () =>
        import('./features/admin/orders/order-detail/admin-order-detail.component').then(
          (m) => m.AdminOrderDetailComponent
        ),
      },
      {
        path: 'categorias',
        loadComponent: () =>
        import('./features/admin/catalog/categories/admin-categories.component').then(
          (m) => m.AdminCategoriesComponent
        ),
      },
      {
        path: 'pecas',
        loadComponent: () =>
        import('./features/admin/catalog/pieces/admin-pieces-list.component').then(
          (m) => m.AdminPiecesListComponent
        ),
      },
      {
        path: 'pecas/novo',
        loadComponent: () =>
        import('./features/admin/catalog/pieces/admin-piece-form.component').then((m) => m.AdminPieceFormComponent),
      },
      {
        path: 'pecas/:id/editar',
        loadComponent: () =>
        import('./features/admin/catalog/pieces/admin-piece-form.component').then((m) => m.AdminPieceFormComponent),
      },
      {
        path: 'conjuntos',
        loadComponent: () =>
        import('./features/admin/catalog/sets/admin-sets-list.component').then((m) => m.AdminSetsListComponent),
      },
      {
        path: 'conjuntos/novo',
        loadComponent: () =>
        import('./features/admin/catalog/sets/admin-set-form.component').then((m) => m.AdminSetFormComponent),
      },
      {
        path: 'conjuntos/:id/editar',
        loadComponent: () =>
        import('./features/admin/catalog/sets/admin-set-form.component').then((m) => m.AdminSetFormComponent),
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./features/admin/users/admin-users.component').then((m) => m.AdminUsersComponent),
      },
    ],
  },
];
