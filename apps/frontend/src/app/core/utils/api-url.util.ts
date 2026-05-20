import { Capacitor } from '@capacitor/core';

/** Android emulator maps the host machine's localhost to 10.0.2.2. */
const ANDROID_EMULATOR_API = 'http://10.0.2.2:3000';

/**
 * Resolves the API base URL for web and native builds.
 * On a physical device, set apiUrl in environment or use your machine's LAN IP.
 */
export function resolveApiUrl(defaultUrl: string): string {
  if (Capacitor.getPlatform() === 'android') {
    return ANDROID_EMULATOR_API;
  }
  return defaultUrl;
}
