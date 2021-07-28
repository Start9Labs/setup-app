/// <reference types="@capacitor/splash-screen" />

import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.start9labs.setup',
  appName: 'Start9 Setup App',
  webDir: 'www',
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
    },
  },
  server: {
    iosScheme: 'ionic',
  },
}

export default config