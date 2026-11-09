import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminUsersService } from '../admin-users.service';
import { AuthService } from '../../auth/auth.service';
import { UserResponse, UserRole } from '../../../core/models/admin.model';
import { ApiError } from '../../../core/models/api-error.model';

const PAGE_SIZE = 15;

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: './admin-users.component.html',
})
export class AdminUsersComponent implements OnInit {
  private readonly usersService = inject(AdminUsersService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly currentUserId = this.authService.userId;

  readonly users = signal<UserResponse[]>([]);
  readonly totalElements = signal(0);
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly loading = signal(true);
  readonly roleFilter = signal<UserRole | null>(null);
  readonly busyId = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  readonly drawerOpen = signal(false);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);

  readonly hasPrev = computed(() => this.page() > 0);
  readonly hasNext = computed(() => this.page() + 1 < this.totalPages());

  readonly filters: { value: UserRole | null; label: string }[] = [
    { value: null, label: 'Todos' },
    { value: 'ADMIN', label: 'Administradores' },
    { value: 'CLIENTE', label: 'Clientes' },
  ];

  // Mesmas regras do UserRequestDto no backend (e-mail válido, senha de 8 a 64).
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(64)]],
    role: ['ADMIN' as UserRole, Validators.required],
  });

  ngOnInit(): void {
    this.load();
  }

  setFilter(role: UserRole | null): void {
    this.roleFilter.set(role);
    this.page.set(0);
    this.load();
  }

  goToPage(delta: number): void {
    this.page.update((p) => p + delta);
    this.load();
  }

  openDrawer(): void {
    this.form.reset({ email: '', password: '', role: 'ADMIN' });
    this.formError.set(null);
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  create(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.formError.set(null);
    this.usersService.create(this.form.getRawValue()).subscribe({
      next: (user) => {
        this.saving.set(false);
        this.drawerOpen.set(false);
        this.notice.set(`Usuário ${user.email} criado.`);
        this.page.set(0);
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.formError.set(this.apiMessage(err, 'Não foi possível criar o usuário.'));
      },
    });
  }

  changeRole(user: UserResponse, role: UserRole): void {
    if (role === user.role) return;
    const label = role === 'ADMIN' ? 'administrador' : 'cliente';
    if (!confirm(`Tornar ${user.email} ${label}?`)) {
      this.users.update((list) => [...list]); // devolve o select ao valor atual
      return;
    }
    this.busyId.set(user.id);
    this.errorMessage.set(null);
    this.usersService.updateRole(user.id, role).subscribe({
      next: (updated) => {
        this.busyId.set(null);
        this.users.update((list) => list.map((u) => (u.id === updated.id ? updated : u)));
        this.notice.set(`Papel de ${updated.email} atualizado.`);
      },
      error: (err: HttpErrorResponse) => {
        this.busyId.set(null);
        this.users.update((list) => [...list]);
        this.errorMessage.set(this.apiMessage(err, 'Não foi possível alterar o papel.'));
      },
    });
  }

  remove(user: UserResponse): void {
    if (!confirm(`Excluir ${user.email}? A pessoa perde o acesso na hora.`)) return;
    this.busyId.set(user.id);
    this.errorMessage.set(null);
    this.usersService.remove(user.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.notice.set(`Usuário ${user.email} excluído.`);
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.busyId.set(null);
        this.errorMessage.set(this.apiMessage(err, 'Não foi possível excluir o usuário.'));
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.usersService.list(this.page(), PAGE_SIZE, this.roleFilter()).subscribe({
      next: (result) => {
        this.users.set(result.content);
        this.totalElements.set(result.totalElements);
        this.totalPages.set(result.totalPages);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(this.apiMessage(err, 'Não foi possível carregar os usuários.'));
      },
    });
  }

  private apiMessage(err: HttpErrorResponse, fallback: string): string {
    return (err.error as ApiError | undefined)?.message ?? fallback;
  }
}
