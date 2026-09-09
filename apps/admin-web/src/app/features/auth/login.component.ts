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
      :host {
        --brand-primary: var(--tohfa-primary, #2f7d32);
        --brand-primary-dark: var(--tohfa-primary-dark, #1b5e20);
        --brand-primary-light: var(--tohfa-primary-light, #e8f5e9);
        --brand-cream: var(--tohfa-surface-variant, #fbf8f2);
        --brand-error: var(--tohfa-error, #dc2626);
        --brand-error-light: var(--tohfa-error-light, #fef2f2);
        --neutral-950: var(--tohfa-neutral-950, #111827);
        --neutral-700: var(--tohfa-neutral-700, #4b5563);
        --neutral-500: var(--tohfa-neutral-500, #9ca3af);
        --neutral-300: var(--tohfa-neutral-300, #e5e7eb);
        display: block;
        font-family: var(--tohfa-font-family, 'Manrope', sans-serif);
      }

      * {
        box-sizing: border-box;
      }

      .shell {
        min-height: 100vh;
        display: grid;
        grid-template-columns: 1.15fr 1fr;
        background: var(--brand-cream);
      }

      /* ---------- Illustration / brand panel ---------- */
      .scene {
  position: relative;
  /* Dark linear gradient overlay to boost text contrast over lighter sky areas */
  background-image: 
    linear-gradient(
      180deg, 
      rgba(15, 28, 18, 0.72) 0%, 
      rgba(15, 28, 18, 0.35) 45%, 
      rgba(0, 0, 0, 0.15) 100%
    ),
    url("assets/aut.png");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  color: #ffffff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  width: 100%;
}

      .scene-top {
  position: relative;
  z-index: 2;
  padding: 48px 56px 0;
}

      .mark {
  display: flex;
  align-items: center;
  gap: 10px;
  /* Strong shadow for header logo/title */
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6));
}

.mark span {
  font-size: 36px;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #ffffff;
}

.scene-copy {
  margin-top: 72px;
  max-width: 400px;
}

.scene-copy h1 {
  font-size: 36px;
  line-height: 1.2;
  font-weight: 800;
  margin: 0 0 14px;
  letter-spacing: -0.01em;
  color: #ffffff;
  /* High contrast drop-shadow to make text pop against light backgrounds */
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.65), 0 1px 3px rgba(0, 0, 0, 0.8);
}

.scene-copy p {
  font-size: 15px;
  line-height: 1.6;
  color: #f3f4f6; /* Pure crisp light gray/white */
  margin: 0;
  font-weight: 500;
  /* Subtle shadow for paragraph readability */
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.75);
}

      .hills {
        position: relative;
        z-index: 1;
        width: 100%;
        display: block;
        margin-top: 40px;
      }

      .sun {
        position: absolute;
        top: 40px;
        right: 64px;
        z-index: 1;
      }

      .stat-strip {
        position: relative;
        z-index: 2;
        display: flex;
        align-items: center;
        padding: 22px 56px;
        background: rgba(0, 0, 0, 0.14);
        border-top: 1px solid rgba(255, 255, 255, 0.12);
      }

      .stat {
        padding-right: 28px;
        margin-right: 28px;
        border-right: 1px solid rgba(255, 255, 255, 0.18);
      }

      .stat:last-child {
        border-right: none;
        margin-right: 0;
        padding-right: 0;
      }

      .stat .num {
        font-size: 18px;
        font-weight: 700;
        display: block;
        line-height: 1.3;
      }

      .stat .label {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.65);
        font-weight: 500;
      }

      /* ---------- Form panel ---------- */
      .form-side {
        display: flex;
        align-items: center;
        justify-content: center;
        background: #fff;
        padding: 40px;
      }

      .form-col {
        width: 100%;
        max-width: 360px;
      }

      .mobile-mark {
        display: none;
        align-items: center;
        gap: 10px;
        margin-bottom: 40px;
      }

      .mobile-mark-icon {
        width: 34px;
        height: 34px;
        border-radius: 8px;
        background: var(--brand-primary-light);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .mobile-mark span {
        font-size: 18px;
        font-weight: 700;
        color: var(--brand-primary-dark);
      }

      .form-heading h2 {
        font-size: 24px;
        line-height: 32px;
        font-weight: 700;
        margin: 0 0 6px;
        color: var(--neutral-950);
      }

      .form-heading p {
        font-size: 14px;
        line-height: 20px;
        color: var(--neutral-700);
        margin: 0 0 32px;
        font-weight: 400;
      }

      .alert {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        background: var(--brand-error-light);
        border: 1px solid rgba(220, 38, 38, 0.2);
        color: var(--brand-error);
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 20px;
        font-size: 13px;
        line-height: 18px;
      }

      .alert svg {
        flex: none;
        margin-top: 1px;
      }

      .field {
        margin-bottom: 20px;
      }

      .field label {
        display: block;
        font-size: 13px;
        font-weight: 600;
        color: var(--neutral-950);
        margin-bottom: 8px;
      }

      .input-wrap {
        position: relative;
        display: flex;
        align-items: center;
      }

      .input-wrap svg.leading-icon {
        position: absolute;
        left: 14px;
        color: var(--neutral-500);
        pointer-events: none;
      }

      .input-wrap input {
        width: 100%;
        height: 44px;
        padding: 0 42px 0 42px;
        border: 1px solid var(--neutral-300);
        border-radius: 8px;
        font-family: inherit;
        font-size: 14px;
        color: var(--neutral-950);
        background: #fff;
        transition: border-color 0.15s, box-shadow 0.15s;
        outline: none;
      }

      .input-wrap input::placeholder {
        color: var(--neutral-500);
      }

      .input-wrap input:focus {
        border-color: var(--brand-primary);
        box-shadow: 0 0 0 3px var(--brand-primary-light);
      }

      .input-wrap input.has-error {
        border-color: var(--brand-error);
      }

      .toggle-visibility {
        position: absolute;
        top:10px;
        right: 12px;
        background: none;
        border: none;
        padding: 4px;
        display: flex;
        cursor: pointer;
        color: var(--neutral-500);
      }

      .toggle-visibility:hover {
        color: var(--neutral-700);
      }

      .row-meta {
        display: flex;
        justify-content: flex-end;
        margin: -8px 0 22px;
      }

      .link-btn {
        background: none;
        border: none;
        padding: 0;
        font-size: 13px;
        font-weight: 600;
        color: var(--brand-primary);
        cursor: pointer;
        font-family: inherit;
      }

      .link-btn:hover {
        color: var(--brand-primary-dark);
        text-decoration: underline;
      }

      .btn-primary {
        width: 100%;
        height: 46px;
        border-radius: 8px;
        background: var(--brand-primary);
        color: #fff;
        font-family: inherit;
        font-size: 14px;
        font-weight: 700;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: background 0.15s;
      }

      .btn-primary:hover:not(:disabled) {
        background: var(--brand-primary-dark);
      }

      .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .spinner {
        width: 16px;
        height: 16px;
        border-radius: 999px;
        border: 2px solid rgba(255, 255, 255, 0.4);
        border-top-color: #fff;
        animation: spin 0.7s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .foot-note {
        margin-top: 28px;
        font-size: 12px;
        color: var(--neutral-500);
        line-height: 18px;
      }

      /* ---------- Role selection ---------- */
      .back-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: none;
        border: none;
        padding: 0;
        font-size: 13px;
        font-weight: 600;
        color: var(--neutral-700);
        cursor: pointer;
        margin-bottom: 20px;
      }

      .back-btn:hover {
        color: var(--neutral-950);
      }

      .role-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 8px;
      }

      .role-option {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        text-align: left;
        padding: 14px 16px;
        border: 1px solid var(--neutral-300);
        border-radius: 8px;
        background: #fff;
        font-family: inherit;
        cursor: pointer;
        transition: border-color 0.15s, background 0.15s;
      }

      .role-option:hover:not(:disabled) {
        border-color: var(--brand-primary);
        background: var(--brand-primary-light);
      }

      .role-option:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .role-icon {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        background: var(--brand-primary-light);
        color: var(--brand-primary-dark);
        display: flex;
        align-items: center;
        justify-content: center;
        flex: none;
      }

      .role-name {
        font-size: 14px;
        font-weight: 600;
        color: var(--neutral-950);
      }

      .role-chevron {
        margin-left: auto;
        color: var(--neutral-500);
      }

      @media (max-width: 900px) {
        .shell {
          grid-template-columns: 1fr;
        }
        .scene {
          display: none;
        }
        .mobile-mark {
          display: flex;
        }
        .form-side {
          padding: 32px 20px;
        }
      }
    `,
  ],
  template: `
    <div class="shell">
      <!-- Illustration / brand panel -->
      <aside class="scene">
        <div class="scene-top">
          <div class="mark">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path>
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path>
            </svg>
            <span>TOHFA</span>
          </div>
          <div class="scene-copy">
            <h1>Every harvest, accounted for.</h1>
            <p>Manage farmer registrations, applications, and program schemes for the Nilgiris Horticulture Organic Farmers Association.</p>
          </div>
        </div>

        

        
      </aside>

      <!-- Form panel -->
      <section class="form-side">
        <div class="form-col">
          <div class="mobile-mark">
            <div class="mobile-mark-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1b5e20" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path>
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path>
              </svg>
            </div>
            <span>TOHFA</span>
          </div>

          <!-- Credentials step -->
          <ng-container *ngIf="!requiresRoleSelection()">
            <div class="form-heading">
              <h2>Sign in</h2>
              <p>Log in to the TOHFA management console</p>
            </div>

            <div class="alert" *ngIf="errorMessage()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{{ errorMessage() }}</span>
            </div>

            <form (ngSubmit)="onSubmit()">
              <div class="field">
                <label for="mobile">Mobile number</label>
                <div class="input-wrap">
                  <svg class="leading-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  <input
                    id="mobile"
                    type="text"
                    [(ngModel)]="mobile"
                    name="mobile"
                    placeholder="+91 98000 00001"
                    autocomplete="username"
                    required
                  />
                </div>
              </div>

              <div class="field">
                <label for="password">Password</label>
                <div class="input-wrap">
                  <svg class="leading-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <input
                    id="password"
                    [type]="showPassword() ? 'text' : 'password'"
                    [(ngModel)]="password"
                    name="password"
                    placeholder="••••••••"
                    autocomplete="current-password"
                    required
                  />
                  <button
                    class="toggle-visibility"
                    type="button"
                    (click)="showPassword.set(!showPassword())"
                    [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
                  >
                    <svg *ngIf="!showPassword()" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <svg *ngIf="showPassword()" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  </button>
                </div>
              </div>

              <div class="row-meta">
                <button class="link-btn" type="button">Forgot password?</button>
              </div>

              <button class="btn-primary" type="submit" [disabled]="loading()">
                <span class="spinner" *ngIf="loading()"></span>
                {{ loading() ? 'Logging in...' : 'Sign In' }}
              </button>
            </form>

            
          </ng-container>

          <!-- Role selection step -->
          <ng-container *ngIf="requiresRoleSelection()">
            <button class="back-btn" type="button" (click)="onBackToCredentials()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              Back
            </button>

            <div class="form-heading">
              <h2>Select active role</h2>
              <p>Your account holds multiple administrative roles. Choose which role to sign in as.</p>
            </div>

            <div class="alert" *ngIf="errorMessage()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{{ errorMessage() }}</span>
            </div>

            <div class="role-list">
              <button
                *ngFor="let role of availableRoles()"
                class="role-option"
                type="button"
                [disabled]="loading()"
                (click)="onSelectRole(role)"
              >
                <span class="role-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </span>
                <span class="role-name">{{ role }}</span>
                <svg class="role-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </ng-container>
        </div>
      </section>
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
  showPassword = signal(false);
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

  onBackToCredentials(): void {
    this.requiresRoleSelection.set(false);
    this.availableRoles.set([]);
    this.errorMessage.set(null);
  }
}