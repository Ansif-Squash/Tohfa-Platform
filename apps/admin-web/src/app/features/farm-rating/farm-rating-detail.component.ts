import { CommonModule, Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  type OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RbacService } from '../../core/rbac.service';
import {
  FarmRatingService,
  type FarmRating,
  type RatingTier,
} from './farm-rating.service';
import { FARM_RATING_STRINGS } from './farm-rating.strings';

/** A module row bound to the form. `score` defaults to 0 in the editor even when the
 *  API returned `null` (never scored) — the API's own `null` stays the source of truth
 *  for "has this ever been rated", read from `rating()` / the summary card, not from
 *  this editable copy. */
interface EditableModule {
  categoryCode: string;
  name: string;
  maxScore: number;
  score: number;
}

@Component({
  selector: 'tohfa-farm-rating-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
        padding-bottom: 88px; /* space for sticky footer */
      }
      .page-container {
        display: flex;
        flex-direction: column;
        gap: var(--tohfa-space-lg);
      }
      .header-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        flex-wrap: wrap;
        gap: var(--tohfa-space-md);
      }
      .title-group h1 {
        font-size: var(--tohfa-font-size-h1);
        font-weight: var(--tohfa-font-weight-bold);
        color: var(--tohfa-on-surface);
        margin: 0 0 var(--tohfa-space-xs) 0;
      }
      .title-group p {
        color: var(--tohfa-on-surface-variant);
        margin: 0;
        font-size: var(--tohfa-font-size-small);
      }
      .card {
        background: var(--tohfa-neutral-white);
        border: 1px solid var(--tohfa-neutral-300);
        border-radius: var(--tohfa-radius-card);
        padding: var(--tohfa-space-xl);
        display: flex;
        flex-direction: column;
        gap: var(--tohfa-space-md);
      }
      .card h2 {
        margin: 0;
        font-size: var(--tohfa-font-size-h3);
        font-weight: var(--tohfa-font-weight-bold);
        color: var(--tohfa-on-surface);
      }
      .info-banner {
        padding: var(--tohfa-space-sm) var(--tohfa-space-md);
        background: var(--tohfa-info-light);
        border: 1px solid var(--tohfa-info);
        color: var(--tohfa-info);
        border-radius: var(--tohfa-radius-input);
        font-size: var(--tohfa-font-size-small);
      }
      .error-banner {
        padding: var(--tohfa-space-sm) var(--tohfa-space-md);
        background: var(--tohfa-error-light);
        border: 1px solid var(--tohfa-error);
        color: var(--tohfa-error);
        border-radius: var(--tohfa-radius-input);
        font-size: var(--tohfa-font-size-small);
      }
      .hint {
        margin: 0;
        color: var(--tohfa-on-surface-variant);
        font-size: var(--tohfa-font-size-caption);
      }

      /* ---------- Summary ---------- */
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: var(--tohfa-space-md);
      }
      .summary-item {
        background: var(--tohfa-surface);
        border-radius: var(--tohfa-radius-md);
        padding: var(--tohfa-space-md);
        display: flex;
        flex-direction: column;
        gap: var(--tohfa-space-xs);
      }
      .summary-item span {
        font-size: var(--tohfa-font-size-caption);
        font-weight: var(--tohfa-font-weight-semibold);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--tohfa-on-surface-variant);
      }
      .summary-item strong {
        font-size: var(--tohfa-font-size-h2);
        font-weight: var(--tohfa-font-weight-bold);
        color: var(--tohfa-on-surface);
      }
      .tier-badge {
        display: inline-block;
        align-self: flex-start;
        padding: var(--tohfa-space-xs) var(--tohfa-space-sm);
        border-radius: var(--tohfa-radius-pill);
        font-size: var(--tohfa-font-size-small);
        font-weight: var(--tohfa-font-weight-bold);
      }
      .tier-POOR {
        background: var(--tohfa-error-light);
        color: var(--tohfa-error);
      }
      .tier-MODERATE {
        background: var(--tohfa-warning-light);
        color: var(--tohfa-warning);
      }
      .tier-GOOD {
        background: var(--tohfa-info-light);
        color: var(--tohfa-info);
      }
      .tier-EXCELLENT {
        background: var(--tohfa-success-light);
        color: var(--tohfa-success);
      }
      .tier-NONE {
        background: var(--tohfa-neutral-100);
        color: var(--tohfa-on-surface-variant);
      }

      /* ---------- Module rows ---------- */
      .module-row {
        display: flex;
        align-items: center;
        gap: var(--tohfa-space-md);
        padding: var(--tohfa-space-md) 0;
        border-bottom: 1px solid var(--tohfa-neutral-100);
      }
      .module-row:last-of-type {
        border-bottom: none;
      }
      .module-name {
        flex: 1 1 220px;
        font-weight: var(--tohfa-font-weight-semibold);
        color: var(--tohfa-on-surface);
        font-size: var(--tohfa-font-size-body);
      }
      .module-input {
        flex: 1 1 260px;
        display: flex;
        align-items: center;
        gap: var(--tohfa-space-sm);
      }
      .module-input input[type='range'] {
        flex: 1;
        accent-color: var(--tohfa-primary);
      }
      .module-input input[type='number'] {
        width: 64px;
        box-sizing: border-box;
        padding: var(--tohfa-space-xs) var(--tohfa-space-sm);
        border: 1px solid var(--tohfa-neutral-400);
        border-radius: var(--tohfa-radius-input);
        font-family: var(--tohfa-font-sans);
        font-size: var(--tohfa-font-size-small);
        text-align: center;
      }
      .module-input input:focus {
        outline: none;
        border-color: var(--tohfa-primary);
        box-shadow: 0 0 0 3px var(--tohfa-primary-pale);
      }
      .module-input .max-label {
        color: var(--tohfa-on-surface-variant);
        font-size: var(--tohfa-font-size-caption);
        min-width: 28px;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: var(--tohfa-space-xs);
      }
      .form-group label {
        font-size: var(--tohfa-font-size-caption);
        font-weight: var(--tohfa-font-weight-semibold);
        color: var(--tohfa-on-surface);
      }
      .form-group textarea {
        width: 100%;
        box-sizing: border-box;
        padding: var(--tohfa-space-sm) var(--tohfa-space-md);
        border: 1px solid var(--tohfa-neutral-400);
        border-radius: var(--tohfa-radius-input);
        font-family: var(--tohfa-font-sans);
        font-size: var(--tohfa-font-size-small);
        resize: vertical;
      }

      /* ---------- Sticky footer ---------- */
      .sticky-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: var(--tohfa-neutral-white);
        border-top: 1px solid var(--tohfa-neutral-300);
        padding: var(--tohfa-space-md) var(--tohfa-space-xl);
        display: flex;
        justify-content: flex-end;
        gap: var(--tohfa-space-md);
        z-index: 100;
      }
      .btn-primary {
        min-height: var(--tohfa-min-touch-target);
        background: var(--tohfa-primary);
        color: var(--tohfa-neutral-white);
        padding: 0 var(--tohfa-space-lg);
        border: none;
        border-radius: var(--tohfa-radius-button);
        font-weight: var(--tohfa-font-weight-semibold);
        font-size: var(--tohfa-font-size-button);
        cursor: pointer;
      }
      .btn-primary:hover:not(:disabled) {
        background: var(--tohfa-primary-pressed);
      }
      .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .btn-secondary {
        min-height: var(--tohfa-min-touch-target);
        background: var(--tohfa-neutral-100);
        color: var(--tohfa-on-surface);
        padding: 0 var(--tohfa-space-lg);
        border: 1px solid var(--tohfa-neutral-400);
        border-radius: var(--tohfa-radius-button);
        cursor: pointer;
        font-weight: var(--tohfa-font-weight-semibold);
        font-size: var(--tohfa-font-size-button);
      }
    `,
  ],
  template: `
    <div class="page-container">
      <div class="header-toolbar">
        <div class="title-group">
          <h1>{{ s.title }}</h1>
          <p>{{ s.subtitle }}</p>
        </div>
      </div>

      <div class="info-banner" *ngIf="loading()">{{ s.loading }}</div>
      <div class="error-banner" *ngIf="!loading() && loadError()">{{ loadError() }}</div>

      <ng-container *ngIf="!loading() && !loadError() && rating() as r">
        <div class="card">
          <h2>{{ s.overallLabel }}</h2>
          <div class="summary-grid">
            <div class="summary-item">
              <span>{{ s.overallLabel }} ({{ s.lastRatedLabel }})</span>
              <strong>{{ r.overallRating ?? '—' }}</strong>
            </div>
            <div class="summary-item">
              <span>{{ s.tierLabel }} ({{ s.lastRatedLabel }})</span>
              <span class="tier-badge" [ngClass]="'tier-' + (r.ratingTier ?? 'NONE')">
                {{ r.ratingTier ? s.tiers[r.ratingTier] : s.tierUnset }}
              </span>
            </div>
            <div class="summary-item">
              <span>{{ s.lastRatedLabel }}</span>
              <strong>{{ r.ratedAt ? (r.ratedAt | date: 'medium') : s.lastRatedNever }}</strong>
            </div>
          </div>

          <!-- Cosmetic preview only, mirrors the confirmed BR-04a boundaries for UX while
               editing. The authoritative overallRating/ratingTier always comes back from
               the PUT response above (root CLAUDE §2.1: server computes, client displays). -->
          <div class="summary-grid" *ngIf="canEdit()">
            <div class="summary-item">
              <span>Preview (unsaved)</span>
              <strong>{{ liveOverall() }}</strong>
            </div>
            <div class="summary-item">
              <span>Preview Tier (unsaved)</span>
              <span class="tier-badge" [ngClass]="'tier-' + livePreviewTier()">
                {{ s.tiers[livePreviewTier()] }}
              </span>
            </div>
          </div>

          <p class="hint" *ngIf="!r.ratedAt">{{ s.neverRated }}</p>
        </div>

        <div class="card">
          <h2>{{ s.title }}</h2>
          <div class="module-row" *ngFor="let m of editableModules(); let i = index">
            <div class="module-name">{{ m.name }}</div>
            <div class="module-input">
              <input
                type="range"
                min="0"
                [max]="m.maxScore"
                step="1"
                [ngModel]="m.score"
                (ngModelChange)="updateScore(i, $event)"
                [disabled]="!canEdit()"
                [attr.aria-label]="m.name"
              />
              <input
                type="number"
                min="0"
                [max]="m.maxScore"
                step="1"
                [ngModel]="m.score"
                (ngModelChange)="updateScore(i, $event)"
                [disabled]="!canEdit()"
                [attr.aria-label]="m.name + ' score'"
              />
              <span class="max-label">/ {{ m.maxScore }}</span>
            </div>
          </div>
          <p class="hint">{{ s.scoreHint }}</p>

          <div class="form-group">
            <label>{{ s.notesLabel }}</label>
            <textarea
              rows="3"
              [(ngModel)]="notes"
              maxlength="500"
              [disabled]="!canEdit()"
              [placeholder]="s.notesPlaceholder"
            ></textarea>
          </div>

          <div class="error-banner" *ngIf="saveError()">{{ saveError() }}</div>
          <p class="hint" *ngIf="!canEdit()">{{ s.readOnlyNotice }}</p>
        </div>
      </ng-container>

      <div class="sticky-footer" *ngIf="!loading() && !loadError()">
        <button class="btn-secondary" (click)="onCancel()">{{ s.cancel }}</button>
        <button
          class="btn-primary"
          *ngIf="canEdit()"
          [disabled]="saving()"
          (click)="onSave()"
        >
          {{ saving() ? s.saving : s.save }}
        </button>
      </div>
    </div>
  `,
})
export class FarmRatingDetailComponent implements OnInit {
  readonly s = FARM_RATING_STRINGS;

  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly service = inject(FarmRatingService);
  private readonly rbac = inject(RbacService);

  private farmerId = '';

  readonly rating = signal<FarmRating | null>(null);
  readonly editableModules = signal<EditableModule[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);

  notes = '';

  // UI-only convenience — the API's requirePermission is the real control (see
  // core/rbac.service.ts and apps/admin-web/CLAUDE.md).
  readonly canView = computed(() => this.rbac.can('farmer.rating.view'));
  readonly canEdit = computed(() => this.rbac.canMutate('farmer.rating.edit'));

  /** Sum of the 5 module scores, doubled to a 0-100 scale (BR-06) — recomputed live as
   *  the admin edits. This is the same fixed formula the API uses, not a tunable
   *  business threshold, so mirroring it here for display is safe. */
  readonly liveOverall = computed(() => {
    const modules = this.editableModules();
    const sum = modules.reduce((total, m) => total + m.score, 0);
    return sum * 2;
  });

  /** Cosmetic-only mirror of the BR-04a tier boundaries confirmed for this task, used
   *  solely to preview a tier label while editing. Deliberately duplicated client-side
   *  for UX per the approved plan for this screen — flag for follow-up if these
   *  boundaries should instead be fetched from rating_tier_config so they cannot drift. */
  readonly livePreviewTier = computed<RatingTier>(() => {
    const overall = this.liveOverall();
    if (overall >= 85) return 'EXCELLENT';
    if (overall >= 70) return 'GOOD';
    if (overall >= 50) return 'MODERATE';
    return 'POOR';
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      this.loadError.set(this.s.notFound);
      return;
    }
    this.farmerId = id;
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.service.getFarmerRating(this.farmerId).subscribe({
      next: (r) => this.applyRating(r),
      error: (err: { status?: number }) => {
        this.loading.set(false);
        this.loadError.set(err?.status === 404 ? this.s.notFound : this.s.loadError);
      },
    });
  }

  private applyRating(r: FarmRating): void {
    this.rating.set(r);
    this.editableModules.set(
      r.modules.map((m) => ({
        categoryCode: m.categoryCode,
        name: m.name,
        maxScore: m.maxScore,
        score: m.score ?? 0,
      })),
    );
    this.notes = r.notes ?? '';
    this.loading.set(false);
  }

  updateScore(index: number, rawValue: number): void {
    const modules = this.editableModules();
    const target = modules[index];
    if (!target) return;
    const clamped = Math.min(target.maxScore, Math.max(0, Math.round(Number(rawValue))));
    const next = [...modules];
    next[index] = { ...target, score: clamped };
    this.editableModules.set(next);
  }

  onSave(): void {
    if (!this.canEdit() || this.saving()) return;
    this.saving.set(true);
    this.saveError.set(null);

    this.service
      .submitFarmerRating(this.farmerId, {
        modules: this.editableModules().map((m) => ({
          categoryCode: m.categoryCode,
          score: m.score,
        })),
        notes: this.notes.trim() ? this.notes.trim() : undefined,
      })
      .subscribe({
        next: (r) => {
          this.saving.set(false);
          this.applyRating(r);
        },
        error: (err: { error?: { detail?: string; title?: string } }) => {
          this.saving.set(false);
          this.saveError.set(err.error?.detail ?? err.error?.title ?? this.s.saveError);
        },
      });
  }

  onCancel(): void {
    this.location.back();
  }
}
