# 📊 Análisis de Estructura del Proyecto React Native

**Fecha:** 6 de enero de 2026  
**React Native Version:** 0.81.4  
**Expo Version:** 54.0.9  
**React Version:** 19.1.0

---

## 🔴 PROBLEMAS IDENTIFICADOS

### 1. **DUPLICACIÓN DE HOOKS PARA SERVICE HISTORY**
**Ubicación:** `src/hooks/`

Encontré **3 hooks muy similares** que hacen prácticamente lo mismo:
- `useServiceHistory.ts` - Basic
- `useServiceHistoryOptimized.ts` - Versión optimizada (371 líneas)
- `useServiceHistoryRealtime.ts` - Versión con suscripciones en tiempo real (528 líneas)

**Problema:** Esto causa confusión sobre cuál usar y dificulta el mantenimiento.

**Recomendación:** 
- Mantener solo `useServiceHistoryRealtime.ts` como la versión definitiva
- Eliminar las otras dos versiones
- Documentar claramente cuándo usar features específicas

---

### 2. **COMPONENTES SIN ORGANIZACIÓN**
**Ubicación:** `src/components/`

Componentes sueltos sin carpetas temáticas:
```
- ActiveDeliveries.tsx
- AvailableOrders.tsx
- CardProfile.tsx
- CardService.tsx
- ChatModal.tsx
- Header.tsx
- HistoryFilters.tsx
- PendingPickups.tsx
- RealtimeExamples.tsx ⚠️ (EJEMPLO DE DESARROLLO)
- ServiceDetailModal.tsx
- _layout_old.tsx ⚠️ (ARCHIVO VIEJO)
```

**Problemas:**
- No hay separación por feature/rol
- `RealtimeExamples.tsx` parece ser un archivo de prueba
- `_layout_old.tsx` es un archivo antiguo que debe removerse

---

### 3. **SERVICIOS SIN ESTRUCTURA CLARA**
**Ubicación:** `src/services/`

```
- auth.ts
- chat.ts
- notifications.ts
- payments.ts
- profile.ts
- serviceHistory.ts
- services.admin.ts ⚠️ (Convención inconsistente)
- services.ts ⚠️ (Nombre genérico)
- storeZonePrices.ts
- stores.ts
- users.ts
- zones.ts
```

**Problemas:**
- Mixing de nombres: algunos con sufijo `Services.ts`, otros sin
- `services.ts` es demasiado genérico
- `services.admin.ts` debería ser `admin.ts`
- Falta categorización clara

---

### 4. **CARPETAS VACÍAS O INCOMPLETAS**
**Ubicación:** `src/`

```
- models/      ⚠️ Vacía o incompleta
- modules/     ⚠️ Vacía o incompleta
- providers/   ⚠️ Vacía o incompleta
```

Estas carpetas típicamente deberían contener tipos e interfaces importantes.

---

### 5. **DIVISIÓN DE CARACTERÍSTICAS NO CLARA**
**Ubicación:** `app/(protected)/`

```
(coordinator)/
client/
delivery/
shared/
store/
superadmin/
```

**Problema:** Aunque hay separación por rol, no está claro:
- Dónde van los tipos compartidos
- Dónde van los servicios compartidos
- Cómo se reutilizan componentes entre roles

---

### 6. **CONFIGURACIÓN INCORRECTA DE CONSTANTES**
**Ubicación:** `src/constans/` ⚠️ (¡TYPO! Debería ser `constants`)

Solo contiene `colors.ts`. Falta centralizar:
- URLs de API
- Timeouts
- Configuraciones de Supabase
- Mensajes de error
- Constantes de negocio

---

### 7. **ARCHIVO DE DEPURACIÓN EN CÓDIGO FUENTE**
**Ubicación:** `src/debug/testSupabase.ts`

No debe estar en el código fuente productivo.

---

### 8. **INCONSISTENCIAS EN IMPORTACIONES**
**Ubicación:** Toda la aplicación

Se usan diferentes estilos:
```typescript
// Estilo 1: Rutas relativas
import { useRealtimeListener } from '../hooks/useRealtimeListener';

// Estilo 2: Rutas absolutas con alias
import { useRealtimeListener } from '@/hooks/useRealtimeListener';
```

Sin estar claro cuál es el estándar.

---

### 9. **ARCHIVOS LEGADOS SIN LIMPIAR**
- `src/components/_layout_old.tsx` ⚠️

---

### 10. **SERVICIOS DE ÓRDENES FRAGMENTADOS**
Hay múltiples hooks para órdenes:
- `useCoordinatorOrdersRealtime.ts`
- `useDeliveryOrdersRealtime.ts`
- `useStoreOrdersRealtime.ts`

Sin un abstracción común reutilizable.

---

## ✅ LO QUE ESTÁ BIEN

1. ✓ Uso de Expo Router (app-based routing)
2. ✓ Separación por roles en las rutas
3. ✓ Integración con Supabase
4. ✓ Uso de TypeScript
5. ✓ Hooks personalizados para lógica compartida
6. ✓ Separación de servicios y componentes

---

## 📐 ESTRUCTURA RECOMENDADA

```
aliados_sistem_app/
├── app/                          # App Router (Expo Router)
│   ├── (auth)/                   # Screens de autenticación
│   │   └── login.tsx
│   ├── (protected)/              # Screens protegidas
│   │   ├── (coordinator)/
│   │   ├── (delivery)/
│   │   ├── (store)/
│   │   ├── (superadmin)/
│   │   ├── (client)/
│   │   └── shared/               # Screens compartidas
│   └── _layout.tsx
│
├── src/
│   ├── constants/                # ✏️ RENOMBRAR: constans → constants
│   │   ├── api.ts                # URLs, endpoints
│   │   ├── colors.ts
│   │   ├── messages.ts           # Mensajes de la app
│   │   ├── config.ts             # Timeouts, límites
│   │   └── index.ts              # Re-export
│   │
│   ├── types/                    # ✏️ NUEVO: Tipos globales
│   │   ├── services/
│   │   │   ├── orders.ts
│   │   │   ├── deliveries.ts
│   │   │   ├── payments.ts
│   │   │   ├── history.ts
│   │   │   └── index.ts
│   │   ├── models/
│   │   │   ├── user.ts
│   │   │   ├── store.ts
│   │   │   └── index.ts
│   │   └── api.ts                # Respuestas de API
│   │
│   ├── services/                 # API calls & business logic
│   │   ├── auth/
│   │   │   ├── auth.ts
│   │   │   ├── login.ts
│   │   │   └── index.ts
│   │   ├── orders/
│   │   │   ├── coordinator.ts
│   │   │   ├── delivery.ts
│   │   │   ├── store.ts
│   │   │   ├── common.ts        # Lógica compartida
│   │   │   └── index.ts
│   │   ├── deliveries/
│   │   │   ├── history.ts
│   │   │   └── index.ts
│   │   ├── payments/
│   │   │   └── index.ts
│   │   ├── users/
│   │   │   ├── profile.ts
│   │   │   └── index.ts
│   │   ├── notifications/
│   │   │   └── index.ts
│   │   ├── chat/
│   │   │   ├── messages.ts
│   │   │   └── index.ts
│   │   ├── zones/
│   │   │   └── index.ts
│   │   └── index.ts              # Re-export
│   │
│   ├── hooks/                    # Custom React Hooks
│   │   ├── realtime/
│   │   │   ├── useOrdersRealtime.ts      # Hook genérico
│   │   │   ├── useDeliveriesRealtime.ts
│   │   │   └── index.ts
│   │   ├── data/
│   │   │   ├── useServiceHistory.ts      # ✏️ ÚNICO hook
│   │   │   ├── useOrders.ts
│   │   │   └── index.ts
│   │   ├── ui/
│   │   │   ├── useModal.ts
│   │   │   ├── useLoading.ts
│   │   │   └── index.ts
│   │   ├── auth/
│   │   │   ├── useAuth.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── components/               # Componentes UI reutilizables
│   │   ├── common/               # Componentes de UI básicos
│   │   │   ├── Header.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Button.tsx
│   │   │   └── index.ts
│   │   ├── features/             # Componentes de negocio
│   │   │   ├── orders/
│   │   │   │   ├── ActiveDeliveries.tsx
│   │   │   │   ├── AvailableOrders.tsx
│   │   │   │   ├── ServiceDetailModal.tsx
│   │   │   │   └── index.ts
│   │   │   ├── delivery/
│   │   │   │   ├── PendingPickups.tsx
│   │   │   │   └── index.ts
│   │   │   ├── chat/
│   │   │   │   ├── ChatModal.tsx
│   │   │   │   └── index.ts
│   │   │   ├── profile/
│   │   │   │   ├── CardProfile.tsx
│   │   │   │   └── index.ts
│   │   │   └── history/
│   │   │       ├── HistoryFilters.tsx
│   │   │       └── index.ts
│   │   └── index.ts
│   │
│   ├── providers/                # Contextos y Providers
│   │   ├── AuthContext.tsx
│   │   ├── NotificationContext.tsx
│   │   ├── AppProvider.tsx       # Wrapper principal
│   │   └── index.ts
│   │
│   ├── utils/                    # Funciones utilitarias puras
│   │   ├── validation.ts
│   │   ├── formatters.ts
│   │   ├── serviceTypeUtils.ts
│   │   ├── errorHandling.ts
│   │   └── index.ts
│   │
│   ├── lib/                      # Librerías configuradas
│   │   ├── supabase.ts
│   │   ├── api.ts               # Axios configurado
│   │   ├── notifications.ts
│   │   ├── storage.ts           # AsyncStorage
│   │   └── index.ts
│   │
│   └── config/                   # ✏️ NUEVO: Configuración
│       ├── supabase.ts
│       ├── api.ts
│       └── index.ts
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── .env.local
├── app.json
├── tsconfig.json
├── package.json
├── ANALISIS_ESTRUCTURA.md       # Este archivo
└── README.md
```

---

## 🎯 PLAN DE ACCIÓN (Priorizado)

### Fase 1: LIMPIEZA (Riesgo Bajo)
1. ⚠️ Eliminar `src/components/_layout_old.tsx`
2. ⚠️ Eliminar `src/debug/testSupabase.ts`
3. ⚠️ Eliminar `src/components/RealtimeExamples.tsx` (si solo es de ejemplo)
4. Renombrar carpeta `src/constans/` → `src/constants/`

### Fase 2: CONSOLIDACIÓN DE HOOKS (Riesgo Medio)
1. Revisar `useServiceHistoryRealtime.ts` y asegurar que tiene TODO lo que necesitan los otros
2. Eliminar `useServiceHistory.ts`
3. Eliminar `useServiceHistoryOptimized.ts`
4. Renombrar `useServiceHistoryRealtime.ts` → `useServiceHistory.ts`

### Fase 3: REORGANIZACIÓN DE SERVICIOS (Riesgo Medio)
1. Crear estructura de carpetas en `services/`
2. Mover y renombrar servicios siguiendo patrón
3. Crear archivos `index.ts` para re-export

### Fase 4: REORGANIZACIÓN DE COMPONENTES (Riesgo Bajo-Medio)
1. Crear carpetas temáticas en `components/`
2. Mover componentes a sus carpetas
3. Crear `index.ts` en cada carpeta

### Fase 5: AGREGAR TIPOS (Riesgo Bajo)
1. Crear carpeta `src/types/`
2. Centralizar todas las interfaces
3. Exportar desde `types/index.ts`

### Fase 6: AGREGAR CONFIG (Riesgo Bajo)
1. Crear carpeta `src/config/`
2. Mover configuraciones centralizadas

### Fase 7: ESTANDARIZAR IMPORTACIONES (Riesgo Bajo)
1. Decidir entre rutas relativas o alias
2. Configurar `tsconfig.json` correctamente
3. Actualizar todos los imports

---

## 🔧 CONFIGURACIÓN DE ALIAS EN tsconfig.json

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@hooks/*": ["src/hooks/*"],
      "@services/*": ["src/services/*"],
      "@types/*": ["src/types/*"],
      "@utils/*": ["src/utils/*"],
      "@constants/*": ["src/constants/*"],
      "@lib/*": ["src/lib/*"]
    }
  }
}
```

---

## 📋 CHECKLIST DE MEJORAS

- [ ] Limpiar archivos legados
- [ ] Consolidar hooks de service history
- [ ] Reorganizar servicios
- [ ] Reorganizar componentes
- [ ] Crear carpeta de tipos centralizados
- [ ] Crear carpeta de config
- [ ] Estandarizar importaciones
- [ ] Documentar patrones de proyecto
- [ ] Crear guía de contribución
- [ ] Revisar providers y contextos

---

## 📚 PRÓXIMOS PASOS

1. **Revisar este análisis** con el equipo
2. **Priorizar cambios** según disponibilidad
3. **Crear feature branch** para cada fase
4. **Documentar** patrones establecidos
5. **Configurar linter** para mantener consistencia

---

## 📖 Referencias

- [React Native Project Structure Best Practices](https://reactnative.dev/)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
