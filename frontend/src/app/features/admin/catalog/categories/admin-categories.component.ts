import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CatalogService } from '../../../catalog/catalog.service';
import { AdminCatalogService } from '../../admin-catalog.service';
import { CategoryResponse } from '../../../../core/models/catalog.model';
import { ApiError } from '../../../../core/models/api-error.model';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-categories.component.html',
})
export class AdminCategoriesComponent implements OnInit {
  private readonly catalogService = inject(CatalogService);
  private readonly adminCatalogService = inject(AdminCatalogService);
  private readonly fb = inject(FormBuilder);

  readonly categories = signal<CategoryResponse[]>([]);
  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly deletingId = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(255)]],
  });

  ngOnInit(): void {
    this.loadCategories();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.errorMessage.set(null);
    this.adminCatalogService.createCategory(this.form.getRawValue()).subscribe({
      next: (category) => {
        this.submitting.set(false);
        this.categories.update((current) => [...current, category]);
        this.form.reset({ name: '', description: '' });
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        const apiError = err.error as ApiError | undefined;
        this.errorMessage.set(apiError?.message ?? 'Não foi possível criar a categoria.');
      },
    });
  }

  deleteCategory(category: CategoryResponse): void {
    if (!confirm('Excluir esta categoria? Essa ação não pode ser desfeita.')) return;
    this.deletingId.set(category.id);
    this.adminCatalogService.deleteCategory(category.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.categories.update((current) => current.filter((c) => c.id !== category.id));
      },
      error: (err: HttpErrorResponse) => {
        this.deletingId.set(null);
        const apiError = err.error as ApiError | undefined;
        this.errorMessage.set(apiError?.message ?? 'Não foi possível excluir a categoria.');
      },
    });
  }

  private loadCategories(): void {
    this.catalogService.listCategories().subscribe((categories) => {
      this.categories.set(categories);
      this.loading.set(false);
    });
  }
}
