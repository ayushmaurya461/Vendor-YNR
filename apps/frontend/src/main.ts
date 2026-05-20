import { bootstrapApplication } from '@angular/platform-browser';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { appConfig } from './app/app.config';
import { App } from './app/app';

async function initCapacitor(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await StatusBar.setStyle({ style: Style.Dark });
  } catch {
    // Status bar plugin is not available on all WebView versions.
  }

  await SplashScreen.hide();
}

bootstrapApplication(App, appConfig)
  .then(() => initCapacitor())
  .catch((err) => console.error(err));
