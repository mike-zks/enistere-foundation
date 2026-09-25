import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { applyDesignTheme } from './app/core/theme/runtime-theme';

applyDesignTheme(
  document.documentElement,
  globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
);

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
