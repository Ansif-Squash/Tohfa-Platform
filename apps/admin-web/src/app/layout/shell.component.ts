/**
 * Application shell: brand header, permission-filtered sidebar, router outlet.
 *
 * The sidebar is generated from `NAV` in app.routes.ts and filtered through
 * RbacService, so a role that cannot use a screen never sees its link. This is
 * cosmetic only — the API is the authority.
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import type { RoleCode } from '@tohfa/shared-types';
import { NAV, type NavRoute } from '../app.routes';
import { AuthService } from '../core/auth.service';
import { RbacService } from '../core/rbac.service';

interface ShellNotification {
  id: number;
  title: string;
  time: string;
  unread: boolean;
}

@Component({
  selector: 'tohfa-shell',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap');

      :host {
        display: grid;
        grid-template-rows: auto 1fr;
        min-height: 100vh;
        font-family: 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif;

        /* ---- TOHFA type scale ---- */
        --tohfa-font-size-title: 20px;
        --tohfa-font-size-body: 14px;
        --tohfa-font-size-caption: 12px;
        --tohfa-font-weight-semibold: 600;
        --tohfa-font-weight-bold: 700;

        /* ---- Brand colors ---- */
        --tohfa-primary: #2F7D32;
        --tohfa-primary-pressed: #1B5E20;
        --tohfa-primary-light: #E8F5E9;
        --tohfa-primary-pale: #F4FBF4;
        --tohfa-on-surface: #1F2937;
        --tohfa-neutral-50: #F9FAFB;
        --tohfa-neutral-600: #6B7280;

        /* ---- Spacing ---- */
        --tohfa-space-xs: 4px;
        --tohfa-space-sm: 8px;
        --tohfa-space-md: 12px;
        --tohfa-space-lg: 16px;
        --tohfa-space-xl: 24px;

        /* ---- Radius ---- */
        --tohfa-radius-button: 8px;
        --tohfa-radius-chip: 999px;
        --tohfa-min-touch-target: 40px;
      }

      /* ---------- Header ---------- */
      header {
        display: flex;
        align-items: center;
        gap: var(--tohfa-space-lg);
        padding: var(--tohfa-space-lg) var(--tohfa-space-xl);
        background: linear-gradient(
          120deg,
          color-mix(in srgb, var(--tohfa-primary) 90%, white) 0%,
          color-mix(in srgb, var(--tohfa-primary-pressed) 80%, white) 100%
        );
        color: #fff;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
        position: relative;
        z-index: 20;
        border-radius: 10px;
        margin: 10px;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: var(--tohfa-space-sm);
      }
      .brand-mark {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.16);
        flex-shrink: 0;
      }
      .brand-mark svg {
        width: 20px;
        height: 20px;
        color: #fff;
      }
      .brand-text {
        font-weight: var(--tohfa-font-weight-bold);
        font-size: var(--tohfa-font-size-title);
        letter-spacing: 0.01em;
      }

      header .header-controls {
        margin-left: auto;
        display: flex;
        align-items: center;
        gap: var(--tohfa-space-md);
      }

      .role-badge {
        font-family: inherit;
        background: rgba(255, 255, 255, 0.08);=
        border: 1px solid rgba(255, 255, 255, 0.4);
        color: #fff;
        padding: 10px var(--tohfa-space-md);
        border-radius: var(--tohfa-radius-button);
        border: 1px solid rgba(255, 255, 255, 0.4);
        cursor: pointer;
        font-size: var(--tohfa-font-size-caption);
        font-weight: var(--tohfa-font-weight-semibold);
        transition: background 0.15s ease, transform 0.05s ease;
      }
      .role-badge::before {
        content: '';
        width: 6px;
        height: 6px;
        border-radius: 999px;
        background: #fff;
        flex-shrink: 0;
      }
      .role-select {
        font-family: inherit;
        padding: 7px var(--tohfa-space-md);
        border-radius: var(--tohfa-radius-button);
        background: rgba(255, 255, 255, 0.14);
        color: #fff;
        border: 1px solid rgba(255, 255, 255, 0.35);
        font-size: var(--tohfa-font-size-caption);
        font-weight: var(--tohfa-font-weight-semibold);
        cursor: pointer;
        transition: background 0.15s ease, border-color 0.15s ease;
      }
      .role-select:hover {
        background: rgba(255, 255, 255, 0.22);
        border-color: rgba(255, 255, 255, 0.55);
      }
      .role-select option {
        color: #1f2937;
      }
      .logout-btn {
        font-family: inherit;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.4);
        color: #fff;
        padding: 7px var(--tohfa-space-md);
        border-radius: var(--tohfa-radius-button);
        cursor: pointer;
        font-size: var(--tohfa-font-size-caption);
        font-weight: var(--tohfa-font-weight-semibold);
        transition: background 0.15s ease, transform 0.05s ease;
      }
      .logout-btn:hover {
        background: rgba(255, 255, 255, 0.94);
        color: var(--tohfa-primary-pressed);
      }
      .logout-btn:active {
        transform: translateY(1px);
      }

      /* ---------- Notification bell & profile avatar ---------- */
      .menu-wrap {
        position: relative;
      }
      .icon-btn {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--tohfa-radius-button);
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.25);
        color: #fff;
        cursor: pointer;
        transition: background 0.15s ease;
      }
      .icon-btn:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      .icon-btn svg {
        width: 18px;
        height: 18px;
      }
      .badge-dot {
        position: absolute;
        top: -4px;
        right: -4px;
        min-width: 16px;
        height: 16px;
        padding: 0 3px;
        border-radius: 999px;
        background: white;
        color: black;
        font-size: 10px;
        font-weight: var(--tohfa-font-weight-bold);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .avatar-btn {
        display: flex;
        align-items: center;
        gap: var(--tohfa-space-sm);
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.25);
        border-radius: var(--tohfa-radius-chip);
        padding: 4px 10px 4px 4px;
        cursor: pointer;
        color: #fff;
        transition: background 0.15s ease;
      }
      .avatar-btn:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      .avatar-circle {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 999px;
        background: #fff;
        color: var(--tohfa-primary-pressed);
        font-size: 16px;
        font-weight: var(--tohfa-font-weight-bold);
        flex-shrink: 0;
      }
      .avatar-circle-lg {
        width: 40px;
        height: 40px;
        font-size: 14px;
      }

      /* ---------- Dropdown panels ---------- */
      .dropdown-backdrop {
        position: fixed;
        inset: 0;
        z-index: 15;
        background: transparent;
      }
      .dropdown {
        position: absolute;
        top: calc(100% + 10px);
        right: 0;
        width: 300px;
        background: #fff;
        color: var(--tohfa-on-surface);
        border-radius: 12px;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
        overflow: hidden;
        z-index: 25;
      }
      .dropdown-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--tohfa-space-md) var(--tohfa-space-lg);
        border-bottom: 1px solid #F3F4F6;
        font-size: var(--tohfa-font-size-body);
        font-weight: var(--tohfa-font-weight-semibold);
      }
      .link-btn {
        background: none;
        border: none;
        color: var(--tohfa-primary);
        font-size: var(--tohfa-font-size-caption);
        font-weight: var(--tohfa-font-weight-semibold);
        cursor: pointer;
        padding: 0;
      }
      .link-btn:hover {
        text-decoration: underline;
      }
      .dropdown-list {
        max-height: 280px;
        overflow-y: auto;
      }
      .dropdown-item {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: var(--tohfa-space-md) var(--tohfa-space-lg);
        border-bottom: 1px solid #F9FAFB;
      }
      .dropdown-item:last-child {
        border-bottom: none;
      }
      .dropdown-item.unread {
        background: var(--tohfa-primary-pale);
      }
      .dropdown-item .dot {
        margin-top: 6px;
        width: 6px;
        height: 6px;
        border-radius: 999px;
        background: var(--tohfa-primary);
        flex-shrink: 0;
      }
      .item-title {
        font-size: var(--tohfa-font-size-body);
        color: var(--tohfa-on-surface);
        line-height: 1.4;
      }
      .item-time {
        font-size: var(--tohfa-font-size-caption);
        color: var(--tohfa-neutral-600);
        margin-top: 2px;
      }
      .dropdown-empty {
        padding: var(--tohfa-space-xl);
        text-align: center;
        font-size: var(--tohfa-font-size-body);
        color: var(--tohfa-neutral-600);
      }

      .profile-info {
        display: flex;
        align-items: center;
        gap: var(--tohfa-space-md);
        padding: var(--tohfa-space-lg);
        border-bottom: 1px solid #F3F4F6;
      }
      .profile-name {
        font-size: var(--tohfa-font-size-body);
        font-weight: var(--tohfa-font-weight-semibold);
        color: var(--tohfa-on-surface);
      }
      .profile-role {
        font-size: var(--tohfa-font-size-caption);
        color: var(--tohfa-neutral-600);
        text-transform: capitalize;
      }
      .dropdown-item-link {
        display: block;
        padding: var(--tohfa-space-md) var(--tohfa-space-lg);
        font-size: var(--tohfa-font-size-body);
        color: var(--tohfa-on-surface);
        text-decoration: none;
        transition: background 0.15s ease;
      }
      .dropdown-item-link:hover {
        background: var(--tohfa-primary-pale);
      }

      /* ---------- Body layout ---------- */
      .body {
        display: grid;
        grid-template-columns: 240px 1fr;
        min-height: 0;
      }

      /* ---------- Sidebar ---------- */
      nav {
        padding: var(--tohfa-space-lg) var(--tohfa-space-md);
        background: #fff;
        border-right: 1px solid rgba(4, 52, 44, 0.08);
        box-shadow: 1px 0 0 rgba(0, 0, 0, 0.02);
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      nav a {
        position: relative;
        display: flex;
        align-items: center;
        min-height: var(--tohfa-min-touch-target);
        padding: 0 var(--tohfa-space-md) 0 var(--tohfa-space-lg);
        border-radius: var(--tohfa-radius-button);
        text-decoration: none;
        color: var(--tohfa-on-surface);
        font-size: var(--tohfa-font-size-body);
        font-weight: 500;
        transition: background 0.15s ease, color 0.15s ease;
      }
      nav a::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 0;
        border-radius: 999px;
        background: var(--tohfa-primary);
        transition: height 0.15s ease;
      }
      nav a:hover {
        background: var(--tohfa-primary-pale);
      }
      nav a.active {
        background: var(--tohfa-primary-light);
        color: var(--tohfa-primary-pressed);
        font-weight: var(--tohfa-font-weight-semibold);
      }
      nav a.active::before {
        height: 60%;
      }

      /* ---------- Content canvas ---------- */
      main {
        padding: var(--tohfa-space-xl);
        min-width: 0;
        background: var(--tohfa-neutral-50);
        font-size: var(--tohfa-font-size-body);
      }
    `,
  ],
  template: `
    <header>
      <div class="brand">
        <span class="brand-mark">
         <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path>
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path>
            </svg>
        </span>
        <span class="brand-text">TOHFA ADMIN</span>
      </div>

      <div class="header-controls">
        <span
          *ngIf="activeRole()"
          class="role-badge"
          
        >
          {{ formatRole(activeRole()) }}
        </span>

        <select
          *ngIf="roles().length > 1"
          class="role-select"
          [ngModel]="activeRole()"
          (ngModelChange)="onRoleChange($event)"
        >
          <option *ngFor="let role of roles()" [value]="role">{{ role }}</option>
        </select>

        <!-- Notifications -->
        <div class="menu-wrap">
          <button class="icon-btn" type="button" aria-label="Notifications" (click)="toggleNotifications()">
            <svg
  width="64"
  height="64"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  strokeWidth="2"
  strokeLinecap="round"
  strokeLinejoin="round"
>
  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
</svg>
            <span class="badge-dot" *ngIf="unreadCount() > 0">{{ unreadCount() }}</span>
          </button>

          <div class="dropdown" *ngIf="notificationsOpen()">
            <div class="dropdown-header">
              <span>Notifications</span>
              <button class="link-btn" type="button" *ngIf="unreadCount() > 0" (click)="markAllRead()">
                Mark all read
              </button>
            </div>
            <div class="dropdown-list" *ngIf="notifications().length > 0; else noNotifications">
              <div class="dropdown-item" *ngFor="let n of notifications()" [class.unread]="n.unread">
                <span class="dot" *ngIf="n.unread"></span>
                <div>
                  <div class="item-title">{{ n.title }}</div>
                  <div class="item-time">{{ n.time }}</div>
                </div>
              </div>
            </div>
            <ng-template #noNotifications>
              <div class="dropdown-empty">You're all caught up.</div>
            </ng-template>
          </div>
        </div>

        <!-- Profile -->
        <button class="logout-btn" (click)="onLogout()">
          Logout
        </button>

         <div class="menu-wrap">
         
            <span class="avatar-circle">{{ profileInitials() }}</span>
          

          <div class="dropdown" *ngIf="profileOpen()">
            <div class="profile-info">
              <span class="avatar-circle avatar-circle-lg">{{ profileInitials() }}</span>
              <div>
                <div class="profile-name">TOHFA Admin</div>
                <div class="profile-role">{{ activeRole() || 'No role assigned' }}</div>
              </div>
            </div>
            <a class="dropdown-item-link" routerLink="/profile">View Profile</a>
            <a class="dropdown-item-link" routerLink="/settings">Account Settings</a>
          </div>
        </div>

      </div>

      <div class="dropdown-backdrop" *ngIf="notificationsOpen() || profileOpen()" (click)="closeMenus()"></div>
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

  formatRole(role: string | null): string {
  if (!role) return '';

  return role
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

  /** Recomputes whenever the active roles change (e.g. after login). */
  readonly visibleNav = computed<readonly NavRoute[]>(() => {
    this.rbac.activeRoles();
    return NAV.filter((item) => this.rbac.can(item.permission));
  });

  /** Initials shown on the profile avatar — derived from the active role until a real user profile is wired in. */
  readonly profileInitials = computed(() => {
    const role = this.activeRole();
    return role ? role.slice(0, 2).toUpperCase() : 'AD';
  });

  /** Placeholder notification feed — swap for a real NotificationsService when one exists. */
  readonly notifications = signal<ShellNotification[]>([
    { id: 1, title: 'New farmer application submitted', time: '5m ago', unread: true },
    { id: 2, title: 'Warehouse capacity threshold reached', time: '1h ago', unread: true },
    { id: 3, title: 'Document verification completed', time: 'Yesterday', unread: false },
  ]);
  readonly unreadCount = computed(() => this.notifications().filter((n) => n.unread).length);

  readonly notificationsOpen = signal(false);
  readonly profileOpen = signal(false);

  toggleNotifications(): void {
    this.profileOpen.set(false);
    this.notificationsOpen.update((open) => !open);
  }

  toggleProfile(): void {
    this.notificationsOpen.set(false);
    this.profileOpen.update((open) => !open);
  }

  closeMenus(): void {
    this.notificationsOpen.set(false);
    this.profileOpen.set(false);
  }

  markAllRead(): void {
    this.notifications.update((list) => list.map((n) => ({ ...n, unread: false })));
  }

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
  styles: [
    `
      @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&display=swap');
      :host {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 60vh;
        font-family: 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif;
      }
      .tohfa-card {
        background: #fff;
        border: 1px solid #E5E7EB;
        border-radius: 16px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
        max-width: 420px;
        text-align: center;
      }
      .forbidden-icon {
        width: 48px;
        height: 48px;
        margin: 0 auto 12px;
        border-radius: 12px;
        background: #FEF2F2;
        color: #DC2626;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .forbidden-icon svg { width: 24px; height: 24px; }
      .tohfa-card h2 {
        font-size: 20px;
        font-weight: 600;
        margin: 0 0 8px 0;
        color: #1F2937;
      }
      .tohfa-card p {
        font-size: 14px;
        font-weight: 400;
        color: #6B7280;
        margin: 0;
        line-height: 1.5;
      }
    `,
  ],
  template: `
    <div class="tohfa-card" style="padding: 32px;">
      <div class="forbidden-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
        </svg>
      </div>
      <h2>Not permitted</h2>
      <p>Your role does not grant access to this screen. Contact a TOHFA Admin if you need it.</p>
    </div>
  `,
})
export class ForbiddenComponent {}