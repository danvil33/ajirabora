import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ajirabora.app',
  appName: 'AjiraBora',
  webDir: 'dist',
  server: {
    url: 'https://ajirabora.bitcnetwork.com',
    androidScheme: 'https'
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '234880016165-d0ihml81bb04nqgtog041f6mjhl3g27g.apps.googleusercontent.com',
      androidClientId: '234880016165-bhd6r01mr0js9tsifq6vr7s8cmh7jbrd.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  }
};

export default config;