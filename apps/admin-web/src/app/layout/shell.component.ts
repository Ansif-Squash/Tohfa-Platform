/**
 * Application shell: brand header, permission-filtered sidebar, router outlet.
 *
 * The sidebar is generated from `NAV` in app.routes.ts and filtered through
 * RbacService, so a role that cannot use a screen never sees its link. This is
 * cosmetic only — the API is the authority.
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import type { RoleCode } from '@tohfa/shared-types';
import { NAV, type NavRoute } from '../app.routes';
import { AuthService } from '../core/auth.service';
import { RbacService } from '../core/rbac.service';

@Component({
  selector: 'tohfa-shell',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: grid;
        grid-template-rows: auto 1fr;
        min-height: 100vh;
      }
      header {
        display: flex;
        align-items: center;
        gap: var(--tohfa-space-lg);
        padding: var(--tohfa-space-lg) var(--tohfa-space-xl);
        background: var(--tohfa-primary-pressed);
        color: #fff;
      }
      header .brand {
        font-weight: var(--tohfa-font-weight-bold);
        font-size: var(--tohfa-font-size-title);
        letter-spacing: 0.02em;
      }
      header .header-controls {
        margin-left: auto;
        display: flex;
        align-items: center;
        gap: var(--tohfa-space-md);
      }
      .role-badge {
        padding: var(--tohfa-space-xs) var(--tohfa-space-sm);
        border-radius: var(--tohfa-radius-chip);
        font-size: var(--tohfa-font-size-caption);
        font-weight: var(--tohfa-font-weight-bold);
        color: #fff;
      }
      .role-select {
        padding: var(--tohfa-space-xs) var(--tohfa-space-sm);
        border-radius: var(--tohfa-radius-button);
        background: rgba(255, 255, 255, 0.2);
        color: #fff;
        border: 1px solid rgba(255, 255, 255, 0.3);
      }
      .logout-btn {
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.4);
        color: #fff;
        padding: var(--tohfa-space-xs) var(--tohfa-space-sm);
        border-radius: var(--tohfa-radius-button);
        cursor: pointer;
        font-size: var(--tohfa-font-size-caption);
      }
      .body {
        display: grid;
        grid-template-columns: 240px 1fr;
        min-height: 0;
      }
      nav {
        padding: var(--tohfa-space-lg);
        border-right: 1px solid rgba(4, 52, 44, 0.08);
        display: flex;
        flex-direction: column;
        gap: var(--tohfa-space-xs);
      }
      nav a {
        display: flex;
        align-items: center;
        min-height: var(--tohfa-min-touch-target);
        padding: 0 var(--tohfa-space-md);
        border-radius: var(--tohfa-radius-button);
        text-decoration: none;
        color: var(--tohfa-on-surface);
      }
      nav a.active {
        background: var(--tohfa-primary);
        color: #fff;
      }
      main {
        padding: var(--tohfa-space-xl);
        min-width: 0;
      }
    `,
  ],
  template: `
    <header>
      <span class="brand">TOHFA Admin</span>
      <div class="header-controls">
        <span
          *ngIf="activeRole()"
          class="role-badge"
          [style.background]="roleColor()"
        >
          {{ activeRole() }}
        </span>

        <select
          *ngIf="roles().length > 1"
          class="role-select"
          [ngModel]="activeRole()"
          (ngModelChange)="onRoleChange($event)"
        >
          <option *ngFor="let role of roles()" [value]="role">{{ role }}</option>
        </select>

        <button class="logout-btn" (click)="onLogout()">
          Logout
        </button>
      </div>
    </header>

    <div class="body">
      <nav>
        <a
          *ngFor="let item of visibleNav()"
          [routerLink]="item.path"
          routerLinkActive="active"
          >{{ item.label }}</a
        >
      </nav>
      <main>
        <router-outlet />
      </main>
    </div>
  `,
})
export class ShellComponent {
  private readonly rbac = inject(RbacService);
  private readonly auth = inject(AuthService);

  readonly isAuthenticated = computed(() => this.auth.isAuthenticated());
  readonly activeRole = computed(() => this.auth.activeRole());
  readonly roles = computed(() => this.auth.roles());
  readonly roleColor = computed(() => {
    const role = this.activeRole();
    return role ? this.rbac.colorFor(role) : '#0F6E56';
  });

  /** Recomputes whenever the active roles change (e.g. after login). */
  readonly visibleNav = computed<readonly NavRoute[]>(() => {
    this.rbac.activeRoles();
    return NAV.filter(
      (item) =>
        this.rbac.can(item.permission) ||
        (item.anyPermissions ?? []).some((code) => this.rbac.can(code)),
    );
  });

  onRoleChange(role: RoleCode): void {
    this.auth.selectRole(role);
  }

  onLogout(): void {
    this.auth.logout();
  }
}

/** Landing page when a guard rejects a navigation. */
@Component({
  selector: 'tohfa-forbidden',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tohfa-card" style="padding: 24px;">
      <h2>Not permitted</h2>
      <p>Your role does not grant access to this screen. Contact a TOHFA Admin if you need it.</p>
    </div>
  `,
})
export class ForbiddenComponent {}
