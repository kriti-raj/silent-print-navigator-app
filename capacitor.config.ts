import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.4d4033220908476098de4a77c983d90a',
  appName: 'silent-print-navigator-app',
  webDir: 'dist',
  server: {
    url: 'https://4d403322-0908-4760-98de-4a77c983d90a.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Filesystem: {
      iosFileLocationType: 'documents',
      androidFileLocationType: 'external'
    }
  }
};

export default config;