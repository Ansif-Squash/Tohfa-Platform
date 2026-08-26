import {
  APP_INITIALIZER,
  type ApplicationConfig,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { authInterceptor } from './core/auth.interceptor';
import { AuthService } from './core/auth.service';
import { RbacService } from './core/rbac.service';
import { routes } from './app.routes';

/**
 * The permission matrix must be in memory before the first route resolves.
 * If an active token exists, hydrate the user profile into RbacService.
 */
function initialiseApp(rbac: RbacService, auth: AuthService): () => Promise<void> {
  return async () => {
    await rbac.load();
    if (auth.isAuthenticated()) {
      await auth.loadMe();
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: initialiseApp,
      deps: [RbacService, AuthService],
      multi: true,
    },
  ],
};
