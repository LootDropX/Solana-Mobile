import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'LootDrop',
  slug: 'lootdrop',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0A0A0F',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0A0A0F',
    },
    package: 'com.lootdrop.app',
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION',
      'CAMERA',
    ],
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.lootdrop.app',
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'LootDrop needs your location to show nearby drops on the map.',
      NSLocationAlwaysAndWhenInUseUsageDescription:
        'LootDrop uses background location to alert you when drops are nearby.',
      NSCameraUsageDescription:
        'LootDrop uses the camera for claim animations.',
    },
  },
  plugins: [
    'expo-router',
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'LootDrop uses background location to alert you when drops are nearby.',
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission: 'LootDrop uses the camera for claim animations.',
      },
    ],
    'expo-font',
  ],
  scheme: 'lootdrop',
  updates: {
    fallbackToCacheTimeout: 0,
    url: 'https://u.expo.dev/lootdrop',
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  extra: {
    eas: {
      projectId: 'lootdrop-project-id',
    },
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    solanaRpcUrl: process.env.EXPO_PUBLIC_SOLANA_RPC_URL,
    programId: process.env.EXPO_PUBLIC_PROGRAM_ID,
    heliusApiKey: process.env.EXPO_PUBLIC_HELIUS_API_KEY,
    geoapifyApiKey: process.env.EXPO_PUBLIC_GEOAPIFY_KEY,
    solanaCluster: process.env.SOLANA_CLUSTER ?? 'devnet',
  },
});
