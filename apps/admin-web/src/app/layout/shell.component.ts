/**
 * Application shell: brand header, permission-filtered sidebar, router outlet.
 *
 * The sidebar is generated from `NAV` in app.routes.ts and filtered through
 * RbacService, so a role that cannot use a screen never sees its link. This is
 * cosmetic only — the API is the authority.
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NAV, type NavRoute } from '../app.routes';
import { RbacService } from '../core/rbac.service';

@Component({
  selector: 'tohfa-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
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
      header .version {
        margin-left: auto;
        font-size: var(--tohfa-font-size-footnote);
        opacity: 0.75;
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
      <span class="version">rbac {{ rbacVersion() }}</span>
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

  readonly rbacVersion = computed(() => this.rbac.version());

  /** Recomputes whenever the active roles change (e.g. after login). */
  readonly visibleNav = computed<readonly NavRoute[]>(() => {
    // Touch the signal so the computed tracks role changes.
    this.rbac.activeRoles();
    return NAV.filter((item) => this.rbac.can(item.permission));
  });
}

/** Landing page when a guard rejects a navigation. */
@Component({
  selector: 'tohfa-forbidden',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tohfa-card">
      <h2>Not permitted</h2>
      <p>Your role does not grant access to this screen. Contact a TOHFA Admin if you need it.</p>
    </div>
  `,
})
export class ForbiddenComponent {}
