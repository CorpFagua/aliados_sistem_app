import Constants from 'expo-constants';

// Variables públicas (EXPO_PUBLIC_*)
export const ENV = {
  // Supabase
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || Constants.expoConfig?.extra?.supabaseUrl,
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || Constants.expoConfig?.extra?.supabaseAnonKey,
  
  // API URLs
  API_URL_LOCAL: process.env.EXPO_PUBLIC_API_URL_LOCAL || 'http://192.168.20.19:3000',
  API_URL_PRODUCTION: process.env.EXPO_PUBLIC_API_URL_PRODUCTION || Constants.expoConfig?.extra?.apiUrlProduction,
  API_URL: process.env.EXPO_PUBLIC_API_URL,
  
  // Build Info
  BUILD_ENV: process.env.EXPO_PUBLIC_BUILD_ENV || 'development',
  APP_VERSION: Constants.expoConfig?.version || '1.0.0',
  APP_BUILD_NUMBER: Constants.expoConfig?.extra?.buildNumber || '1',
};

// Selector automático de API URL según ambiente
export const getApiUrl = (): string => {
  if (ENV.BUILD_ENV === 'production') {
    return ENV.API_URL_PRODUCTION || ENV.API_URL || ENV.API_URL_LOCAL;
  }
  return ENV.API_URL || ENV.API_URL_LOCAL;
};

// Validación de variables críticas
export const validateEnvironment = (): boolean => {
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
  const missing = required.filter(key => !ENV[key as keyof typeof ENV]);
  
  if (missing.length > 0) {
    console.warn(`⚠️ Variables de entorno faltantes: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
};

export default ENV;
