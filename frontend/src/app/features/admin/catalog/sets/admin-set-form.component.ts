import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CatalogService } from '../../../catalog/catalog.service';
import { AdminCatalogService } from '../../admin-catalog.service';
import { PieceResponse } from '../../../../core/models/catalog.model';
import { ApiError } from '../../../../core/models/api-error.model';
import { BackLinkComponent } from '../../../../shared/ui/back-link/back-link.component';

const PIECES_POOL_SIZE = 100;

@Component({
  selector: 'app-admin-set-form',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, BackLinkComponent],
  templateUrl: './admin-set-form.component.html',
})
export class AdminSetFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalogService = inject(CatalogService);
  private readonly adminCatalogService = inject(AdminCatalogService);
  private readonly fb = inject(FormBuilder);

  private setId: string | null = null;
  readonly isEditing = computed(() => this.setId !== null);

  readonly availablePieces = signal<PieceResponse[]>([]);
  readonly selectedPieceIds = signal<Set<string>>(new Set());
  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    description: [''],
    price: [0, [Validators.required, Validators.min(0.01)]],
  });

  ngOnInit(): void {
    this.setId = this.route.snapshot.paramMap.get('id');

    this.catalogService.listPieces(0, PIECES_POOL_SIZE).subscribe((result) => {
      this.availablePieces.set(result.content);

      if (this.setId) {
        this.catalogService.getSet(this.setId).subscribe((set) => {
          this.form.setValue({
            name: set.name,
            description: set.description ?? '',
            price: set.price,
          });
          this.selectedPieceIds.set(new Set(set.pieces.map((p) => p.id)));
          this.loading.set(false);
        });
      } else {
        this.loading.set(false);
      }
    });
  }

  togglePiece(pieceId: string): void {
    this.selectedPieceIds.update((current) => {
      const next = new Set(current);
      if (next.has(pieceId)) {
        next.delete(pieceId);
      } else {
        next.add(pieceId);
      }
      return next;
    });
  }

  submit(): void {
    if (this.form.invalid || this.selectedPieceIds().size === 0) {
      this.form.markAllAsTouched();
      if (this.selectedPieceIds().size === 0) {
        this.errorMessage.set('Selecione ao menos uma peça pro conjunto.');
      }
      return;
    }

    const raw = this.form.getRawValue();
    const request = {
      name: raw.name,
      description: raw.description || undefined,
      price: raw.price,
      pieceIds: Array.from(this.selectedPieceIds()),
    };

    this.submitting.set(true);
    this.errorMessage.set(null);

    const request$ = this.setId
      ? this.adminCatalogService.updateSet(this.setId, request)
      : this.adminCatalogService.createSet(request);

    request$.subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigateByUrl('/admin/conjuntos');
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        const apiError = err.error as ApiError | undefined;
        this.errorMessage.set(apiError?.message ?? 'Não foi possível salvar o conjunto.');
      },
    });
  }
}
