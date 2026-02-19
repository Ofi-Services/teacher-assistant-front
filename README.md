# Proyecto React + TypeScript + Redux + Tailwind

## Modo Actual: Mock (sin backend)

La aplicación está configurada para funcionar **sin backend**. Todas las llamadas API fueron reemplazadas por datos mock en memoria.

- No se requiere levantar servidor backend.
- Los módulos de cursos, líder, calendario y autenticación usan respuestas simuladas.
- El estado de sesión se guarda en `localStorage` (`ofi_user`, `ofi_token`).

### Login mock rápido

- `talent@ofi.mock` → rol `Talent`
- `leader@ofi.mock` → rol `Leader`
- `hr@ofi.mock` → rol `HR`

También puedes usar cualquier usuario/email; el rol se infiere por el texto (`leader`, `hr`) y en caso contrario se usa `Talent`.

## Estructura del Proyecto

Este proyecto sigue una arquitectura modular organizada principalmente por características (modules) con una capa compartida para elementos reutilizables. Esta estructura está diseñada para facilitar la escalabilidad, mantenibilidad y colaboración en equipos.

```
📂 src/
 ┣ 📂 assets/             # Recursos estáticos (imágenes, fuentes, etc.)
 ┣ 📂 config/             # Configuraciones globales de la aplicación
 ┣ 📂 core/               # Infraestructura central de la aplicación
 ┣ 📂 modules/           # Organización por características funcionales
 ┣ 📂 shared/             # Componentes, hooks y utilidades compartidas
 ┣ 📜 App.tsx             # Componente principal de la aplicación
 ┣ 📜 main.tsx            # Punto de entrada de la aplicación
 ┗ 📜 index.css           # Estilos globales
```

## Descripción de Módulos

### 📂 modules/

Contiene código organizado por características o funcionalidades de negocio. Cada feature es autocontenida y engloba todos los aspectos necesarios para implementar una funcionalidad específica.

```
📂 modules/
 ┣ 📂 auth/                  # Funcionalidad de autenticación
 ┃ ┣ 📂 components/          # Componentes específicos de autenticación
 ┃ ┣ 📂 pages/               # Páginas relacionadas con autenticación
 ┃ ┣ 📂 hooks/               # Hooks específicos de autenticación
 ┃ ┣ 📂 store/               # Estado Redux para autenticación
 ┃ ┣ 📂 types/               # Tipos TypeScript para autenticación
 ┃ ┣ 📂 services/            # Servicios API para autenticación
 ┃ ┣ 📂 utils/               # Utilidades específicas de autenticación
 ┃ ┗ 📜 index.ts             # Exportaciones públicas del módulo
 ┣ 📂 products/              # Funcionalidad de productos
 ┃ ┣ 📂 components/          # Componentes específicos de productos
 ┃ ┣ 📂 pages/               # Páginas de productos
 ┗ ...
```

**Propósito**: Cada feature encapsula toda la lógica, componentes, páginas y estado relacionados con una funcionalidad específica del negocio. Esto facilita el desarrollo en paralelo y mejora la cohesión del código.

### 📂 core/

Contiene la infraestructura central y servicios compartidos que dan soporte a toda la aplicación.

```
📂 core/
 ┣ 📂 api/                   # Configuración y utilidades para API
 ┃ ┣ 📜 apiClient.ts         # Cliente HTTP configurado
 ┃ ┣ 📜 interceptors.ts      # Interceptores de peticiones/respuestas
 ┃ ┗ 📜 endpoints.ts         # Definición centralizada de endpoints
 ┣ 📂 store/                 # Configuración central de Redux
 ┃ ┣ 📜 store.ts             # Configuración del store
 ┃ ┣ 📜 rootReducer.ts       # Combinación de reducers
 ┃ ┗ 📜 middleware.ts        # Middleware personalizado
 ┣ 📂 router/                # Configuración de enrutamiento
 ┃ ┣ 📜 AppRouter.tsx        # Componente principal de rutas
 ┃ ┣ 📜 routes.ts            # Definición de rutas
 ┃ ┗ 📜 guards.ts            # Protectores de rutas (auth guards)
 ┣ 📂 types/                 # Tipos globales
 ┃ ┣ 📜 global.d.ts          # Declaraciones de tipos globales
 ┃ ┗ 📜 models.ts            # Modelos de datos compartidos
 ┗ 📂 constants/             # Constantes globales
   ┣ 📜 config.ts            # Constantes de configuración
   ┗ 📜 errorMessages.ts     # Mensajes de error centralizados
```

**Propósito**: Proporciona la base técnica y servicios compartidos que utiliza toda la aplicación. Centraliza configuraciones críticas y garantiza consistencia en toda la aplicación.

### 📂 shared/

Contiene componentes, hooks, utilidades y otros elementos reutilizables compartidos por diferentes modules.

```
📂 shared/
 ┣ 📂 components/            # Componentes UI reutilizables
 ┃ ┣ 📂 ui/             # Botones y controles relacionados
 ┃ ┃ ┣ 📜 Button.tsx         # Componente de botón básico
 ┃ ┃ ┣ 📜 IconButton.tsx     # Botón con icono
 ┃ ┃ ┗ 📜 ButtonGroup.tsx    # Grupo de botones
 ┃ ┃ ┣ 📜 TextInput.tsx      # Input de texto
 ┃ ┃ ┣ 📜 Select.tsx         # Componente de selección
 ┃ ┃ ┗ 📜 Checkbox.tsx       # Checkbox
 ┃ ┃ ┗ ...
 ┃ ┣ 📂 layout/              # Componentes de estructura y layout
 ┃ ┃ ┣ 📜 Header.tsx         # Encabezado de página
 ┃ ┃ ┣ 📜 Footer.tsx         # Pie de página
 ┃ ┃ ┣ 📜 Sidebar.tsx        # Barra lateral
 ┃ ┃ ┗ 📜 Container.tsx      # Contenedor de layout
 ┃ ┗ 📂 data-display/        # Componentes para mostrar datos
 ┃   ┣ 📜 Card.tsx           # Tarjeta para contenido
 ┃   ┣ 📜 Table.tsx          # Tabla de datos
 ┃   ┗ 📜 Badge.tsx          # Insignia/etiqueta
 ┣ 📂 hooks/                 # Hooks personalizados reutilizables
 ┃ ┣ 📜 useForm.ts           # Hook para manejo de formularios
 ┃ ┣ 📜 useLocalStorage.ts   # Hook para localStorage
 ┃ ┣ 📜 useWindowSize.ts     # Hook para dimensiones de ventana
 ┃ ┣ 📜 useClickOutside.ts   # Hook para detectar clics fuera de un elemento
 ┃ ┣ 📜 useAppSelector.ts    # Hook personalizado para Redux selector
 ┃ ┗ 📜 useAppDispatch.ts    # Hook personalizado para Redux dispatch
 ┣ 📂 utils/                 # Utilidades reutilizables
 ┃ ┣ 📜 formatters.ts        # Funciones para formatear datos
 ┃ ┣ 📜 validators.ts        # Funciones de validación
 ┃ ┣ 📜 dateUtils.ts         # Utilidades para manejo de fechas
 ┃ ┗ 📜 stringUtils.ts       # Utilidades para manipulación de strings
 ┣ 📂 types/                 # Tipos compartidos
 ┃ ┣ 📜 common.types.ts      # Tipos comunes
 ┃ ┗ 📜 props.types.ts       # Tipos para props de componentes
 ┗ 
```

**Propósito**: Proporciona una biblioteca de componentes UI reutilizables, hooks y utilidades que mantienen consistencia visual y de comportamiento en toda la aplicación. Facilita implementar un sistema de diseño coherente y promueve la reutilización de código.

### 📂 assets/

Contiene recursos estáticos utilizados en toda la aplicación.

```
📂 assets/
 ┣ 📂 images/                # Imágenes e iconos
 ┃ ┣ 📂 icons/               # Iconos de la aplicación
 ┃ ┣ 📂 logos/               # Logos de la empresa/producto
 ┃ ┗ 📂 backgrounds/         # Imágenes de fondo
 ┣ 📂 fonts/                 # Fuentes tipográficas
 ┣ 📂 videos/                # Archivos de video
 ┗ 📂 animations/            # Animaciones (LOTTIE, etc.)
```

**Propósito**: Centraliza todos los recursos estáticos, facilitando su gestión y optimización.

### 📂 config/

Contiene configuraciones globales de la aplicación.

```
📂 config/
 ┣ 📜 app.config.ts          # Configuración general de la aplicación
 ┣ 📜 env.config.ts          # Configuración de variables de entorno
 ┣ 📜 i18n.config.ts         # Configuración de internacionalización
 ┣ 📜 theme.config.ts        # Configuración del tema (colores, espaciado, etc.)
 ┗ 📜 routes.config.ts       # Configuración centralizada de rutas
```

**Propósito**: Centraliza las configuraciones de la aplicación, facilitando cambios globales y adaptación a diferentes entornos.

## Directrices de Desarrollo

### Organización del Código

1. **Principio de responsabilidad única**: Cada archivo debe tener una única responsabilidad y razón para cambiar.
2. **Modularidad**: El código debe organizarse en módulos cohesivos con interfaces claras.
3. **Encapsulación**: Las implementaciones internas deben estar ocultas, exportando solo lo necesario.
4. **Reutilización**: Extraer componentes, hooks y utilidades comunes a la carpeta `shared`.

### Gestión del Estado

1. **Redux para estado global**: Usar Redux para estado compartido entre múltiples modules.
2. **React Context para estado de UI**: Utilizar Context API para estado de UI compartido dentro de un árbol de componentes.
3. **useState/useReducer para estado local**: Para estado específico de componente.

### Convenciones de Nomenclatura

1. **Componentes**: PascalCase (ej. `UserProfile.tsx`)
2. **Hooks**: camelCase con prefijo "use" (ej. `useAuth.ts`)
3. **Utilidades y servicios**: camelCase (ej. `formatDate.ts`, `authService.ts`)
4. **Tipos/Interfaces**: PascalCase (ej. `UserData.ts`)
5. **Archivos Redux**: camelCase con sufijo descriptivo (ej. `userSlice.ts`)

## Flujo de Trabajo con Redux

1. **Slices**: Definir slices con reducers, acciones y selectores.
2. **Thunks**: Usar thunks para lógica asíncrona.
3. **Selectors**: Usar selectores para acceder al estado.
4. **Hooks personalizados**: Encapsular la lógica de Redux en hooks reutilizables.

## Buenas Prácticas

1. **Código Tipado**: Utilizar TypeScript para todo el código.
2. **Pruebas**: Escribir pruebas unitarias y de integración para componentes y lógica.
3. **Lazy Loading**: Implementar carga diferida para rutas/modules grandes.
4. **Documentación**: Documentar componentes, hooks y funciones con JSDoc.
5. **Performance**: Optimizar renderizado con React.memo, useMemo y useCallback cuando sea necesario.
6. **Consistencia Visual**: Utilizar Tailwind CSS de manera consistente, creando abstracciones cuando sea necesario.
7. **Componentes Atómicos**: Diseñar componentes siguiendo principios de diseño atómico (átomos, moléculas, organismos).