# 🕐 Manejo de Fechas en Frontend - Colombia (UTC-5)

## Cambios Realizados

### 1. **Nuevas Utilidades de Fecha** ([src/utils/dateTime.ts](src/utils/dateTime.ts))

Funciones centralizadas para manejar fechas usando **zona local del dispositivo**:

```typescript
// Obtener fecha actual del dispositivo
getTodayLocalFormat() → "2026-02-06" (zona local)

// Formatear fechas para mostrar al usuario
formatDateLocal(isoString) → "6 de febrero de 2026"
formatDateTime(isoString) → "6 de febrero de 2026, 14:30"
formatTime(isoString) → "14:30"

// Utilidades para cálculos
addDays(date, days) → Nueva fecha
daysBetween(from, to) → Diferencia en días
startOfDay(date) → Inicio del día
endOfDay(date) → Final del día
```

### 2. **Analytics Screen** (AnalyticsScreen.tsx)

**Antes:**
```typescript
const [startDate, setStartDate] = useState(
  new Date().toISOString().split("T")[0] // ❌ Devuelve UTC
);
```

**Ahora:**
```typescript
import { getTodayLocalFormat } from "@/utils/dateTime";

const [startDate, setStartDate] = useState(getTodayLocalFormat());
// ✅ Devuelve fecha del dispositivo en zona local
```

### 3. **Date Range Selector** (AnalyticsDateRangeSelector.tsx)

**Botones rápidos:**
- **Hoy** → `getTodayLocalFormat()`
- **Últimos 7 días** → `addDays(today, -6)`
- **Últimos 30 días** → `addDays(today, -29)`

**Antes:**
```typescript
const handleToday = () => {
  const today = new Date().toISOString().split("T")[0]; // ❌ UTC
  onDateRangeChange(today, today);
};
```

**Ahora:**
```typescript
const handleToday = () => {
  const today = getTodayLocalFormat(); // ✅ Zona local
  onDateRangeChange(today, today);
};
```

### 4. **Tabla de Detalles** (AnalyticsDetailedTable.tsx)

**Fecha de completado:**
```typescript
// Antes
svc.completedAt ? new Date(svc.completedAt).toLocaleDateString() : "-"

// Ahora
svc.completedAt ? formatDateTime(svc.completedAt) : "-"
// Resultado: "6 de febrero de 2026, 14:30"
```

## Flujo Completo

### Escenario: Coordinador en Colombia a las 8:50 AM del 6 de febrero

```
┌─────────────┐
│ Dispositivo │
│ Colombia    │ (Configurado a UTC-5)
│ 6 feb       │
│ 08:50 AM    │
└────────────┘
        │
        ▼
[Frontend: AnalyticsScreen]
getTodayLocalFormat() → "2026-02-06" ✅

        │
        ▼
[User selecciona rango]
Hoy → startDate: "2026-02-06", endDate: "2026-02-06"

        │
        ▼
[Frontend envía al backend]
GET /analytics?startDate=2026-02-06&endDate=2026-02-06

        │
        ▼
[Backend: analytics.service.ts]
startOfDayColombiaToUTC("2026-02-06") → "2026-02-06T05:00:00Z"
endOfDayColombiaToUTC("2026-02-06") → "2026-02-07T04:59:59Z"

        │
        ▼
[BD Query]
WHERE created_at BETWEEN '2026-02-06T05:00:00Z' 
                   AND '2026-02-07T04:59:59Z'

        │
        ▼
[Resultados]
Servicios creados entre 00:00 y 23:59:59 de Colombia

        │
        ▼
[Frontend: Mostrar resultados]
Cada fecha se formatea con formatDateTime()
Resultado: "6 de febrero de 2026, 14:30" ✅
```

## Requisito Importante: Zona Horaria del Dispositivo

**El frontend funciona correctamente SOLO si:**

✅ El dispositivo está configurado en zona horaria **Colombia (UTC-5)**

### Para verificar:

**iOS:**
- Settings → General → Date & Time
- Debe mostrar: "Bogotá" o "Panamá"

**Android:**
- Settings → System → Date & Time
- Debe mostrar: "Colombia" o diferencia UTC-05:00

**Web (Chrome/Firefox):**
- El navegador usa la zona del sistema operativo
- Verificar en: https://www.timeanddate.com/worldclock/colombia/bogota

## Funciones Disponibles

### Obtener Fecha Actual
```typescript
import { getTodayLocalFormat } from "@/utils/dateTime";

const today = getTodayLocalFormat();
// Resultado: "2026-02-06"
```

### Formatear para Mostrar
```typescript
import { formatDateLocal, formatDateTime } from "@/utils/dateTime";

// Solo fecha
formatDateLocal("2026-02-06") → "6 de febrero de 2026"

// Fecha y hora
formatDateTime("2026-02-06T14:30:00Z") → "6 de febrero de 2026, 14:30"

// Solo hora
formatTime("2026-02-06T14:30:00Z") → "14:30"
```

### Cálculos de Fecha
```typescript
import { addDays, daysBetween, startOfDay, endOfDay } from "@/utils/dateTime";

// Sumar días
const futuro = addDays(new Date(), 5); // 5 días en el futuro

// Diferencia
const dias = daysBetween(fecha1, fecha2); // Número de días

// Inicio/Final del día
startOfDay(fecha) // 00:00:00
endOfDay(fecha)   // 23:59:59
```

### Parseando Fechas
```typescript
import { parseLocalDate } from "@/utils/dateTime";

const date = parseLocalDate("2026-02-06");
// Resultado: Date object de ese día a las 00:00:00
```

## Casos de Uso

### Caso 1: Filtrar Analytics por Rango
```typescript
handleLast7Days = () => {
  const today = new Date();
  const sevenDaysAgo = addDays(today, -6);
  
  onDateRangeChange(
    formatDateToYYYYMMDD(sevenDaysAgo), // "2026-01-31"
    formatDateToYYYYMMDD(today)          // "2026-02-06"
  );
};
```

### Caso 2: Mostrar Fecha de Servicio Completado
```typescript
<Text>
  {service.completedAt 
    ? formatDateTime(service.completedAt)
    : "No completado"}
</Text>

// Resultado: "6 de febrero de 2026, 14:30"
```

### Caso 3: Validar que sea Hoy
```typescript
import { isToday } from "@/utils/dateTime";

if (isToday("2026-02-06")) {
  console.log("Es hoy");  // True si hoy es 6 de febrero
}
```

## Componentes Actualizados

| Componente | Cambios |
|-----------|---------|
| AnalyticsScreen.tsx | ✅ Usa `getTodayLocalFormat()` |
| AnalyticsDateRangeSelector.tsx | ✅ Usa funciones de zona horaria local |
| AnalyticsDetailedTable.tsx | ✅ Usa `formatDateTime()` |

## Componentes por Actualizar (Próxima Fase)

- [ ] DeliveryPaymentSummaryScreen.tsx
- [ ] DeliveriesListScreen.tsx
- [ ] StorePaymentSummaryScreen.tsx
- [ ] PaymentRequestsListScreen.tsx
- [ ] UserProfileModal.tsx

## Validación

### Test 1: Fecha del Día Actual
```
1. Abrir Analytics
2. Verificar que muestre la fecha actual en zona local Colombia
3. Comparar con https://www.timeanddate.com/worldclock/colombia/bogota

Resultado esperado: ✅ Coinciden
```

### Test 2: Botón "Hoy"
```
1. Seleccionar fecha rango
2. Presionar "Hoy"
3. Verificar rango: startDate = endDate = hoy

Resultado esperado: ✅ Son iguales
```

### Test 3: Últimos 7 Días
```
1. Tocar "Últimos 7 días"
2. Verificar que include los últimos 7 días

Resultado esperado: ✅ Rango correcto
```

### Test 4: Mostrar Fechas Formateadas
```
1. Ver tabla de servicios
2. Verificar que muestre: "6 de febrero de 2026, 14:30"
3. NO debe mostrar: "Fri Feb 06 2026 19:30:00" (UTC)

Resultado esperado: ✅ Formato español
```

## Notas Importantes

### ⚠️ El Frontend ASUME Zona Horaria Colombia

Si el dispositivo está en otra zona:
- Mostrará fechas incorrectas
- Las peticiones al backend serán incorrectas

### 🔄 Sincronización Backend-Frontend

**Frontend envía:** `"2026-02-06"` (fecha local)
**Backend convierte:** a UTC para consultar BD
**BD responde:** en UTC
**Frontend muestra:** convertido a local

### 📱 Dispositivos Móviles (Expo / React Native)

El sistema automáticamente usa la zona del dispositivo. No requiere configuración adicional.

### 🌐 Web

Usa la zona del navegador, que hereda del sistema operativo.

---

## Resumen

✅ **Frontend:** Siempre usa zona local del dispositivo (getTodayLocalFormat)
✅ **Backend:** Convierte zona local → UTC para consultas
✅ **BD:** Almacena todo en UTC
✅ **Frontend:** Formatea respuestas a zona local para mostrar

**Resultado:** Usuario siempre ve fechas en su zona local (Colombia UTC-5)
