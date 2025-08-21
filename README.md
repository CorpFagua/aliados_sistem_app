# aliados_sistem_app
# Estructura del proyecto React Native con TypeScript y roles de usuario
/project-root
│── app/                        
│   ├── App.tsx                 # App principal
│   └── index.js                # Registro de la app
│
│── src/
│   ├── assets/                 # Recursos estáticos
│   │   ├── fonts/
│   │   ├── images/
│   │   └── icons/
│   │
│   ├── components/             # Componentes globales (reutilizables)
│   │   ├── ui/                 # UI atómica (Button, Input, Modal)
│   │   ├── layouts/            # Layouts globales (Header, Footer)
│   │   └── shared/             # Cards, ListItem, LoadingSpinner, etc.
│   │
│   ├── modules/                # Feature-based
│   │   ├── auth/               # Autenticación
│   │   │   ├── screens/        # Login, Register, ForgotPassword
│   │   │   ├── components/     # Forms, Inputs
│   │   │   ├── hooks/          # useAuth
│   │   │   └── services/       # authService.ts
│   │   │
│   │   ├── orders/             # Pedidos
│   │   │   ├── screens/        # Lista, Detalle, Crear pedido
│   │   │   ├── components/     # PedidoCard, Filtros
│   │   │   ├── hooks/          # useOrders, useOrderDetail
│   │   │   └── services/       # orderService.ts
│   │   │
│   │   ├── products/           # Productos (si aplica marketplace)
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
│   │   ├── AuthNavigator.tsx   # Stack Auth
│   │   ├── TabNavigator.tsx    # Tabs globales
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
