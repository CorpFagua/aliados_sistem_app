# 📋 Historial Screen - Manejo de Fechas Local

## Cambios Realizados

### 1. **HistoryFilters.tsx** ✅

Actualizado para usar zona horaria local del dispositivo en todos los cálculos de fecha:

```typescript
// Antes: ❌
const formatISO = (d: Date) => d.toISOString().slice(0, 10);

// Ahora: ✅
const formatISO = (d: Date) => formatDateToYYYYMMDD(d);
```

**Imports agregados:**
```typescript
import { formatDateToYYYYMMDD, getTodayLocalFormat } from "../utils/dateTime";
```

**Cambios específicos:**

#### Inicialización del Calendario
```typescript
// Antes: Usaba la fecha UTC actual
const [calendarMonth, setCalendarMonth] = useState(() => new Date());

// Ahora: Usa la fecha local correcta
const [calendarMonth, setCalendarMonth] = useState(() => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1);
});
```

#### Parseo de Límites del Calendario
```typescript
// EN getCalendarLimits()
if (startDate) {
  // Parsear la fecha YYYY-MM-DD en zona local
  const [year, month, day] = startDate.split('-').map(Number);
  minMonth = new Date(year, month - 1, 1);
}
```

### 2. **Flujo Completo del Historial**

```
┌─────────────────────┐
│ HistorialScreen.tsx │
└──────────┬──────────┘
           │
           ▼
┌────────────────────────────────────────┐
│ useServiceHistoryRealtime (hook)       │
├────────────────────────────────────────┤
│ • Maneja caché inteligente             │
│ • Suscripciones en tiempo real         │
│ • Paginación (50 elementos por batch) │
└──────────┬───────────────────────────┘
           │
           ▼
┌────────────────────────────────────────┐
│ HistoryFilters.tsx                     │
├────────────────────────────────────────┤
│ • Búsqueda (debounce 300ms)           │
│ • Filtros: Tipo, Estado, Pago         │
│ • Calendario con zoom horario local   │
│ • Selector de Domiciliarios           │
│ Envía: { startDate, endDate, ... }   │
└──────────┬───────────────────────────┘
           │
           ▼
┌────────────────────────────────────────┐
│ fetchServiceHistory()                  │
│ serviceHistory.ts                      │
├────────────────────────────────────────┤
│ Construye URLSearchParams:             │
│ • startDate: "2026-02-06"             │
│ • endDate: "2026-02-28"               │
│ • Otros filtros...                    │
│                                        │
│ GET /coordinator/history?...          │
└──────────┬───────────────────────────┘
           │
          (HTTP)
           │
           ▼
┌────────────────────────────────────────┐
│ Backend                                │
│ history.service.ts                    │
├────────────────────────────────────────┤
│ • Recibe: startDate="2026-02-06"     │
│ • Convierte a UTC:                    │
│   - startOfDayColombiaToUTC()         │
│   - endOfDayColombiaToUTC()           │
│ • Query BD entre timestamps UTC       │
│ • Devuelve servicios en UTC           │
└──────────┬───────────────────────────┘
           │
          (HTTP Response)
           │
           ▼
┌────────────────────────────────────────┐
│ Frontend                               │
│ CardService / HistorialScreen         │
├────────────────────────────────────────┤
│ • Recibe: { createdAt: "..." }       │
│ • Muestra con formatDateTime()        │
│ • Usuario ve: "6 de febrero, 14:30"  │
└────────────────────────────────────────┘
```

## Ejemplo: Filtrar Servicios del 6 de Febrero

### Usuario elige rango: 6-26 de febrero

1. **Frontend (HistoryFilters)**
   - Usuario selecciona 6 en calendario
   - Se guarda: `startDate = "2026-02-06"`
   - Usuario selecciona 26 en calendario
   - Se guarda: `endDate = "2026-02-26"`

2. **Frontend (applyFilters)**
   ```typescript
   handleFiltersChange({
     startDate: "2026-02-06",
     endDate: "2026-02-26",
     offset: 0
   })
   ```

3. **Frontend (fetchServiceHistory)**
   ```typescript
   GET /coordinator/history?startDate=2026-02-06&endDate=2026-02-26&...
   ```

4. **Backend (history.service.ts)**
   ```typescript
   // Convierte a UTC
   startDate = "2026-02-06T05:00:00Z"  (medianoche Colombia)
   endDate = "2026-02-27T04:59:59Z"    (23:59:59 Colombia del 26)
   
   // Query BD
   WHERE created_at >= '2026-02-06T05:00:00Z'
   AND   created_at <= '2026-02-27T04:59:59Z'
   ```

5. **Respuesta**
   - Array de servicios con `createdAt` en UTC
   - Frontend formatea con `formatDateTime()`
   - Usuario ve fechas locales correctas

## Componentes en el Flujo

### 1. HistorialScreen.tsx
```typescript
// Inicializa el hook
const { getServiceHistory } = useServiceHistoryRealtime(token);

// Carga datos iniciales
useEffect(() => {
  if (session?.access_token) {
    loadInitialHistory();
  }
}, [session?.access_token]);

// Aplica filtros con fechas locales
handleFiltersChange = (newFilters) => {
  applyFilters(newFilters); // startDate y endDate están en zona local
}
```

### 2. HistoryFilters.tsx
```typescript
// Usar zona local en SELECT DE FECHAS
const formatISO = (d: Date) => formatDateToYYYYMMDD(d); // ✅ Zona local

// Calendario usa fecha local
const onPickDate = (d: Date) => {
  const iso = formatISO(d); // Convierte a YYYY-MM-DD local
  handleDateRangeChange(iso);
}
```

### 3. useServiceHistoryRealtime.ts
```typescript
// Filtra localmente por fecha
if (filters.startDate || filters.endDate) {
  result = result.filter((s) => {
    const serviceDate = s.createdAt?.split('T')?.[0] || '';
    if (filters.startDate && serviceDate < filters.startDate) return false;
    if (filters.endDate && serviceDate > filters.endDate) return false;
    return true;
  });
}
```

### 4. serviceHistory.ts
```typescript
// Envía parámetros al backend
export async function fetchServiceHistory(token, filters) {
  const params = new URLSearchParams();
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  // ... otros filtros
  
  GET /coordinator/history?startDate=2026-02-06&endDate=2026-02-26&...
}
```

## Casos de Uso

### Caso 1: Filtrar "Hoy"
```
1. Usuario abre HistoryFilters
2. HistoryFilters obtiene: getTodayLocalFormat() → "2026-02-06"
3. Establece: startDate="2026-02-06", endDate="2026-02-06"
4. Backend recibe ambas fechas y busca servicios del 6 de febrero
5. Resultado: ✅ Todos los servicios del 6 en zona local
```

### Caso 2: Filtrar "Últimos 7 días"
```
1. Hora actual: 2026-02-06 (sin importar la hora)
2. Calcula: end = 2026-02-06, start = 2026-01-31
3. Envía: startDate="2026-01-31", endDate="2026-02-06"
4. Backend busca 7 días completos
5. Resultado: ✅ Todos los servicios de esa semana
```

### Caso 3: Cambio de Estado en Tiempo Real
```
1. Delivery completa un servicio
2. Estado cambia: "entregado"
3. Hook se suscribe a cambios en Supabase
4. Servicio se actualiza en lista instantáneamente
5. Mostrado con fecha local correcta
```

## Validación

### Test 1: Calendario Muestra Fecha Local
```
1. Abrir HistoryFilters
2. Tocar icono de fecha
3. Verificar que el calendario muestre el mes actual de Colombia
4. Seleccionar fecha 6 de febrero
5. Resultado esperado: startDate = "2026-02-06" ✅
```

### Test 2: Filtro por Rango
```
1. Seleccionar: 1-28 de febrero
2. Ejecutar filtro
3. Verificar que muestra solo servicios de febrero
4. Contar servicios mostrados vs. BD
5. Resultado esperado: ✅ Coinciden exactamente
```

### Test 3: Búsqueda Combinada
```
1. Aplicar: Rango (1-28 feb) + Estado (Entregado) + Tipo (Domicilio)
2. Verificar que muestra solo servicios que cumplen TODO
3. Resultado esperado: ✅ Filtros se aplican correctamente
```

### Test 4: Carga Infinita
```
1. Scroll hasta el final
2. Verificar que carga más servicios
3. Resultado esperado: ✅ Lista se expande
```

## Importante: Dependencias

Todos los componentes de filtro **dependen** de:

1. ✅ **dateTime.ts** - Funciones de conversión de zona horaria
2. ✅ **history.service.ts** - API calls
3. ✅ **useServiceHistoryRealtime.ts** - Lógica de datos
4. ✅ **Backend** - Conversión de UTC correcta

## Notas de Implementación

### Fecha Local del Dispositivo
- Cada función usa `new Date()` que **SIEMPRE** respeta la zona del dispostivo
- No hay conversión manual a UTC en el frontend
- Si el dispositivo está en Colombia, funciona perfecto
- Si está en otra zona, mostrará datos incorrectos (necesita JS runtime con zona correcta)

### Sincronización Frontend-Backend
```
Frontend (YYYY-MM-DD local)
   ↓
Backend (convierte a UTC)
   ↓
BD (almacena UTC)
   ↓
Backend (devuelve UTC)
   ↓
Frontend (muestra convertido a local)
```

### Caching
- Cache local de 50 elementos por batch
- Duraciones: 5 minutos
- Búsquedas limpian caché
- Cambios de filtro reinician desde offset 0

---

## Resumen

✅ **Frontend:** Usa zona local devicedelassatodo  
✅ **Backend:** Convierte zona local → UTC  
✅ **BD:** Almacena UTČ  
✅ **Mostrado:** Formateado a zona local  

**Resultado:** Usuario siempre ve fechas correctas en su zona local (Colombia UTC-5)
