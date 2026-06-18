import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chavules.webmundial',
  appName: 'WebMundial',
  webDir: 'dist/web-mundial/browser',
  server: {
    url: 'https://web-mundial-2026.vercel.app',
    cleartext: true
  }
};

export default config;
