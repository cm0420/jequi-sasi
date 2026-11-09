import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CatalogService } from '../../../catalog/catalog.service';
import { AdminCatalogService } from '../../admin-catalog.service';
import { CategoryResponse } from '../../../../core/models/catalog.model';
import { ApiError } from '../../../../core/models/api-error.model';
import { BackLinkComponent } from '../../../../shared/ui/back-link/back-link.component';

@Component({
  selector: 'app-admin-piece-form',
  standalone: true,
  imports: [ReactiveFormsModule, BackLinkComponent],
  templateUrl: './admin-piece-form.component.html',
})
export class AdminPieceFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalogService = inject(CatalogService);
  private readonly adminCatalogService = inject(AdminCatalogService);
  private readonly fb = inject(FormBuilder);

  private pieceId: string | null = null;
  readonly isEditing = computed(() => this.pieceId !== null);

  readonly categories = signal<CategoryResponse[]>([]);
  readonly selectedCategoryIds = signal<Set<string>>(new Set());
  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    description: [''],
    price: [0, [Validators.required, Validators.min(0.01)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    imageUrls: [''],
  });

  ngOnInit(): void {
    this.pieceId = this.route.snapshot.paramMap.get('id');

    this.catalogService.listCategories().subscribe((categories) => {
      this.categories.set(categories);

      if (this.pieceId) {
        this.catalogService.getPiece(this.pieceId).subscribe((piece) => {
          this.form.setValue({
            name: piece.name,
            description: piece.description ?? '',
            price: piece.price,
            stock: piece.stock,
            imageUrls: piece.imageUrls.join('\n'),
          });
          this.selectedCategoryIds.set(new Set(piece.categories.map((c) => c.id)));
          this.loading.set(false);
        });
      } else {
        this.loading.set(false);
      }
    });
  }

  toggleCategory(categoryId: string): void {
    this.selectedCategoryIds.update((current) => {
      const next = new Set(current);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const request = {
      name: raw.name,
      description: raw.description || undefined,
      price: raw.price,
      stock: raw.stock,
      imageUrls: raw.imageUrls
        .split('\n')
        .map((url) => url.trim())
        .filter((url) => url.length > 0),
      categoryIds: Array.from(this.selectedCategoryIds()),
    };

    this.submitting.set(true);
    this.errorMessage.set(null);

    const request$ = this.pieceId
      ? this.adminCatalogService.updatePiece(this.pieceId, request)
      : this.adminCatalogService.createPiece(request);

    request$.subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigateByUrl('/admin/pecas');
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        const apiError = err.error as ApiError | undefined;
        this.errorMessage.set(apiError?.message ?? 'Não foi possível salvar a peça.');
      },
    });
  }
}
