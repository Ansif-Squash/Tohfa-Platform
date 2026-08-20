import {
  APP_INITIALIZER,
  type ApplicationConfig,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { authInterceptor } from './core/auth.interceptor';
import { RbacService } from './core/rbac.service';
import { routes } from './app.routes';

/**
 * The permission matrix must be in memory before the first route resolves,
 * otherwise every guard would fail closed on a cold load.
 */
function initialiseRbac(rbac: RbacService): () => Promise<void> {
  return () => rbac.load();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: initialiseRbac,
      deps: [RbacService],
      multi: true,
    },
  ],
};
