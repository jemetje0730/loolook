import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.loolook.app',
  appName: 'LooLook',
  webDir: 'out',
  server: {
    url: 'https://loolook.vercel.app',
    cleartext: true,
    androidScheme: 'https'
  }
};

export default config;
