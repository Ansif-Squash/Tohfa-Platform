import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { ShellComponent } from './app/layout/shell.component';

bootstrapApplication(ShellComponent, appConfig).catch((error: unknown) => {
  console.error('admin-web failed to bootstrap', error);
});
