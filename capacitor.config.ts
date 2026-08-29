import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kanakku.app',
  appName: 'Kanakku',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
