# Refactorización del Modal de Servicios - Guía de Uso

## Descripción General

El componente `ServiceFormModalCoordinator` ha sido refactorizado siguiendo principios SOLID y buenas prácticas de React para mejorar:

- ✅ **Legibilidad**: El código es más limpio y fácil de seguir
- ✅ **Reutilización**: Componentes independientes pueden usarse en otros lugares
- ✅ **Mantenibilidad**: Lógica separada por responsabilidades
- ✅ **Testabilidad**: Componentes más pequeños y enfocados
- ✅ **Escalabilidad**: Fácil agregar nuevas secciones de formularios

---

## Estructura de Carpetas

```
components/
├── ServiceFormModalCoordinator.tsx    ← Componente principal
├── TabsNavigation.tsx                ← Navegación por pestañas
├── FormInputField.tsx                ← Campo de entrada reutilizable
├── PaymentSection.tsx                ← Sección de método de pago
├── StoreSelector.tsx                 ← Selector de tiendas
├── types.ts                          ← Interfaces TypeScript
│
└── forms/                            ← Formularios por tipo de servicio
    ├── DomiciliosForm.tsx
    ├── AliadosForm.tsx
    └── CoordinadoraForm.tsx

hooks/
├── useStoreSearch.ts                 ← Lógica de búsqueda de tiendas
└── useFormState.ts                   ← Gestión del estado del formulario
```

---

## Componentes Principales

### 1. **FormInputField.tsx**
Campo de entrada reutilizable con soporte para:
- Iconos personalizados
- Validación visual (efecto de foco)
- Múltiples tipos de teclado
- Contenido multilinea

```tsx
<FormInputField
  label="Dirección"
  iconName="location-outline"
  placeholder="Ej: Cra 10 #20-30"
  value={destination}
  onChange={setDestination}
  fieldKey="destination"
  focusedField={focusedField}
  onFocus={onFocus}
  onBlur={onBlur}
/>
```

### 2. **PaymentSection.tsx**
Sección reutilizable para seleccionar método de pago:
- Métodos: efectivo, transferencia, tarjeta
- Campo condicional para montos en efectivo
- Estilos consistentes

```tsx
<PaymentSection
  payment={payment}
  onPaymentChange={onPaymentChange}
  amount={amount}
  onAmountChange={onAmountChange}
  focusedField={focusedField}
  onFocus={onFocus}
  onBlur={onBlur}
/>
```

### 3. **StoreSelector.tsx**
Componente para seleccionar tiendas con búsqueda:
- Búsqueda en tiempo real
- Dropdown con resultados
- Indicador de carga
- Limpieza de selección

```tsx
<StoreSelector
  storeQuery={storeQuery}
  selectedStore={selectedStore}
  storeResults={storeResults}
  loadingStores={loadingStores}
  onSearch={onSearch}
  onSelectStore={onSelectStore}
  onClearStore={onClearStore}
  focusedField={focusedField}
  onFocus={onFocus}
  onBlur={onBlur}
/>
```

### 4. **TabsNavigation.tsx**
Navegación por pestañas tipada:
- Tabs: Domicilios, Paquetería Aliados, Paquetería Coordinadora
- Estilos activos/inactivos
- Totalmente reutilizable

```tsx
<TabsNavigation 
  activeTab={activeTab} 
  onTabChange={setActiveTab} 
/>
```

### 5. **Formularios Específicos** (DomiciliosForm, AliadosForm, CoordinadoraForm)
Cada uno maneja los campos específicos de su tipo:
- Composición de componentes reutilizables
- Props claramente documentadas
- Fácil de mantener y extender

---

## Custom Hooks

### useFormState.ts
Gestiona el estado de todos los campos del formulario:

```tsx
const formState = useFormState();

// Acceso a valores
formState.destination
formState.phone
formState.payment
// ... etc

// Setters disponibles
formState.setDestination("valor")
formState.setPhone("valor")

// Reset completo
formState.reset()
```

### useStoreSearch.ts
Encapsula la lógica de búsqueda de tiendas:

```tsx
const storeSearch = useStoreSearch(accessToken);

// Búsqueda automática
await storeSearch.handleSearchStores("query");

// Acceso a estados
storeSearch.selectedStore
storeSearch.storeResults
storeSearch.loadingStores

// Métodos
storeSearch.setSelectedStore(store)
storeSearch.reset()
```

---

## Cómo Agregar un Nuevo Tipo de Servicio

1. **Crear nuevo formulario** en `forms/` (ej: `NuevoServicioForm.tsx`)

```tsx
interface NuevoServicioFormProps {
  // Tus campos
  campo1: string;
  onCampo1Change: (value: string) => void;
  // ... resto de campos
  focusedField: string | null;
  onFocus: (fieldKey: string) => void;
  onBlur: () => void;
}

export const NuevoServicioForm: React.FC<NuevoServicioFormProps> = ({...}) => {
  return <View>{/* campos */}</View>
}
```

2. **Actualizar TabsNavigation.tsx**:

```tsx
const TABS: Array<{ key: TabType; label: string }> = [
  { key: "domicilios", label: "Domicilios" },
  { key: "aliados", label: "Paquetería Aliados" },
  { key: "coordinadora", label: "Paquetería Coordinadora" },
  { key: "nuevoServicio", label: "Nuevo Servicio" }, // ← Agregar aquí
];
```

3. **Actualizar types.ts**:

```tsx
export type TabType = "domicilios" | "aliados" | "coordinadora" | "nuevoServicio";
```

4. **Agregar nueva rama en ServiceFormModalCoordinator.tsx**:

```tsx
{activeTab === "nuevoServicio" && (
  <NuevoServicioForm
    campo1={formState.campo1}
    onCampo1Change={formState.setCampo1}
    // ... resto de props
    focusedField={focusedField}
    onFocus={(fieldKey) => setFocusedField(fieldKey)}
    onBlur={() => setFocusedField(null)}
  />
)}
```

---

## Ventajas de la Nueva Estructura

### Antes (Monolítico)
- 460 líneas en un único archivo
- Lógica mezclada de formulario, estado, búsqueda
- Difícil de testear
- Difícil de reutilizar componentes

### Después (Modular)
- Componentes pequeños y enfocados (~80-120 líneas cada uno)
- Responsabilidades separadas
- Fácil de testear unitariamente
- Componentes reutilizables en otros módulos
- Más fácil de debuggear

---

## Próximas Mejoras (Opcional)

1. **Validación de Campos**: Crear `useFormValidation` hook
2. **Persistencia**: Guardar estado en AsyncStorage
3. **Integración API**: Integrar `handleSubmit` con backend
4. **Tests**: Crear tests unitarios para cada componente
5. **Error Handling**: Mejor manejo de errores y mensajes

---

## Notas

- Todos los estilos se conservan del original
- Compatible con el tema actual de colores
- Sin cambios en la API del componente principal
- Lista para agregar nuevos tipos de servicios fácilmente
