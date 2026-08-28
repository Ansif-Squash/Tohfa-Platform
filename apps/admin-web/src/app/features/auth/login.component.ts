import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, type OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import type { RoleCode } from '@tohfa/shared-types';
import { NAV } from '../../app.routes';
import { AuthService } from '../../core/auth.service';
import { RbacService } from '../../core/rbac.service';

@Component({
  selector: 'tohfa-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      .login-wrapper {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--tohfa-surface-variant);
        padding: var(--tohfa-space-lg);
      }
      .login-card {
        background: #fff;
        border-radius: var(--tohfa-radius-card);
        padding: var(--tohfa-space-2xl);
        width: 100%;
        max-width: 420px;
        box-shadow: var(--tohfa-shadow-card);
      }
      .brand-title {
        color: var(--tohfa-primary);
        font-size: var(--tohfa-font-size-headline);
        font-weight: var(--tohfa-font-weight-bold);
        margin-bottom: var(--tohfa-space-xs);
        text-align: center;
      }
      .subtitle {
        color: rgba(4, 52, 44, 0.6);
        text-align: center;
        margin-bottom: var(--tohfa-space-xl);
      }
      .form-group {
        margin-bottom: var(--tohfa-space-lg);
      }
      label {
        display: block;
        font-weight: var(--tohfa-font-weight-semibold);
        margin-bottom: var(--tohfa-space-xs);
        color: var(--tohfa-on-surface);
      }
      input {
        width: 100%;
        padding: var(--tohfa-space-md);
        border: 1px solid rgba(4, 52, 44, 0.2);
        border-radius: var(--tohfa-radius-button);
        font-size: var(--tohfa-font-size-body);
        box-sizing: border-box;
      }
      .btn {
        width: 100%;
        padding: var(--tohfa-space-md);
        border-radius: var(--tohfa-radius-button);
        background: var(--tohfa-primary);
        color: #fff;
        font-weight: var(--tohfa-font-weight-bold);
        border: none;
        cursor: pointer;
        font-size: var(--tohfa-font-size-body);
      }
      .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .error-msg {
        color: #c62828;
        background: #ffebee;
        padding: var(--tohfa-space-sm) var(--tohfa-space-md);
        border-radius: var(--tohfa-radius-button);
        margin-bottom: var(--tohfa-space-md);
        font-size: var(--tohfa-font-size-caption);
      }
      .role-options {
        display: flex;
        flex-direction: column;
        gap: var(--tohfa-space-sm);
        margin-top: var(--tohfa-space-md);
      }
      .role-btn {
        padding: var(--tohfa-space-md);
        border-radius: var(--tohfa-radius-button);
        border: 1px solid var(--tohfa-primary);
        background: #fff;
        color: var(--tohfa-primary);
        font-weight: var(--tohfa-font-weight-bold);
        cursor: pointer;
        font-size: var(--tohfa-font-size-body);
        transition: background 0.2s;
      }
      .role-btn:hover {
        background: var(--tohfa-surface-variant);
      }
    `,
  ],
  template: `
    <div class="login-wrapper">
      <div class="login-card">
        <h1 class="brand-title">TOHFA Admin</h1>
        <p class="subtitle">Log in to the management console</p>

        <div class="error-msg" *ngIf="errorMessage()">
          {{ errorMessage() }}
        </div>

        <form *ngIf="!requiresRoleSelection()" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="mobile">Mobile Number</label>
            <input
              id="mobile"
              type="text"
              [(ngModel)]="mobile"
              name="mobile"
              placeholder="+919800000001"
              required
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              [(ngModel)]="password"
              name="password"
              placeholder="••••••••"
              required
            />
          </div>

          <button class="btn" type="submit" [disabled]="loading()">
            {{ loading() ? 'Logging in...' : 'Sign In' }}
          </button>
        </form>

        <div *ngIf="requiresRoleSelection()">
          <h3 style="margin-bottom: 8px;">Select Active Role</h3>
          <p style="color: rgba(4, 52, 44, 0.7); font-size: 14px; margin-bottom: 16px;">
            Your account holds multiple administrative roles. Choose which role to sign in as:
          </p>
          <div class="role-options">
            <button
              *ngFor="let role of availableRoles()"
              class="role-btn"
              type="button"
              [disabled]="loading()"
              (click)="onSelectRole(role)"
            >
              {{ role }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly rbac = inject(RbacService);
  private readonly router = inject(Router);

  mobile = '';
  password = '';
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  requiresRoleSelection = signal(false);
  availableRoles = signal<RoleCode[]>([]);

  async ngOnInit(): Promise<void> {
    if (this.auth.isAuthenticated()) {
      await this.navigateAfterLogin();
    }
  }

  private async navigateAfterLogin(): Promise<void> {
    if (!this.rbac.loaded()) {
      await this.rbac.load();
    }
    const target = this.rbac.firstAllowedPath(NAV);
    await this.router.navigateByUrl(target);
  }

  async onSubmit(): Promise<void> {
    if (!this.mobile || !this.password) return;
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const res = await this.auth.login(this.mobile, this.password);
      if (res.requiresRoleSelection && res.availableRoles) {
        const roles = res.availableRoles.map((r) => (typeof r === 'string' ? r : r.code));
        this.availableRoles.set(roles);
        this.requiresRoleSelection.set(true);
      } else {
        await this.navigateAfterLogin();
      }
    } catch (err: unknown) {
      const e = err as { problem?: { detail?: string }; error?: { detail?: string }; message?: string };
      this.errorMessage.set(
        e.problem?.detail ?? e.error?.detail ?? e.message ?? 'Invalid credentials. Please try again.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  async onSelectRole(role: RoleCode): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      await this.auth.login(this.mobile, this.password, role);
      await this.navigateAfterLogin();
    } catch (err: unknown) {
      const e = err as { problem?: { detail?: string }; error?: { detail?: string }; message?: string };
      this.errorMessage.set(
        e.problem?.detail ?? e.error?.detail ?? e.message ?? 'Failed to select role. Please try again.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}

