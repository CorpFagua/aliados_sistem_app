import 'dotenv/config';

export default {
  expo: {
    name: 'aliados_sistem_app',
    slug: 'aliados_sistem_app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.wolfagua.aliados-sistem-app',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      package: 'com.wolfagua.aliados_sistem_app',
      googleServicesFile: './google-services.json',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    scheme: 'aliados_sistem_app',
    plugins: ['expo-router'],
    extra: {
      router: {},
      eas: {
        projectId: '63881507-c862-49b7-aa39-ca74fad214b5',
      },
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      apiUrlLocal: process.env.EXPO_PUBLIC_API_URL_LOCAL,
      apiUrlProduction: process.env.EXPO_PUBLIC_API_URL_PRODUCTION,
      buildEnv: process.env.EXPO_PUBLIC_BUILD_ENV || 'development',
    },
  },
};
