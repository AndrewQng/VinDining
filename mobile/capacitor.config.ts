import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'vn.vindining.staff',
  appName: 'VinDining Staff',
  webDir: '../frontend/dist',
  server: {
    // Use http scheme so local LAN / emulator HTTP backends (e.g. 10.0.2.2:5159) work without mixed-content blocks.
    // Switch to 'https' when pointing to a production HTTPS backend.
    androidScheme: 'http',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
}

export default config
