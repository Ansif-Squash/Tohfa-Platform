import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom, type Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { RoleCode } from '@tohfa/shared-types';
import { TokenStore } from './auth.interceptor';
import { RbacService } from './rbac.service';

export interface RoleAssignment {
  code: RoleCode;
  warehouseId?: string | null;
  zoneId?: string | null;
}

export interface UserProfile {
  id: string;
  mobile: string;
  fullName: string;
  roles: RoleAssignment[];
}

export interface LoginResponse {
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  user?: UserProfile;
  requiresRoleSelection?: boolean;
  availableRoles?: Array<RoleAssignment | RoleCode>;
}

export function normalizeMobile(mobile: string): string {
  const cleaned = mobile.trim().replace(/[\s-]/g, '');
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  if (/^91[6-9]\d{9}$/.test(cleaned)) {
    return `+${cleaned}`;
  }
  return cleaned;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokens = inject(TokenStore);
  private readonly rbac = inject(RbacService);

  private readonly currentUser = signal<UserProfile | null>(null);
  private readonly selectedRole = signal<RoleCode | null>(null);
  private readonly availableRoles = signal<readonly RoleCode[]>([]);

  readonly user = this.currentUser.asReadonly();
  readonly activeRole = this.selectedRole.asReadonly();
  readonly roles = this.availableRoles.asReadonly();
  readonly isAuthenticated = computed(() => this.tokens.get() !== null);

  async login(mobile: string, password: string, roleCode?: RoleCode): Promise<LoginResponse> {
    const normalizedMobile = normalizeMobile(mobile);
    const payload: { mobile: string; password: string; roleCode?: RoleCode } = {
      mobile: normalizedMobile,
      password,
    };
    if (roleCode !== undefined) {
      payload.roleCode = roleCode;
    }

    const res = await firstValueFrom(
      this.http.post<LoginResponse>('/v1/auth/login', payload),
    );

    if (res.requiresRoleSelection && res.availableRoles) {
      const parsed = res.availableRoles.map((r) => (typeof r === 'string' ? r : r.code));
      this.availableRoles.set(parsed);
      return res;
    }

    if (res.accessToken && res.refreshToken) {
      this.tokens.set(res.accessToken, res.refreshToken);
      if (res.user) {
        this.setUser(res.user);
      } else {
        await this.loadMe();
      }
    }

    return res;
  }

  async loadMe(): Promise<UserProfile | null> {
    try {
      const profile = await firstValueFrom(this.http.get<UserProfile>('/v1/auth/me'));
      this.setUser(profile);
      return profile;
    } catch {
      this.logout();
      return null;
    }
  }

  selectRole(role: RoleCode): void {
    this.selectedRole.set(role);
    this.rbac.setRoles([role]);
  }

  setUser(profile: UserProfile): void {
    this.currentUser.set(profile);
    const roleCodes = profile.roles.map((r) => r.code);
    this.availableRoles.set(roleCodes);

    const initialRole = roleCodes[0] ?? null;
    this.selectedRole.set(initialRole);
    this.rbac.setRoles(roleCodes);
  }

  refreshToken(): Observable<{ accessToken: string; refreshToken: string }> {
    const refreshToken = this.tokens.getRefresh();
    return this.http
      .post<{ accessToken: string; refreshToken: string }>('/v1/auth/refresh', {
        refreshToken,
      })
      .pipe(
        tap((res) => {
          this.tokens.set(res.accessToken, res.refreshToken);
        }),
      );
  }

  logout(): void {
    this.tokens.clear();
    this.currentUser.set(null);
    this.selectedRole.set(null);
    this.availableRoles.set([]);
    this.rbac.setRoles([]);
    this.router.navigate(['/login']);
  }
}
