import 'dotenv/config';

export default {
  expo: {
    name: 'Aliados Corporativo',
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
      displayName: 'Aliados Corporativo',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',

      },
      edgeToEdgeEnabled: true,
      package: 'com.wolfagua.aliados_sistem_app',
      googleServicesFile: './google-services.json',
      displayName: 'Aliados Corporativo',
      softwareKeyboardLayoutMode: 'pan',

      notification: {
          icon: "./assets/notification-icon.png", // Ruta al ícono de notificación
          color: "#FF0000", // Color de fondo de la notificación
        },
    },
    web: {
      favicon: './assets/favicon.png',
      notification: {
        icon: './assets/notification-icon.png',
        vapidPublicKey: 'BN3Gwkzlpb0gd7BgU74KggK3TIamiUUuF27Gvd4puhbgVWbk3cNigcZR7CxF9kELP4IvCqHVElXx3P2tw5btiYs',
      },
    },
    scheme: 'aliados_sistem_app',
    plugins: [
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#e81a1a',
        },
      ],
      'expo-router',
    ],

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
