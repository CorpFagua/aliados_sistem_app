# 📱 aliados_sistem_app
_Estructura del proyecto **React Native + TypeScript** con arquitectura modular y soporte de múltiples roles de usuario._

---

## 📂 Estructura de carpetas

```bash
/project-root
│── app/                        
│   ├── App.tsx                 # Componente raíz de la aplicación
│   └── index.js                # Punto de entrada (registro de la app)
│
│── src/
│   ├── assets/                 # Recursos estáticos (imágenes, fuentes, íconos)
│   │   ├── fonts/
│   │   ├── images/
│   │   └── icons/
│   │
│   ├── components/             # Componentes globales y reutilizables
│   │   ├── ui/                 # Elementos UI atómicos (Button, Input, Modal)
│   │   ├── layouts/            # Layouts generales (Header, Footer, etc.)
│   │   └── shared/             # Reusables (Cards, ListItem, LoadingSpinner, etc.)
│   │
│   ├── modules/                # Feature-based (módulos por dominio)
│   │   ├── auth/               # Autenticación
│   │   │   ├── screens/        # Login, Register, ForgotPassword
│   │   │   ├── components/     # Formularios, Inputs
│   │   │   ├── hooks/          # useAuth
│   │   │   └── services/       # authService.ts
│   │   │
│   │   ├── orders/             # Pedidos
│   │   │   ├── screens/        # Lista, Detalle, Crear pedido
│   │   │   ├── components/     # PedidoCard, Filtros
│   │   │   ├── hooks/          # useOrders, useOrderDetail
│   │   │   └── services/       # orderService.ts
│   │   │
│   │   ├── products/           # Productos (marketplace opcional)
│   │   │   ├── screens/        
│   │   │   ├── components/     
│   │   │   └── services/       
│   │   │
│   │   ├── users/              # Roles centralizados
│   │   │   ├── client/         # Cliente
│   │   │   │   ├── screens/    # Perfil, MisPedidos, Configuración
│   │   │   │   ├── components/ # DirecciónCard, PedidoHistorialItem
│   │   │   │   ├── hooks/      # useClientOrders, useClientProfile
│   │   │   │   └── services/   # clientService.ts
│   │   │   │
│   │   │   ├── delivery/       # Domiciliario
│   │   │   │   ├── screens/    # PedidosAsignados, Historial, Perfil
│   │   │   │   ├── components/ # PedidoCardAsignado, RutaMapa
│   │   │   │   ├── hooks/      # useDeliveryOrders
│   │   │   │   └── services/   # deliveryService.ts
│   │   │   │
│   │   │   ├── admin/          # Administrador de tienda
│   │   │   │   ├── screens/    # GestiónPedidos, GestiónProductos, Reportes
│   │   │   │   ├── components/ # PedidoCardAdmin, ReportTable
│   │   │   │   ├── hooks/      # useAdminOrders
│   │   │   │   └── services/   # adminService.ts
│   │   │   │
│   │   │   ├── superadmin/     # Super Administrador
│   │   │   │   ├── screens/    # Dashboard, Estadísticas, GestiónRoles
│   │   │   │   ├── components/ # DashboardCard, UserTable
│   │   │   │   ├── hooks/      # useDashboardStats
│   │   │   │   └── services/   # superAdminService.ts
│   │   │   │
│   │   │   └── shared/         # Comunes a todos los roles
│   │   │       ├── screens/    # Perfil genérico, Configuración
│   │   │       ├── components/ # UserAvatar, UserForm
│   │   │       └── hooks/      # useUser
│   │
│   ├── navigation/             # Navegación centralizada
│   │   ├── AppNavigator.tsx    # Navegador raíz (elige stack por rol)
│   │   ├── AuthNavigator.tsx   # Stack de autenticación
│   │   ├── TabNavigator.tsx    # Tabs principales
│   │   ├── DrawerNavigator.tsx # Drawer (si aplica)
│   │   └── roleNavigators/     # Navegadores por rol
│   │       ├── ClientNavigator.tsx
│   │       ├── DeliveryNavigator.tsx
│   │       ├── AdminNavigator.tsx
│   │       └── SuperAdminNavigator.tsx
│   │
│   ├── hooks/                  # Hooks globales
│   ├── contexts/               # Contextos globales (AuthContext, ThemeContext)
│   ├── services/               # Servicios globales (api.ts, firebase.ts, pushNotifications.ts)
│   ├── store/                  # Estado global (Redux, Zustand, Recoil)
│   ├── utils/                  # Helpers, validaciones, formateadores
│   ├── theme/                  # Estilos globales (colores, tipografía, dark/light)
│   └── types/                  # Tipos e interfaces TS
│
├── tests/                      # Tests unitarios y e2e
├── .env                        # Variables de entorno
├── package.json
└── tsconfig.json
